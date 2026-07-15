# CarbonManager — 交接開發指南

> 本文件適用於接手此專案的新開發者，提供快速上手所需的架構說明、部署流程、環境設定及擴充方向。

---

## 目錄

1. [專案概述](#1-專案概述)
2. [整體架構](#2-整體架構)
3. [服務說明](#3-服務說明)
4. [資料庫 Schema](#4-資料庫-schema)
5. [環境變數設定](#5-環境變數設定)
6. [本地開發啟動](#6-本地開發啟動)
7. [Makefile 常用指令](#7-makefile-常用指令)
8. [生產部署](#8-生產部署)
9. [API 總覽](#9-api-總覽)
10. [前端頁面結構](#10-前端頁面結構)
11. [區塊鏈上鏈流程](#11-區塊鏈上鏈流程)
12. [資料庫 Migration 管理](#12-資料庫-migration-管理)
13. [彈性與可擴充點](#13-彈性與可擴充點)
14. [常見問題 / 注意事項](#14-常見問題--注意事項)

---

## 1. 專案概述

**CarbonManager** 是一套全端 Web 應用，用於追蹤與管理產品的碳足跡（Carbon Footprint）。

- 企業（shop）可以建立產品類型（Product Type）與產品（Product），並為每個產品的生命週期各階段新增碳排放記錄（Emission）。
- 系統支援將排放記錄上鏈（透過 Quorum 私有區塊鏈）以達到不可竄改性。
- 可產生產品碳足跡 Excel 報告。
- 消費者（customer）帳號目前為保留角色，功能尚未完整。

---

## 2. 整體架構

```
+-------------------+         HTTPS / port 80/443
|   使用者瀏覽器     | ─────────────────────────────────────+
+-------------------+                                     |
                                                          v
                                              +─────────────────────+
                                              |  Frontend (Nginx)   |
                                              |  React + Vite + TS  |
                                              |  port 80 / 443      |
                                              +──────────┬──────────+
                                                         │ /api/* 反向代理
                                                         v
+─────────────────────+       MySQL         +────────────────────────+
|  chain-service      │ <── callback ──── > |  Backend (Flask)       |
|  Node.js + Ethers   │                     |  Python 3.11           |
|  port 3001          │                     |  port 5001 (host)      |
+──────────┬──────────+                     +───────────┬────────────+
           │ Quorum RPC                                  │
           v                                             v
   Quorum 私有鏈                             +────────────────────────+
   (外部節點)                                |  MySQL 8.0 (db)        |
                                            |  port 設於 .env         |
                                            +────────────────────────+
```

### Docker 網路

| 網路名稱              | 說明                                                |
|--------------------|---------------------------------------------------|
| `carbonmanager_net` | 內部網路；db、backend、frontend、chain-service 共用  |
| `shared-net`        | 外部網路（external），chain-service 同時掛載，方便跨 compose 溝通 |

---

## 3. 服務說明

| 服務              | 技術                         | 對外 Port         | 角色                            |
|-----------------|------------------------------|------------------|---------------------------------|
| `db`            | MySQL 8.0                    | `.env:MYSQL_PORT`| 主要資料儲存                     |
| `migrator`      | Python (一次性容器)            | 無               | 啟動時自動套用 SQL migrations    |
| `backend`       | Flask + Gunicorn (Python)    | `5001`           | REST API 服務器                  |
| `frontend`      | React/Vite + Nginx           | `80` / `443`     | SPA 前端 + 反向代理到後端         |
| `chain-service` | Node.js + Express + Ethers.js| `3001`           | 與 Quorum 區塊鏈互動              |

### Backend 目錄結構

```
backend/
├── app.py              # Flask 應用程式進入點；Swagger UI 掛載於 /
├── config.py           # 設定類別（JWT、DB、Debug）
├── db_connection.py    # MySQL 連線池封裝
├── requirements.txt    # Python 相依套件
├── openapi.yaml        # OpenAPI 3.0 規格（Swagger UI 用）
├── models/             # 直接操作資料庫的函式
│   ├── user_model.py
│   ├── organizations_model.py
│   ├── product_types_model.py
│   ├── products_model.py
│   ├── emissions_model.py
│   ├── factor_model.py
│   ├── chain_model.py
│   └── steps_model.py
├── routes/             # API 路由（Blueprint）
│   ├── auth.py         # 註冊 / 登入 / 登出
│   ├── products.py     # 產品 CRUD
│   ├── product_types.py# 產品類型 CRUD
│   ├── emissions.py    # 排放記錄 CRUD
│   ├── factor.py       # 排放係數查詢
│   ├── onchain.py      # 觸發上鏈 & 接收 callback
│   ├── report.py       # 產生 Excel 報告下載
│   └── helpers.py      # 通用工具（display_id 編碼等）
├── report/
│   ├── report_template.xlsx  # Excel 報告範本
│   └── records/              # 已生成的報告 JSON 暫存
├── store_factors/      # 政府排放係數 seed 腳本
└── store_tags/         # 階段標籤 seed 腳本
```

### Chain-Service 目錄結構

```
chain-service/
├── src/index.js        # Express API；/send 觸發上鏈，/health 健康檢查
├── contracts/
│   ├── RecordStorage.json  # 已部署 Smart Contract 的 ABI
│   └── checkRecords.js     # 手動查詢鏈上記錄的工具腳本
└── .env                # 區塊鏈專屬環境變數（見下方說明）
```

---

## 4. 資料庫 Schema

```
organizations
    └── users (shop/customer)
    └── product_types
            └── products
                    └── emissions
                            └── emissions_onchain (上鏈狀態追蹤)
factors          (排放係數，seed 自政府資料)
emission_stages  (固定：原料/製造/配送/使用/廢棄 等階段)
stage_tags       (每個階段的標籤)
steps            (產品生命週期步驟)
schema_migrations (已套用的 migration 紀錄)
```

### 主要資料表說明

| 資料表               | 說明                                               |
|--------------------|--------------------------------------------------|
| `organizations`    | 公司 / 組織，每個 shop 用戶屬於一個組織            |
| `users`            | 用戶，角色分 `shop`（管理者）和 `customer`         |
| `product_types`    | 組織底下的產品類別                                  |
| `products`         | 實際產品，帶有序號（serial_number）與 SKU（code）  |
| `emissions`        | 每筆碳排放記錄（factor × quantity = emission_amount）|
| `factors`          | 排放係數主表（來源：政府公告數據）                  |
| `emission_stages`  | 系統固定的生命週期階段列表                          |
| `stage_tags`       | 每個階段的活動標籤                                  |
| `emissions_onchain`| 追蹤每筆 emission 的上鏈進度（pending/submitted/confirmed/failed）|

### display_id 編碼規則

後端所有對外 ID 都以前綴字串編碼，避免洩漏資料庫自增 ID：

| 資料表          | 前綴  | 範例          |
|--------------|------|-------------|
| organizations| `ORG`| `ORG000001` |
| products     | `PRD`| `PRD000042` |
| product_types| `PRT`| `PRT000010` |
| emissions    | `EMS`| `EMS000005` |
| stage_tags   | `TAG`| `TAG000003` |
| steps        | `STP`| `STP000007` |

---

## 5. 環境變數設定

### 根目錄 `.env`（主要服務用）

```env
# MySQL
MYSQL_DATABASE=carbon_footprint
MYSQL_USER=carbonuser
MYSQL_PASSWORD=your_password
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_PORT=3306

# Backend (Flask)
JWT_SECRET_KEY=your_jwt_secret_key
FLASK_DEBUG=false

# Chain webhook secret（backend 驗證 chain-service 的 callback）
CHAIN_WEBHOOK_SECRET=your_webhook_secret
```

### `chain-service/.env`（區塊鏈服務專用）

```env
# Quorum 節點 RPC
QUORUM_RPC_URL=http://<quorum-node-ip>:8545

# 帳戶私鑰（用於簽署交易）
QUORUM_PRIVATE_KEY=0x...

# 已部署的 Smart Contract 地址
CONTRACT_ADDRESS=0x...

# Backend callback URL（上鏈後回傳結果）
CALLBACK_URL=http://backend:5001/onchain/emissions/callback

# 與 backend 驗證用的 secret
CHAIN_SECRET=your_webhook_secret
```

> **重要**：`.env` 和 `chain-service/.env` 均不得 commit 進版本控制。

---

## 6. 本地開發啟動

### 前置需求

- Docker Desktop（含 Docker Compose v2+）
- Git

### 步驟

```bash
# 1. 複製專案
git clone <repo-url>
cd CarbonManager

# 2. 建立環境變數檔
cp .env.example .env          # 若有範本，否則手動建立（見第5節）
cp chain-service/.env.example chain-service/.env

# 3. 首次建置（只有第一次需要）
make backend-build

# 4. 啟動所有服務
make up
# 等同於：db-up → migrate → backend-up → frontend-up → chain-up

# 5. 初始化種子資料（選用，本機測試用）
make seed
```

### 服務對應 URL

| 服務         | URL                          |
|------------|------------------------------|
| 前端          | http://localhost             |
| 後端 API      | http://localhost:5001        |
| Swagger UI   | http://localhost:5001/       |
| Chain Service| http://localhost:3001        |
| Chain 健康檢查 | http://localhost:3001/health |

---

## 7. Makefile 常用指令

```bash
make help               # 查看所有可用指令

# === 啟停 ===
make up                 # 啟動全部服務（標準流程）
make down               # 停止全部服務

# === 資料庫 ===
make db-up              # 只啟動 MySQL
make db-reset           # ⚠️ 清空並重建 DB（會刪除所有資料）
make db-shell           # 進入 MySQL shell
make db-show-tables     # 顯示所有資料表
make db-desc-<table>    # 顯示指定資料表結構 (e.g. make db-desc-emissions)

# === Migration ===
make migrate            # 套用尚未執行的 migration
make migrations         # 列出已套用的 migration 紀錄

# === 後端 ===
make backend-build      # 重新建置後端 image
make backend-logs       # 追蹤後端 log

# === 種子資料 ===
make seed               # 套用全部種子資料（dev + factors + tags）
make seed-dev           # 僅套用開發用 SQL seed
make seed-factors       # 匯入排放係數
make seed-tags          # 匯入階段標籤

# === Chain Service ===
make up-chain           # 啟動 chain-service
make rebuild-chain      # 重新建置 chain-service image
make logs-chain         # 追蹤 chain-service log

# === 部署 ===
make deploy-prod        # 生產部署（完整流程）
make deploy-prod-app    # 只更新 app 容器（不走 migration）
make ssl                # 更新 SSL 憑證（Let's Encrypt）
```

---

## 8. 生產部署

### 目標環境

- 網域：`cfp.sssun.com`
- SSL：Let's Encrypt（存放於 `/etc/letsencrypt/live/cfp.sssun.com/`）

### 部署腳本邏輯（`scripts/deploy.sh`）

```
full 模式（完整部署）：
  1. git pull --rebase
  2. docker compose build（重新建置所有 image）
  3. 執行 migrator（套用 SQL migrations）
  4. 重啟 backend、frontend、chain-service

app 模式（快速更新，不跑 migration）：
  1. docker compose build
  2. 重啟 app 容器（不跑 migrator）

migrate 模式（只跑 migrations）：
  docker compose run --rm migrator
```

### 執行部署

```bash
# 完整生產部署
bash scripts/deploy.sh full
# 或
make deploy-prod

# 只更新 app（程式碼改動但無 schema 變更時）
make deploy-prod-app

# 憑證更新
make ssl
```

### SSL 憑證掛載

`docker-compose.yml` 中 frontend 容器會掛載宿主機的 Let's Encrypt 憑證：

```yaml
volumes:
  - /etc/letsencrypt/live/cfp.sssun.com/fullchain.pem:/etc/ssl/certs/fullchain.pem:ro
  - /etc/letsencrypt/live/cfp.sssun.com/privkey.pem:/etc/ssl/certs/privkey.pem:ro
```

---

## 9. API 總覽

> 完整 API 規格請查閱 Swagger UI：`http://localhost:5001/`（後端根路徑）。

### 認證 `/auth`

| Method | Path              | 說明                          |
|--------|-------------------|-------------------------------|
| POST   | `/auth/register`  | 註冊（shop / customer）         |
| POST   | `/auth/login`     | 登入，回傳 access_token + refresh_token |
| POST   | `/auth/refresh`   | 刷新 access token             |
| DELETE | `/auth/user`      | 刪除帳號                       |

所有需要認證的 API 需在 Header 帶：
```
Authorization: Bearer <access_token>
```

### 產品類型 `/product-types`

| Method | Path                                 | 說明            |
|--------|--------------------------------------|-----------------|
| GET    | `/product-types`                      | 列出組織所有類型  |
| POST   | `/product-types`                      | 建立產品類型     |
| GET    | `/product-types/:id/products`         | 列出類型下的產品 |
| POST   | `/product-types/:id/products`         | 建立產品         |

### 產品 `/products`

| Method | Path                                       | 說明               |
|--------|--------------------------------------------|--------------------|
| GET    | `/products/:productId`                     | 取得產品詳情        |
| PUT    | `/products/:productId`                     | 更新產品            |
| DELETE | `/products/:productId`                     | 刪除產品            |
| GET    | `/products/:productId/emissions`           | 取得產品排放記錄清單 |
| POST   | `/products/:productId/emissions`           | 新增排放記錄        |
| GET    | `/products/:productId/emissions/summary`   | 取得排放摘要        |

### 排放記錄 `/emissions`

| Method | Path                       | 說明                   |
|--------|----------------------------|------------------------|
| GET    | `/emissions`               | 取得組織所有排放記錄    |
| GET    | `/emissions/:id`           | 取得單筆排放記錄        |
| PUT    | `/emissions/:id`           | 更新排放用量            |
| DELETE | `/emissions/:id`           | 刪除排放記錄            |

### 上鏈 `/onchain`

| Method | Path                              | 說明                        |
|--------|-----------------------------------|-----------------------------|
| POST   | `/onchain/emissions/:id`          | 建立/更新上鏈任務（pending） |
| GET    | `/onchain/emissions/:id`          | 查詢上鏈狀態                 |
| PUT    | `/onchain/emissions/callback`     | chain-service 回傳上鏈結果   |

### 排放係數 `/factors`

| Method | Path        | 說明         |
|--------|-------------|--------------|
| GET    | `/factors`  | 查詢排放係數  |

### 報告 `/report`

| Method | Path                   | 說明               |
|--------|------------------------|--------------------|
| GET    | `/report/:productId`   | 下載 Excel 碳足跡報告 |

---

## 10. 前端頁面結構

```
src/
├── App.tsx                # 路由定義（React Router v6）
├── pages/
│   ├── welcome/           # 登入 / 註冊頁
│   ├── products/          # 產品列表頁（含產品類型切換側欄）
│   └── lifecycle/         # 產品生命週期頁（新增排放記錄、查看各階段排放）
├── context/
│   ├── UserContext.tsx    # 全域用戶狀態（登入 token、角色等）
│   └── ReportContext.tsx  # 報告相關狀態
├── api/                   # API 呼叫封裝
│   ├── http.ts            # axios 實例（自動帶 Authorization header）
│   ├── auth.ts            # 認證 API
│   ├── products.ts        # 產品 API
│   ├── productTypes.ts    # 產品類型 API
│   └── lifecycle.ts       # 生命週期 API
├── hooks/
│   └── usePermissions.ts  # 根據角色控制 UI 權限
└── utils/
    ├── aggregateEmissions.ts # 排放量加總計算
    ├── export.ts           # 匯出工具
    ├── stageOps.ts         # 生命週期階段操作
    └── storage.ts / storage2/ # 本機儲存
```

### 路由說明

| 路由                            | 說明                                       |
|--------------------------------|--------------------------------------------|
| `/`                            | 未登入 → 歡迎/登入頁；已登入 → 導向 `/products/__all` |
| `/products/__all`              | 產品列表（顯示全部產品類型）              |
| `/products/:typeId`            | 指定產品類型的產品列表                    |
| `/products/:productId/lifecycle` | 特定產品的碳足跡生命週期管理             |

### Nginx 反向代理規則

前端 Nginx 將 `/api/*` 的請求反向代理至 Flask backend（`host.docker.internal:5001`）：

```
/api/auth/login  →  http://host.docker.internal:5001/auth/login
/api/products    →  http://host.docker.internal:5001/products
```

---

## 11. 區塊鏈上鏈流程

```
1. 前端或後端呼叫 POST /onchain/emissions/:id
         ↓
2. backend 將排放記錄寫入 emissions_onchain 表（status: pending）
         ↓
3. chain-service 的 POST /send 被觸發（可為排程或手動觸發）
         ↓
4. chain-service 用 ethers.js 呼叫 Quorum 節點
   執行 RecordStorage.addRecord(JSON.stringify(payload))
         ↓
5. 交易確認後，chain-service 呼叫
   PUT /onchain/emissions/callback
   帶入 { emission_id, status: "submitted", tx_hash: "0x..." }
         ↓
6. backend 更新 emissions_onchain 的 status 與 tx_hash
```

### Smart Contract

- ABI 位於：`chain-service/contracts/RecordStorage.json`
- 合約地址設定於：`chain-service/.env` 的 `CONTRACT_ADDRESS`
- 主要方法：`addRecord(string payload)` — 儲存 JSON 字串上鏈

---

## 12. 資料庫 Migration 管理

### Migration 流程

1. 在 `database/migrations/` 新增 SQL 檔案，命名規則：`016_描述.sql`
2. 執行 `make migrate`
3. `migrator` 容器會執行 `database/migrate.py`，逐一套用尚未記錄於 `schema_migrations` 的檔案

### 目前 Migration 歷史

| 檔案                            | 說明                              |
|-------------------------------|-----------------------------------|
| `001_init.sql`                | 初始 schema（organizations, users, products, emissions, factors）|
| `003_emissions_onchain.sql`   | 新增上鏈追蹤表                    |
| `007_factors.sql`             | 重構 factors 表結構               |
| `008_stage_steps.sql`         | 新增 steps 表                     |
| `011_add_tag_to_steps.sql`    | steps 加入 tag 欄位               |
| `012_renaming.sql`            | 欄位改名                          |
| `014_step_to_product.sql`     | step 改為掛在 product 下          |
| `015_drop_unique_emission_order.sql` | 移除排放記錄的唯一序號限制  |

### 新增 Migration 規範

```bash
# 在 database/migrations/ 新增，例如：
touch database/migrations/016_add_xxx.sql

# 撰寫完後套用：
make migrate
```

---

## 13. 彈性與可擴充點

### 後端可擴充點

| 項目 | 說明 |
|------|------|
| **新增 API Route** | 在 `backend/routes/` 新增 `xxx.py`，並在 `app.py` 的 `create_app()` 中 `register_blueprint(xxx_bp)` |
| **新增資料表操作** | 在 `backend/models/` 新增對應的 model 檔案 |
| **新增 Migration** | 在 `database/migrations/` 按序號新增 SQL 檔案 |
| **排放係數更新** | 更新 `backend/store_factors/emissionFinal.json`，再執行 `make seed-factors` |
| **報告範本修改** | 直接修改 `backend/report/report_template.xlsx`（Excel 範本） |

### 前端可擴充點

| 項目 | 說明 |
|------|------|
| **新增頁面** | 在 `frontend_v2/src/pages/` 新增資料夾，並在 `App.tsx` 的 `<Routes>` 加入路由 |
| **新增 API 呼叫** | 在 `frontend_v2/src/api/` 新增或擴充對應模組 |
| **UI 元件** | 使用 MUI (Material UI) v7；通用元件放在 `src/ui/components/` |
| **新增角色權限** | 在 `src/hooks/usePermissions.ts` 擴充邏輯 |

### 跨服務彈性

| 項目 | 說明 |
|------|------|
| **切換區塊鏈網路** | 修改 `chain-service/.env` 的 `QUORUM_RPC_URL` 即可切換到不同鏈 |
| **切換 Smart Contract** | 更新 `CONTRACT_ADDRESS` 與 `contracts/RecordStorage.json` ABI |
| **環境分離** | `deploy.sh` 支援 `.env.prod` / `docker-compose.prod.yml`，複製對應設定即可分離 prod/dev |
| **SSL 網域** | 修改 `docker-compose.yml` 的 volume 掛載路徑 + `scripts/deploy.sh` 中的 certbot 參數 |

---

## 14. 常見問題 / 注意事項

### 容器內 DB 連線主機名稱

在容器之間，DB 主機名稱必須使用 `db`（Docker Compose service name），**不能用 `localhost`**：

```env
DB_HOST=db   # 正確（容器內）
DB_HOST=localhost  # ❌ 錯誤（容器內會找不到）
```

### 清空資料庫重啟

```bash
docker compose down -v --remove-orphans
make up
```

### 查看目前 Migration 狀態

```bash
make migrations
```

### chain-service 啟動失敗

常見原因：
1. `chain-service/.env` 不存在或缺少 `QUORUM_PRIVATE_KEY` / `CONTRACT_ADDRESS`
2. Quorum 節點無法連線（確認 `QUORUM_RPC_URL` 可達）
3. `shared-net` 外部網路不存在（需先 `docker network create shared-net`）

### Swagger UI 查看 API

啟動後端後，瀏覽 `http://localhost:5001/` 即可看到完整 API 文件。

也可查看所有已掛載的路由：

```
http://localhost:5001/_routes
```

### Excel 報告無法生成

確認 `backend/report/report_template.xlsx` 存在。如遺失，需重新建立 Excel 範本。

### 種子資料（Seed）

| 指令                  | 說明                                  |
|---------------------|---------------------------------------|
| `make seed-dev`     | 插入基本測試資料（用戶、組織、產品等）  |
| `make seed-factors` | 從 `store_factors/emissionFinal.json` 匯入排放係數 |
| `make seed-tags`    | 從 `store_tags/tags.json` 匯入階段標籤 |

---

## 快速上手流程（TL;DR）

```bash
# 1. 設定環境變數
# 建立 .env（參考第5節）
# 建立 chain-service/.env（參考第5節）

# 2. 啟動專案
make backend-build   # 首次
make up

# 3. 初始化測試資料
make seed

# 4. 開始開發
# 後端 API 文件：http://localhost:5001/
# 前端：http://localhost
```

---

*最後更新：2026-03-02*
