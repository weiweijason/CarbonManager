# CarbonManager 實習生培訓教案

> **授課對象**：接手 CarbonManager 專案的實習生  
> **總課時**：14 堂 × 2 小時 = 28 小時  
> **目標**：讓學員具備獨立開發本專案新功能的能力  
> **專案技術棧**：Python / Flask、React / TypeScript、MySQL、Git、Docker、Quorum 區塊鏈

---

## 課程總覽

| 堂次 | 主題 | 技術重點 |
|------|------|----------|
| 01 | 開發環境 & Git 基礎 | Git、Docker Desktop、VS Code |
| 02 | SQL 基礎 | SELECT / INSERT / UPDATE / DELETE |
| 03 | SQL 進階 & 資料庫設計 | JOIN、索引、Foreign Key、Schema 設計 |
| 04 | Python 基礎 & 環境管理 | Python、venv、pip |
| 05 | Flask 入門 & REST API 設計 | Flask、Blueprint、HTTP 方法 |
| 06 | JWT 認證 & 權限控管 | JWT、Flask-JWT-Extended、RBAC |
| 07 | TypeScript & React 入門 | TS 型別系統、React 元件、Props |
| 08 | React 狀態管理 & Hooks | useState、useEffect、Context |
| 09 | React Router & API 串接 | React Router v6、axios、非同步處理 |
| 10 | Docker & 容器化部署 | Dockerfile、Docker Compose、網路 |
| 11 | Git 進階 & 團隊協作流程 | Branch、PR、Merge、Conflict 解決 |
| 12 | 區塊鏈概念 & Smart Contract | Ethereum、Solidity 基礎、ABI |
| 13 | Ethers.js & 鏈上整合實作 | ethers.js、上鏈流程、callback |
| 14 | 專案實戰：端對端新功能開發 | 整合所有技術，完整 feature PR |

---

## 第 01 堂：開發環境 & Git 基礎

### 學習目標
- 在自己電腦上成功啟動 CarbonManager 專案
- 理解 Git 的基本概念與常用指令
- 能夠 clone、commit、push、建立 branch

### 課程內容

#### Part 1：環境設定（60 分鐘）
1. 安裝清單確認
   - Git、VS Code、Docker Desktop、Node.js（選用）
2. Clone 專案
   ```bash
   git clone <repo-url>
   cd CarbonManager
   ```
3. 建立 `.env` 與 `chain-service/.env`（照教案範本填寫）
4. 執行 `make backend-build` → `make up`
5. 驗證：瀏覽 `http://localhost` 與 `http://localhost:5001/`
6. 認識專案目錄結構（對照 `guide.md`）

#### Part 2：Git 基礎（60 分鐘）
1. Git 三個狀態：Working Directory → Staging → Repository
2. 常用指令
   ```bash
   git status
   git add <file>
   git commit -m "訊息"
   git log --oneline
   git diff
   ```
3. `.gitignore` 的作用（為什麼 `.env` 不能 commit）
4. Remote 操作：`git push` / `git pull`
5. Branch 概念：`git checkout -b feature/xxx`

### 課後練習
1. 在專案 repo 建立自己的分支 `dev/你的名字`
2. 修改 `README.md`，加上自己的名字，commit 並 push
3. 回答：為什麼 `.env` 要加進 `.gitignore`？後果是什麼？
4. 執行 `make help`，列出所有指令並解釋其中 5 個的用途

---

## 第 02 堂：SQL 基礎

### 學習目標
- 理解關聯式資料庫的基本概念
- 能對本專案資料庫執行 CRUD 操作
- 能看懂 migration SQL 檔案

### 課程內容

#### Part 1：資料庫概念（30 分鐘）
1. 資料庫 vs 資料表 vs 欄位
2. 主鍵（Primary Key）與資料型別
3. `NULL` vs 空字串的差異
4. 進入本專案 MySQL shell
   ```bash
   make db-shell
   ```

#### Part 2：基本 CRUD（90 分鐘）

**SELECT**
```sql
-- 查詢所有組織
SELECT * FROM organizations;

-- 指定欄位
SELECT id, name, created_at FROM organizations;

-- 條件篩選
SELECT * FROM users WHERE user_type = 'shop';

-- 排序 & 限制筆數
SELECT * FROM products ORDER BY created_at DESC LIMIT 10;

-- 模糊搜尋
SELECT * FROM products WHERE name LIKE '%碳%';
```

**INSERT**
```sql
INSERT INTO organizations (name) VALUES ('測試公司');
```

**UPDATE**
```sql
UPDATE products SET name = '新名稱' WHERE id = 1;
```

**DELETE**
```sql
DELETE FROM organizations WHERE id = 99;
```

**聚合函數**
```sql
SELECT COUNT(*) FROM emissions;
SELECT SUM(emission_amount), product_id FROM emissions GROUP BY product_id;
```

### 課後練習
1. 查詢本專案所有資料表（`SHOW TABLES`）並描述每張表的用途
2. 寫 SQL：找出 total_emission 最高的前 3 個產品
3. 寫 SQL：計算每個組織底下各有幾個產品
4. 執行 `make seed-dev`，觀察資料庫新增了哪些資料
5. 讀懂 `database/migrations/001_init.sql`，畫出資料表之間的關係

---

## 第 03 堂：SQL 進階 & 資料庫設計

### 學習目標
- 能撰寫多表 JOIN 查詢
- 理解 Foreign Key 與 CASCADE 的作用
- 理解 Migration 的運作方式
- 能為本專案新增一個 Migration

### 課程內容

#### Part 1：JOIN（60 分鐘）

```sql
-- INNER JOIN：查詢產品及其所屬組織
SELECT p.name AS product_name, o.name AS org_name
FROM products p
INNER JOIN organizations o ON p.organization_id = o.id;

-- LEFT JOIN：找出沒有任何排放記錄的產品
SELECT p.name, e.id AS emission_id
FROM products p
LEFT JOIN emissions e ON e.product_id = p.id
WHERE e.id IS NULL;

-- 多表 JOIN：查詢排放記錄 + 產品名稱 + 排放係數名稱
SELECT e.id, p.name AS product, f.name AS factor, e.quantity
FROM emissions e
JOIN products p ON p.id = e.product_id
JOIN factors f ON f.id = e.factor_id;
```

#### Part 2：資料庫設計原則（30 分鐘）
1. Foreign Key 與 `ON DELETE CASCADE` vs `RESTRICT`
2. 索引（INDEX）：什麼時候加、為什麼要加
3. 唯一約束（UNIQUE KEY）：本專案哪裡用到？
4. ENUM 型別：本專案的 `user_type`、`status` 欄位

#### Part 3：Migration 實作（30 分鐘）
1. 閱讀 `database/migrate.py`，理解 `schema_migrations` 表的作用
2. 新增一個 migration：`016_add_notes_to_products.sql`
   ```sql
   -- 016_add_notes_to_products.sql
   ALTER TABLE products ADD COLUMN notes TEXT NULL AFTER code;
   ```
3. 執行 `make migrate`，確認套用成功
4. 執行 `make migrations`，確認記錄寫入

### 課後練習
1. 用一條 SQL 查詢：每個產品的排放總量，並顯示產品名稱與組織名稱
2. 解釋本專案為何 `emissions` 表的 `factor_id` 設為 `ON DELETE CASCADE`
3. 新增 migration `017_xxx.sql`（自訂一個合理的欄位），套用並截圖
4. 思考題：`schema_migrations` 表的設計解決了什麼問題？

---

## 第 04 堂：Python 基礎 & 環境管理

### 學習目標
- 熟悉 Python 基本語法
- 能建立 venv 並安裝套件
- 能看懂後端 model 層的程式碼

### 課程內容

#### Part 1：Python 語法重點（60 分鐘）
1. 資料型別：`str`、`int`、`float`、`bool`、`None`
2. 容器：`list`、`dict`、`tuple`
3. 條件 / 迴圈：`if/elif/else`、`for`、`while`
4. 函式：`def`、預設參數、`*args`、`**kwargs`
5. Exception：`try/except/finally`
6. f-string 格式化
7. `with` 語句（對應本專案 `with get_db() as conn:`）

#### Part 2：Python 環境管理（30 分鐘）
```bash
# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝相依套件
pip install -r requirements.txt

# 凍結套件版本
pip freeze > requirements.txt
```

#### Part 3：讀懂 Model 層（30 分鐘）
閱讀 `backend/models/products_model.py`：
1. 函式如何接收 `conn` 或使用 `get_db()`
2. `cursor(dictionary=True)` 的作用
3. `%s` 參數化查詢（防 SQL Injection）
4. 函式回傳值設計

### 課後練習
1. 安裝本專案的 Python 相依套件，並列出各套件用途
2. 閱讀 `backend/models/emissions_model.py`，解釋 `get_emission_summary` 函式做了什麼
3. 撰寫一個 Python 函式：接收一個 emissions list（dict 組成），回傳按 stage_id 分組的加總 dict
4. 用 Python 連接本專案 MySQL，查詢並印出所有 factors（使用 `mysql-connector-python`）

---

## 第 05 堂：Flask 入門 & REST API 設計

### 學習目標
- 理解 HTTP 協定基礎（Method、Status Code、Header）
- 能用 Flask 建立 REST API
- 理解 Blueprint 的意義與用法
- 能閱讀並擴充後端 routes

### 課程內容

#### Part 1：HTTP 基礎（30 分鐘）
1. HTTP Methods：`GET`、`POST`、`PUT`、`PATCH`、`DELETE`
2. 常見 Status Code
   | Code | 意義 |
   |------|------|
   | 200 | 成功 |
   | 201 | 建立成功 |
   | 400 | 請求錯誤（參數缺失）|
   | 401 | 未授權 |
   | 404 | 找不到資源 |
   | 409 | 衝突（重複資料）|
   | 500 | 伺服器錯誤 |
3. Request：URL、Query String、Request Body（JSON）
4. Response：Status Code + JSON Body

#### Part 2：Flask 基礎（30 分鐘）
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.get("/hello")
def hello():
    name = request.args.get("name", "World")
    return jsonify(message=f"Hello, {name}!"), 200

@app.post("/echo")
def echo():
    data = request.get_json()
    return jsonify(received=data), 201
```

#### Part 3：Blueprint & 本專案結構（60 分鐘）
1. Blueprint 的用途：模組化路由
2. 閱讀 `backend/routes/products.py`
3. 觀察 `app.py` 如何 `register_blueprint`
4. 使用 Swagger UI（`http://localhost:5001/`）測試現有 API
5. 用 `curl` 或 Postman 測試 `/auth/login`

### 課後練習
1. 用 Swagger UI 或 Postman 完成：註冊 → 登入 → 取得產品列表（帶 Bearer Token）
2. 在 `backend/routes/` 新增 `hello.py`，實作一個 `GET /hello?name=xxx` 回傳 `{"message": "Hello, xxx!"}` 的 API，並在 `app.py` 中註冊
3. 解釋 `parse_display_id` 和 `display_id` 的設計目的（在 `routes/helpers.py`）
4. 思考題：此專案為什麼要將 ID 轉成 `PRD000001` 格式，而不直接回傳數字？

---

## 第 06 堂：JWT 認證 & 權限控管

### 學習目標
- 理解 JWT 的結構與運作原理
- 能使用 Flask-JWT-Extended 保護 API
- 理解本專案的角色權限設計（shop / customer）

### 課程內容

#### Part 1：JWT 基礎（40 分鐘）
1. JWT = Header.Payload.Signature
2. Payload 可以放什麼（不要放密碼！）
3. Access Token vs Refresh Token
4. 流程：登入 → 取得 token → 每次請求帶 token → 過期後 refresh
5. 在 [jwt.io](https://jwt.io) 解碼本專案的 token，看 claims 內容

#### Part 2：Flask-JWT-Extended 實作（50 分鐘）
```python
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

# 保護路由
@app.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()   # 取得 user_id
    claims = get_jwt()             # 取得自訂 claims（role、org_id）
    return jsonify(user_id=user_id, role=claims.get("user_type"))
```

6. 閱讀 `backend/models/user_model.py` 中的 `generate_tokens`
7. 理解本專案 token 中帶了哪些 claims

#### Part 3：權限控管設計（30 分鐘）
1. 本專案角色：`shop`（管理者）vs `customer`（消費者）
2. 目前權限設計：路由層透過 `get_jwt()` 取得 `user_type` 判斷
3. 閱讀 `frontend_v2/src/hooks/usePermissions.ts`
4. 討論：RBAC（Role-Based Access Control）的設計原則

### 課後練習
1. 閱讀 `auth.py`，畫出 register → login → refresh → 受保護 API 的完整流程圖
2. 在第 05 堂新增的 `hello.py` 路由加上 `@jwt_required()`，測試有無 token 的差異
3. 新增一個路由 `GET /me`，回傳當前登入用戶的 `user_id`、`role`、`organization_id`
4. 思考題：Access Token 設為 1 小時過期，如何在前端自動處理過期？（對照 `frontend_v2/src/api/http.ts`）

---

## 第 07 堂：TypeScript & React 入門

### 學習目標
- 理解 TypeScript 的型別系統
- 能建立與理解 React 函式元件
- 能讀懂本專案前端的元件結構

### 課程內容

#### Part 1：TypeScript 基礎（60 分鐘）
1. 基本型別：`string`、`number`、`boolean`、`null`、`undefined`
2. 物件型別與 Interface
   ```typescript
   interface Product {
     product_id: string;
     product_name: string;
     total_emission: number;
   }
   ```
3. 陣列型別：`Product[]`
4. Union Type：`'shop' | 'customer'`
5. Optional：`notes?: string`
6. 型別斷言：`as`
7. 為什麼要用 TypeScript？（對比純 JS 的 runtime error）

#### Part 2：React 元件基礎（60 分鐘）
1. JSX 語法
2. 函式元件與 Props
   ```tsx
   interface Props {
     name: string;
     count: number;
   }
   
   function Counter({ name, count }: Props) {
     return <div>{name}: {count}</div>;
   }
   ```
3. 條件渲染：`&&`、三元運算子
4. 列表渲染：`array.map()` + `key` prop
5. 閱讀本專案 `ProductListPage.tsx`，認識頁面組成

### 課後練習
1. 為下列資料定義 TypeScript Interface：emission 記錄（含 emission_id、name、stage_id、quantity、emission_amount）
2. 建立一個 React 元件 `EmissionCard.tsx`，接收上述 interface 作為 prop，渲染排放記錄的名稱與用量
3. 在本機執行前端開發模式（`cd frontend_v2 && npm install && npm run dev`），確認可以運行
4. 閱讀 `frontend_v2/src/App.tsx`，解釋 `HomeGate` 和 `Guard` 元件各做了什麼

---

## 第 08 堂：React 狀態管理 & Hooks

### 學習目標
- 熟悉 `useState`、`useEffect`、`useContext`
- 理解本專案的全域狀態設計（UserContext）
- 能建立有資料載入邏輯的 React 頁面

### 課程內容

#### Part 1：useState（30 分鐘）
```tsx
const [count, setCount] = useState<number>(0);
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState<boolean>(true);
```
- State 更新觸發重新渲染
- 不可直接修改 state（immutability）

#### Part 2：useEffect（40 分鐘）
```tsx
useEffect(() => {
  // 元件掛載時執行
  fetchProducts();
  
  return () => {
    // 清理（元件卸載時）
  };
}, [依賴項]);  // [] = 只執行一次
```
- 用途：API 呼叫、訂閱、計時器
- 依賴陣列的重要性

#### Part 3：useContext（50 分鐘）
1. Context 用途：跨元件共享狀態（避免 props drilling）
2. 閱讀 `frontend_v2/src/context/UserContext.tsx`
   - 如何儲存 token
   - `isAuthed` 如何判斷
   - `ready` 的用途（防止 flash）
3. 如何在元件中使用：`const { isAuthed, user } = useUser()`

### 課後練習
1. 建立一個元件 `ProductList.tsx`，用 `useEffect` 在掛載時從 API 取得產品列表，用 `useState` 儲存，並渲染出來（可先 mock API response）
2. 新增 `loading` 與 `error` 狀態，分別顯示「載入中...」和錯誤訊息
3. 閱讀 `ReportContext.tsx`，解釋它管理了什麼狀態，為什麼要用 Context 而非 useState
4. 思考題：什麼情況下應該用 Context？什麼情況下 useState + props 就夠了？

---

## 第 09 堂：React Router & API 串接

### 學習目標
- 能使用 React Router v6 實作前端路由
- 能用 axios 呼叫後端 API 並處理非同步
- 理解本專案前端 API 層的設計

### 課程內容

#### Part 1：React Router v6（40 分鐘）
```tsx
// 路由定義
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/products/:typeId" element={<ProductListPage />} />
</Routes>

// 讀取路由參數
const { typeId } = useParams<{ typeId: string }>();

// 程式導航
const navigate = useNavigate();
navigate("/products/__all");
```
1. 巢狀路由
2. `<Navigate>` 元件
3. 受保護路由（對照 `App.tsx` 的 `Guard` 元件）

#### Part 2：axios & API 串接（80 分鐘）
1. axios 基礎
   ```typescript
   // GET
   const res = await axios.get('/api/products');
   
   // POST
   const res = await axios.post('/api/products', { name: '新產品' });
   ```
2. 閱讀 `frontend_v2/src/api/http.ts`
   - axios instance 設定
   - 請求攔截器（自動帶 Authorization header）
   - 回應攔截器（統一錯誤處理）
3. async/await 與錯誤處理（try/catch）
4. 閱讀 `frontend_v2/src/api/products.ts`，理解 API 函式的封裝方式

### 課後練習
1. 封裝一個 API 函式 `getEmissions(productId: string): Promise<Emission[]>`，並在元件中呼叫
2. 在 `ProductList.tsx` 中加入「點擊產品 → 導航到 `/products/:productId/lifecycle`」的功能
3. 閱讀 `frontend_v2/src/api/lifecycle.ts`，解釋它的結構設計
4. 任務：實作一個「新增產品」的 Modal，送出後呼叫 `POST /product-types/:id/products`

---

## 第 10 堂：Docker & 容器化部署

### 學習目標
- 理解容器化的目的與 Docker 基本概念
- 能讀懂並修改本專案的 `Dockerfile`
- 理解 Docker Compose 的網路與依賴設計

### 課程內容

#### Part 1：Docker 概念（40 分鐘）
1. 容器 vs 虛擬機
2. Image vs Container
3. `Dockerfile` 指令解析
   ```dockerfile
   FROM python:3.11-slim    # 基底 image
   WORKDIR /app             # 工作目錄
   COPY requirements.txt .  # 複製檔案
   RUN pip install -r requirements.txt  # 建置時執行
   COPY . .
   CMD ["python", "app.py"] # 容器啟動時執行
   ```
4. 讀懂 `backend/Dockerfile`

#### Part 2：Docker Compose（80 分鐘）
1. `services`、`volumes`、`networks` 的概念
2. `depends_on` + `healthcheck` 的用途（DB 要先 healthy 才啟動 backend）
3. `env_file` vs `environment` 的差異
4. 逐行解析本專案 `docker-compose.yml`
5. 實用指令
   ```bash
   docker compose up -d           # 背景啟動
   docker compose logs -f backend # 追蹤 log
   docker compose exec backend sh # 進入容器
   docker compose down -v         # 停止並清除 volumes
   docker ps                      # 查看運行中的容器
   docker images                  # 查看本地 image
   ```
6. 容器間通訊：service name 就是 hostname

### 課後練習
1. 建立一個最簡單的 `Dockerfile`，將第 05 堂的 Flask hello world 容器化，成功執行
2. 用 `docker compose exec backend sh` 進入 backend 容器，檢查環境變數是否正確載入
3. 解釋本專案 `migrator` 服務為什麼設定 `restart: "no"`
4. 模擬故障排除：把 `.env` 中的 `MYSQL_PASSWORD` 改錯，觀察 `make up` 的錯誤訊息，並修復

---

## 第 11 堂：Git 進階 & 團隊協作流程

### 學習目標
- 能在團隊中使用 Git 分支策略
- 能處理 Merge Conflict
- 理解 PR（Pull Request）流程與 Code Review

### 課程內容

#### Part 1：分支策略（40 分鐘）
1. 常見分支策略（以本專案為例）
   ```
   main          ← 生產環境，只接受 PR
   develop       ← 開發主線
   feature/xxx   ← 新功能
   fix/xxx       ← Bug 修復
   ```
2. 命名規範：`feature/add-emission-export`、`fix/login-token-refresh`
3. 分支操作
   ```bash
   git checkout -b feature/add-export
   git push origin feature/add-export
   git checkout develop
   git merge feature/add-export
   ```

#### Part 2：Merge Conflict 處理（40 分鐘）
1. 製造並解決 Conflict（實際演練）
   ```
   <<<<<<< HEAD
   你的修改
   =======
   別人的修改
   >>>>>>> feature/xxx
   ```
2. 使用 VS Code Merge Editor
3. `git rebase` vs `git merge` 的差異

#### Part 3：PR & Code Review（40 分鐘）
1. 好的 Commit Message 格式
   ```
   feat: 新增匯出 Excel 功能
   fix: 修復登入 token 過期問題
   refactor: 重構 emission model 查詢
   docs: 更新 API 文件
   ```
2. PR 描述模板：做了什麼、為什麼、如何測試
3. Code Review 重點：邏輯正確性、命名、安全性、效能
4. 使用 `git stash` 暫存未完成工作

### 課後練習
1. 建立 `feature/` 分支，完成前幾堂的練習後透過 PR 合入 `develop`
2. 與同學製造一個 Merge Conflict，練習解決
3. 為你的 commits 補上符合規範的 commit message
4. 閱讀 `scripts/deploy.sh`，解釋 `git pull --rebase` 為何比 `git pull` 更適合部署環境

---

## 第 12 堂：區塊鏈概念 & Smart Contract

### 學習目標
- 理解區塊鏈的核心概念
- 能閱讀並理解 Solidity Smart Contract
- 理解 ABI 的作用

### 課程內容

#### Part 1：區塊鏈基礎（50 分鐘）
1. 區塊鏈解決什麼問題：**不可竄改性**
2. 區塊結構：區塊 = 交易清單 + 前一個區塊的 hash
3. 共識機制：PoW vs PoS vs IBFT（Quorum 使用）
4. 公鏈 vs 私有鏈 vs 聯盟鏈
5. 帳戶（Account）vs 合約（Contract）
6. 交易（Transaction）的生命週期
7. 本專案為何選擇 **Quorum**（企業私有鏈）

#### Part 2：Smart Contract 基礎（70 分鐘）
1. Smart Contract = 部署在區塊鏈上的程式碼，執行後不可更改
2. Solidity 基礎語法
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.0;
   
   contract RecordStorage {
       // 事件紀錄
       event RecordAdded(uint256 indexed id, string payload);
       
       struct Record {
           uint256 id;
           string payload;
           uint256 timestamp;
       }
       
       Record[] public records;
       
       function addRecord(string calldata payload) external {
           uint256 id = records.length;
           records.push(Record(id, payload, block.timestamp));
           emit RecordAdded(id, payload);
       }
       
       function getRecord(uint256 id) external view returns (Record memory) {
           return records[id];
       }
   }
   ```
3. ABI（Application Binary Interface）：外部呼叫合約的介面描述
4. 閱讀 `chain-service/contracts/RecordStorage.json`（ABI）

### 課後練習
1. 解釋：為什麼本專案要將排放記錄存到區塊鏈？只用 MySQL 有什麼缺點？
2. 閱讀 `RecordStorage.json`，找出 `addRecord` 與 `getRecord` 對應的 ABI 定義
3. 思考題：如果需要「更新」鏈上的排放記錄，應該怎麼設計合約？（提示：區塊鏈是 append-only）
4. 查詢：Quorum IBFT 共識機制如何保證交易的最終性？與 Ethereum PoS 有何不同？

---

## 第 13 堂：Ethers.js & 鏈上整合實作

### 學習目標
- 能用 ethers.js 連接區塊鏈節點並呼叫合約
- 完全理解本專案的上鏈流程
- 能追蹤並排查上鏈失敗的問題

### 課程內容

#### Part 1：Ethers.js 基礎（50 分鐘）
```javascript
import { ethers } from "ethers";

// 1. 連接節點（Provider）
const provider = new ethers.JsonRpcProvider("http://rpcnode:8545");

// 2. 建立錢包（Wallet = 私鑰 + Provider）
const wallet = new ethers.Wallet("0x私鑰", provider);

// 3. 連接合約
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// 4. 呼叫寫入函式（發交易）
const tx = await contract.addRecord(JSON.stringify(payload));
const receipt = await tx.wait();  // 等待確認
console.log("tx hash:", tx.hash);

// 5. 呼叫讀取函式（不需 gas）
const record = await contract.getRecord(0);
```

#### Part 2：逐行解析 chain-service（50 分鐘）
1. 完整閱讀 `chain-service/src/index.js`
2. `POST /send` 的完整流程
3. 上鏈成功後的 callback 機制
4. 錯誤處理：上鏈失敗仍要 callback 回 backend（status: "failed"）
5. 閱讀 `chain-service/contracts/checkRecords.js`：如何查詢鏈上資料

#### Part 3：完整上鏈流程追蹤（20 分鐘）
透過本機環境，踐踏一次完整的上鏈流程：
1. `POST /onchain/emissions/1` → `emissions_onchain` 出現 pending 記錄
2. 觀察 chain-service log：`make logs-chain`
3. 查詢 `emissions_onchain` 表，確認 status 更新為 submitted + tx_hash

### 課後練習
1. 閱讀 `backend/routes/onchain.py` 的 `onchain_callback`，解釋驗證機制
2. 修改 `checkRecords.js`，讓它接受 command line 參數指定要查詢的 record id
3. 思考題：如果 callback 失敗（backend 當機），emissions_onchain 狀態會停在哪？應如何設計重試機制？
4. 模擬上鏈失敗：故意把 `QUORUM_PRIVATE_KEY` 設錯，觀察 logs 和 DB 狀態

---

## 第 14 堂：專案實戰 — 端對端新功能開發

### 學習目標
- 整合前 13 堂所學，獨立完成一個完整功能的開發
- 掌握「需求 → 資料庫 → API → 前端 → 測試 → PR」的完整流程

### 課程說明

本堂課為實戰演練，每位學員（或兩人一組）負責完成一個真實的小功能開發，並在課後以 PR 形式提交。

---

### 功能選項（三選一）

#### 選項 A：產品備註功能（難度 ⭐⭐）

**需求**：產品可以新增「備註」欄位，在產品列表顯示，並可透過 API 更新。

**開發步驟**：
1. **Migration**：新增 `database/migrations/016_add_notes_to_products.sql`
   ```sql
   ALTER TABLE products ADD COLUMN notes TEXT NULL AFTER code;
   ```
2. **Backend Model**：修改 `products_model.py`，在 `list_products`、`fetch_product`、`update_product` 加入 notes 欄位
3. **Backend Route**：修改 `products.py`，API response 回傳 notes，PUT 接受 notes 更新
4. **Frontend API**：修改 `api/products.ts`，型別加入 notes
5. **Frontend UI**：在產品卡片顯示備註
6. **測試**：用 Swagger UI 測試 API，截圖

---

#### 選項 B：排放記錄匯出 CSV（難度 ⭐⭐⭐）

**需求**：在產品生命週期頁面，可以匯出當前產品的所有排放記錄為 CSV 檔案。

**開發步驟**：
1. **Backend Route**：新增 `GET /products/:id/emissions/export`，回傳 CSV
   ```python
   import csv, io
   from flask import make_response
   
   output = io.StringIO()
   writer = csv.writer(output)
   writer.writerow(["ID", "名稱", "階段", "用量", "排放量"])
   # ... 寫入資料
   response = make_response(output.getvalue())
   response.headers["Content-Type"] = "text/csv"
   response.headers["Content-Disposition"] = f"attachment; filename=emissions_{product_id}.csv"
   ```
2. **Frontend API**：新增 `exportEmissionsCSV(productId)` 函式
3. **Frontend UI**：在生命週期頁面加入「匯出 CSV」按鈕
4. **測試**：實際下載並確認 CSV 內容正確

---

#### 選項 C：Dashboard 統計 API（難度 ⭐⭐⭐）

**需求**：新增一個 `GET /dashboard` API，回傳當前組織的統計摘要，並在前端顯示。

**回傳格式**：
```json
{
  "total_products": 12,
  "total_emissions": 145.3,
  "products_by_type": [
    { "type_name": "電子產品", "count": 5 },
    { "type_name": "包裝材料", "count": 7 }
  ],
  "top_emission_products": [
    { "product_name": "產品A", "total_emission": 45.2 }
  ]
}
```

**開發步驟**：
1. **Backend Model**：新增統計查詢函式（用 SQL JOIN + GROUP BY）
2. **Backend Route**：新增 `GET /dashboard`，需要 JWT 認證
3. **Frontend API**：新增 `getDashboard()` 函式
4. **Frontend 頁面**：新增 Dashboard 頁面路由與簡單的統計卡片 UI
5. **App.tsx**：新增 `/dashboard` 路由

---

### PR 提交規範

每位學員需提交：
- **Branch 名稱**：`feature/姓名-功能名稱`
- **Commit 符合規範**：`feat: 新增產品備註功能`
- **PR 描述包含**：
  1. 變更說明（做了什麼）
  2. 測試截圖（Swagger UI + 前端畫面）
  3. 是否有新增 Migration（有的話標明 migration 檔名）

---

## 附錄：學習資源

### 官方文件
- [Flask 官方文件](https://flask.palletsprojects.com/)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [React 官方文件](https://react.dev/)
- [React Router v6](https://reactrouter.com/)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/handbook/)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [Docker 官方文件](https://docs.docker.com/)
- [MySQL 官方文件](https://dev.mysql.com/doc/)

### 本專案快速查閱
- [guide.md](guide.md) — 完整技術文件
- `http://localhost:5001/` — Swagger UI（後端 API 文件）
- `http://localhost:5001/_routes` — 所有已掛載的路由列表
- `make help` — 所有 Makefile 指令

### 工具推薦
- **API 測試**：Postman 或 VS Code REST Client 外掛
- **DB GUI**：DBeaver 或 MySQL Workbench
- **Git GUI**：GitLens（VS Code 外掛）

---

## 附錄：評分標準（供 PM 參考）

| 項目 | 配分 |
|------|------|
| 課後練習完成度 | 40% |
| 第 14 堂 PR 品質（功能正確性）| 30% |
| 第 14 堂 PR 品質（程式碼風格 / Commit 規範）| 15% |
| 課堂參與 / 提問 | 15% |

---

*教案版本：v1.0 — 2026-03-02*
