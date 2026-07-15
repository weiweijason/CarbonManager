// src/pages/products/ProductListPage.tsx
import React, { useState, useEffect, useRef } from "react";
import * as S from "./ProductListPage.styles";
import Modal from "@/ui/components/Modal";
import AccountMenu from "@/ui/components/AccountMenu";
import DropdownMenu from "@/ui/components/DropdownMenu";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { PrimaryButton, GhostButton } from "@/ui/primitives/Button";
import { Field, FormActions } from "@/ui/primitives/Form";

import {
  apiListProducts,
  apiCreateProduct,
  apiDeleteProduct,
  apiUpdateProduct,
  UIProduct,
} from "@/api/products";
import {
  apiListStepsByStage,
  apiCreateStep,
  StageId,
} from "@/api/lifecycle";

import {
  apiGetOrCreateDefaultType,
  apiListProductTypes,
  apiCreateProductType,
  ProductType,
} from "@/api/productTypes";

function mapRole(userType?: "shop" | "customer" | null) {
  if (userType === "shop") return "Farmer";
  if (userType === "customer") return "Consumer";
  return "None";
}

function getTypeDisplayId(t: ProductType): string {
  const anyT = t as any;
  const raw = anyT.id ?? anyT.product_type_id ?? anyT.display_id ?? null;
  return raw != null ? String(raw) : "";
}

function extractTypeDisplayId(created: any): string | null {
  if (!created) return null;
  const anyC = created as any;
  const raw =
    anyC.id ??
    anyC.product_type_id ??
    anyC.product_type?.id ??
    anyC.data?.id ??
    anyC.data?.product_type_id ??
    null;
  if (raw == null) return null;
  return String(raw);
}

function ensureArray<T>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && Array.isArray(v.items)) return v.items as T[];
  if (v && Array.isArray(v.data)) return v.data as T[];
  if (v && Array.isArray(v.list)) return v.list as T[];
  return [];
}

function displayTypeName(name?: string) {
  if (!name) return "未分類";
  if (name === "Default Type" || name === "Uncategorized") return "未分類";
  return name;
}

type TidLike = "__all" | string;
type ProductRow = UIProduct & { _typeId?: string };

export default function ProductListPage() {
  const { user, isAuthed } = useUser();
  const account = user?.account ?? null;
  const role = mapRole(user?.user_type);
  const canEdit = role === "Farmer" && isAuthed;
  const readOnly = !canEdit;

  const navigate = useNavigate();
  const params = useParams();

  // ---------- 類型清單 & 目前篩選 ----------
  const [typeOptions, setTypeOptions] = useState<ProductType[]>([]);
  const [resolvedTid, setResolvedTid] = useState<TidLike>("__all");
  const loadingTypesRef = useRef(false);

  useEffect(() => {
    const urlTid = params.typeId;
    if (!urlTid) {
      setResolvedTid("__all");
      navigate("/products/__all", { replace: true });
      return;
    }
    if (urlTid === "__all") {
      setResolvedTid("__all");
      return;
    }
    setResolvedTid(urlTid);
  }, [params.typeId, navigate]);

  const tid: TidLike = resolvedTid;

  useEffect(() => {
    let cancelled = false;
    if (loadingTypesRef.current) return;
    loadingTypesRef.current = true;

    (async () => {
      try {
        let list = ensureArray<ProductType>(await apiListProductTypes());
        if (list.length === 0 && canEdit) {
          try {
            await apiGetOrCreateDefaultType();
            list = ensureArray<ProductType>(await apiListProductTypes());
          } catch (e) {
            console.warn("[ProductList] auto-create default type failed", e);
          }
        }
        if (!cancelled) setTypeOptions(list);
        if (!cancelled && tid !== "__all") {
          const exists = list.some((t) => getTypeDisplayId(t) === tid);
          if (!exists) {
            setResolvedTid("__all");
            if (params.typeId !== "__all") navigate("/products/__all", { replace: true });
          }
        }
      } catch (err) {
        console.error("[ProductList] load types failed:", err);
        if (!cancelled) {
          setTypeOptions([]);
          setResolvedTid("__all");
          if (params.typeId !== "__all") navigate("/products/__all", { replace: true });
        }
      } finally {
        loadingTypesRef.current = false;
      }
    })();

    return () => { cancelled = true; };
  }, [canEdit, tid, params.typeId, navigate]);

  const [selectedType, setSelectedType] = useState<string | "__new">("__new");
  const [newTypeName, setNewTypeName] = useState("");

  useEffect(() => {
    if (!canEdit) return;
    if (tid !== "__all") { setSelectedType(tid); return; }
    if (typeOptions.length) {
      const firstId = getTypeDisplayId(typeOptions[0]);
      setSelectedType(firstId || "__new");
    } else {
      setSelectedType("__new");
    }
  }, [tid, canEdit, typeOptions]);

  // ---------- 商品清單 ----------
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (tid === "__all") {
          let types = typeOptions;
          if (types.length === 0 && canEdit) {
            try {
              await apiGetOrCreateDefaultType();
              types = ensureArray<ProductType>(await apiListProductTypes());
              if (!cancelled) setTypeOptions(types);
            } catch { /* ignore */ }
          }
          if (types.length === 0) { if (!cancelled) setProducts([]); return; }

          const promises = types
            .map((t) => {
              const typeId = getTypeDisplayId(t);
              if (!typeId) return null;
              return apiListProducts(typeId).then((list) =>
                list.map((p) => ({ ...p, _typeId: typeId } as ProductRow))
              );
            })
            .filter((x): x is Promise<ProductRow[]> => x !== null);

          if (promises.length === 0) { if (!cancelled) setProducts([]); return; }
          const chunks = await Promise.all(promises);
          if (!cancelled) setProducts(chunks.flat());
          return;
        }
        const list = await apiListProducts(tid);
        if (!cancelled) setProducts(list.map((p) => ({ ...p, _typeId: tid } as ProductRow)));
      } catch (e) {
        console.error("[ProductList] list products failed:", e);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tid, typeOptions, canEdit]);

  function refresh(tidOverride?: TidLike) {
    const target: TidLike = tidOverride ?? tid;
    if (!target) return;
    setLoading(true);
    if (target === "__all") {
      if (typeOptions.length === 0) { setProducts([]); setLoading(false); return; }
      const promises = typeOptions
        .map((t) => {
          const typeId = getTypeDisplayId(t);
          if (!typeId) return null;
          return apiListProducts(typeId).then((list) =>
            list.map((p) => ({ ...p, _typeId: typeId } as ProductRow))
          );
        })
        .filter((x): x is Promise<ProductRow[]> => x !== null);
      if (promises.length === 0) { setProducts([]); setLoading(false); return; }
      Promise.all(promises).then((chunks) => setProducts(chunks.flat())).finally(() => setLoading(false));
      return;
    }
    apiListProducts(target)
      .then((list) => setProducts(list.map((p) => ({ ...p, _typeId: target } as ProductRow))))
      .finally(() => setLoading(false));
  }

  async function ensureTypeIdToUse(): Promise<string> {
    if (selectedType === "__new") {
      const name = (newTypeName || "").trim();
      if (!name) throw new Error("請輸入新的分類名稱");
      const list = await apiListProductTypes();
      const dup = list.find((t) => (t.name || "").toLowerCase() === name.toLowerCase());
      if (dup) {
        const useId = dup.id;
        setTypeOptions(list);
        setSelectedType(useId);
        if (tid !== useId) navigate(`/products/${encodeURIComponent(useId)}`, { replace: true });
        return useId;
      }
      const created = await apiCreateProductType({ name });
      const useId = extractTypeDisplayId(created) ?? created.id;
      const freshList = await apiListProductTypes();
      setTypeOptions(freshList);
      setSelectedType(useId);
      if (tid !== useId) navigate(`/products/${encodeURIComponent(useId)}`, { replace: true });
      return useId;
    }
    if (selectedType && selectedType !== "__new") return selectedType;
    if (tid !== "__all") return tid;
    throw new Error("尚未選擇產品分類");
  }

  // ---------- CRUD ----------
  const [openModal, setOpenModal] = useState<null | "new" | "edit" | "newType" | "confirmDup">(null);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTypeId, setEditTypeId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addError, setAddError] = useState("");
  const [dupTarget, setDupTarget] = useState<ProductRow | null>(null);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupStatus, setDupStatus] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  async function handleAdd() {
    if (readOnly) return;
    setAddError("");
    const name = newName.trim();
    if (!name) { setAddError("請輸入商品名稱"); return; }
    try {
      const useTid = await ensureTypeIdToUse();
      await apiCreateProduct(useTid, { name });
      setOpenModal(null);
      setNewName("");
      setNewTypeName("");
      if (tid !== useTid) navigate(`/products/${encodeURIComponent(useTid)}`, { replace: true });
      refresh(useTid);
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const msg = String(err?.message || err);
      if (msg.includes("1452") || /foreign key/i.test(msg) || /not.*found/i.test(msg) || status === 404) {
        setAddError("新增失敗：產品分類不存在或不屬於您的組織。");
      } else if (status === 409 || /duplicate/i.test(msg)) {
        setAddError("新增失敗：名稱重複，請換一個名稱再試。");
      } else {
        setAddError("新增失敗：" + msg);
      }
    }
  }

  async function handleDelete(p: ProductRow) {
    if (readOnly) return;
    const typeId = p._typeId ?? (tid !== "__all" ? tid : null);
    if (!typeId) { alert("刪除失敗：找不到商品所屬分類。"); return; }
    try {
      await apiDeleteProduct(typeId, p.id as any);
      setProducts((prev) => prev.filter((x) => !(x.id === p.id && x._typeId === typeId)));
    } catch (err: any) {
      alert("刪除失敗：" + (err?.message || err));
    }
  }

  /** 開啟確認視窗，真正的複製動作在 confirmDuplicate() */
  function requestDuplicate(p: ProductRow) {
    if (readOnly) return;
    setDupTarget(p);
    setOpenModal("confirmDup");
  }

  /** 所有生命週期階段 ID（與後端 stages 對應） */
  const ALL_STAGE_IDS: StageId[] = [
    "raw",
    "manufacture",
    "distribution",
    "use",
    "disposal",
  ];

  /** 使用者在確認視窗按下「確認複製」後執行 */
  async function confirmDuplicate() {
    if (!dupTarget) return;
    const p = dupTarget;
    const typeId = p._typeId ?? (tid !== "__all" ? tid : null);
    if (!typeId) { alert("複製失敗：找不到商品所屬分類。"); setOpenModal(null); return; }
    setDupLoading(true);
    setDupStatus("建立新商品…");
    try {
      // 1. 建立新商品（名稱加「複製」後綴）
      const newProduct = await apiCreateProduct(typeId, { name: `${p.name}（複製）` });
      const newProductId = newProduct.id;
      const srcProductId = p.id;

      // 2. 逐一複製每個階段的生產步驟
      let totalSteps = 0;
      for (const stageId of ALL_STAGE_IDS) {
        setDupStatus(`複製步驟：${stageId}…`);
        try {
          const steps = await apiListStepsByStage(stageId, { productId: srcProductId });
          for (const step of steps) {
            if (!step.tag_id) continue; // 沒有 tag_id 的步驟無法建立
            await apiCreateStep(newProductId, {
              stage_id: stageId,
              tag_id: step.tag_id,
              name: step.name,
              sort_order: typeof step.sort_order === "number" ? step.sort_order : 0,
            });
            totalSteps++;
          }
        } catch {
          // 單一階段失敗不中斷整體複製
        }
      }

      setDupStatus(`完成！已複製 ${totalSteps} 個步驟`);
      await new Promise((r) => setTimeout(r, 800)); // 短暫顯示完成訊息

      setOpenModal(null);
      setDupTarget(null);
      setDupStatus("");
      refresh(typeId);
    } catch (err: any) {
      alert("複製失敗：" + (err?.message || err));
    } finally {
      setDupLoading(false);
    }
  }

  async function handleRename() {
    if (readOnly || !editId || !editTypeId) return;
    const name = editName.trim();
    if (!name) return;
    try {
      await apiUpdateProduct(editTypeId, editId, { name });
      setProducts((prev) => prev.map((p) =>
        p.id === editId && p._typeId === editTypeId ? { ...p, name } : p
      ));
      setOpenModal(null);
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const msg = String(err?.message || err);
      if (status === 409 || /duplicate/i.test(msg)) alert("改名失敗：名稱重複。");
      else alert("改名失敗：" + msg);
    }
  }

  async function handleAddType() {
    const name = newTypeName.trim();
    if (!name) return;
    try {
      const created = await apiCreateProductType({ name });
      const newId = extractTypeDisplayId(created) ?? created.id;
      if (!newId) throw new Error("建立類型失敗");
      const list = await apiListProductTypes();
      setTypeOptions(list);
      setResolvedTid(newId);
      navigate(`/products/${encodeURIComponent(newId)}`, { replace: true });
      setOpenModal(null);
      setNewTypeName("");
    } catch (err: any) {
      alert("建立類型失敗：" + (err?.message || err));
    }
  }

  function handleCardClick(e: React.MouseEvent, id: any) {
    if (menuOpen === String(id)) { e.preventDefault(); e.stopPropagation(); return; }
    navigate(`/products/${encodeURIComponent(String(id))}/lifecycle`);
  }

  function handleCardKeyDown(e: React.KeyboardEvent, id: any) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(e as unknown as React.MouseEvent, id); }
  }

  function handleTypeChip(typeId: TidLike) {
    setResolvedTid(typeId);
    if (params.typeId !== typeId) navigate(`/products/${typeId}`);
    else refresh(typeId);
  }

  return (
    <S.PageWrapper>
      {/* ── 頂部工具列 ── */}
      <S.TopBar>
        <h2>我的商品</h2>
        <div className="actions">
          <AccountMenu />
        </div>
      </S.TopBar>

      {/* ── 使用者資訊提示 ── */}
      <S.Hint>
        {isAuthed
          ? `已登入：${account || "（未命名）"}${readOnly ? "　｜　檢視模式" : ""}`
          : "尚未登入"}
      </S.Hint>

      {/* ── 分類 Chip 篩選列 ── */}
      <S.TypeBar>
        <S.TypeChip $active={tid === "__all"} onClick={() => handleTypeChip("__all")}>
          全部商品
        </S.TypeChip>
        {typeOptions.map((t, idx) => {
          const typeId = getTypeDisplayId(t) || `__idx_${idx}`;
          return (
            <S.TypeChip
              key={typeId}
              $active={tid === typeId}
              onClick={() => handleTypeChip(typeId)}
            >
              {displayTypeName((t as any).name ?? (t as any).product_type_name)}
            </S.TypeChip>
          );
        })}
        {canEdit && (
          <S.TypeChip $active={false} onClick={() => { setNewTypeName(""); setOpenModal("newType"); }}>
            ＋ 新增分類
          </S.TypeChip>
        )}
      </S.TypeBar>

      {/* ── 商品清單 ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 18 }}>
          載入中…
        </div>
      ) : products.length === 0 ? (
        <S.EmptyState>
          <div className="icon">📦</div>
          <p>
            {typeOptions.length === 0
              ? canEdit
                ? "尚未建立任何分類，請先新增分類再新增商品。"
                : "目前沒有可用的商品類型，請聯絡店主建立後再試。"
              : "此分類尚無商品。"}
          </p>
          {canEdit && (
            <PrimaryButton onClick={() => { setNewName(""); setAddError(""); setOpenModal("new"); }}>
              ＋ 新增商品
            </PrimaryButton>
          )}
        </S.EmptyState>
      ) : (
        <S.List>
          {products.map((p) => {
            const key = `${p._typeId ?? "x"}-${String(p.id)}`;
            const idStr = String(p.id);
            const emissionVal = (p as any).total_emission;
            return (
              <S.ProductCard
                key={key}
                onClick={(e) => handleCardClick(e, idStr)}
                onKeyDown={(e) => handleCardKeyDown(e, idStr)}
                role="button"
                tabIndex={0}
                aria-label={`商品：${p.name}`}
              >
                <S.Thumb>🍵</S.Thumb>
                <S.ProductInfo>
                  <S.ProductName>{p.name}</S.ProductName>
                  <S.ProductMeta>
                    <span>編號：{p.serialNumber ? `#${p.serialNumber}` : p.id ? `#${p.id}` : "—"}</span>
                    {emissionVal != null && (
                      <S.EmissionBadge>🌱 {Number(emissionVal).toFixed(2)} kg CO₂e</S.EmissionBadge>
                    )}
                  </S.ProductMeta>
                </S.ProductInfo>

                {!readOnly && (
                  <>
                    <S.MenuWrapper
                      ref={(el) => (btnRefs.current[idStr] = el)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === idStr ? null : idStr);
                      }}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen === idStr}
                      aria-label="更多操作"
                    >
                      ⋮
                    </S.MenuWrapper>

                    <DropdownMenu
                      anchorRef={{ current: btnRefs.current[idStr] }}
                      open={menuOpen === idStr}
                      onClose={() => setMenuOpen(null)}
                    >
                      <li onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setEditId(idStr);
                        setEditTypeId(p._typeId ?? (tid !== "__all" ? tid : null));
                        setEditName(p.name as string);
                        setOpenModal("edit");
                        setMenuOpen(null);
                      }}>
                        ✏️ 修改名稱
                      </li>
                      <li onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        requestDuplicate(p);
                        setMenuOpen(null);
                      }}>
                        📋 複製商品
                      </li>
                      <li className="danger" onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        handleDelete(p);
                        setMenuOpen(null);
                      }}>
                        🗑 刪除商品
                      </li>
                    </DropdownMenu>
                  </>
                )}
              </S.ProductCard>
            );
          })}
        </S.List>
      )}

      {!readOnly && (
        <S.Fab aria-label="新增商品" title="新增商品"
          onClick={() => { setNewName(""); setAddError(""); setOpenModal("new"); }}>
          ＋
        </S.Fab>
      )}

      {/* ── 新增商品 Modal ── */}
      <Modal open={!readOnly && openModal === "new"} onClose={() => setOpenModal(null)} ariaLabel="新增商品">
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
          <h3>新增商品</h3>
          <Field>
            <label htmlFor="new-product-name">商品名稱</label>
            <input
              id="new-product-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="請輸入商品名稱"
              required
              autoFocus
            />
          </Field>
          <Field>
            <label htmlFor="new-product-type">所屬分類</label>
            <select
              id="new-product-type"
              value={selectedType}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedType(v === "__new" ? "__new" : v);
              }}
              required
            >
              {typeOptions.map((t, idx) => {
                const typeId = getTypeDisplayId(t) || `__idx_${idx}`;
                return (
                  <option key={typeId} value={typeId}>
                    {displayTypeName((t as any).name ?? (t as any).product_type_name)}
                  </option>
                );
              })}
              {canEdit && <option value="__new">＋ 建立新分類…</option>}
            </select>
          </Field>
          {selectedType === "__new" && (
            <Field>
              <label htmlFor="new-type-name">新分類名稱</label>
              <input
                id="new-type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="請輸入分類名稱"
                required
              />
            </Field>
          )}
          {addError && <p style={{ color: "var(--warn)", fontSize: 16, margin: "8px 0" }}>⚠ {addError}</p>}
          <FormActions>
            <GhostButton type="button" onClick={() => setOpenModal(null)}>取消</GhostButton>
            <PrimaryButton type="submit">新增商品</PrimaryButton>
          </FormActions>
        </form>
      </Modal>

      {/* ── 修改商品名稱 Modal ── */}
      <Modal open={!readOnly && openModal === "edit"} onClose={() => setOpenModal(null)} ariaLabel="修改商品">
        <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
          <h3>修改商品名稱</h3>
          <Field>
            <label htmlFor="edit-product-name">商品名稱</label>
            <input
              id="edit-product-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <FormActions>
            <GhostButton type="button" onClick={() => setOpenModal(null)}>取消</GhostButton>
            <PrimaryButton type="submit">儲存</PrimaryButton>
          </FormActions>
        </form>
      </Modal>

      {/* ── 新增分類 Modal ── */}
      <Modal open={!readOnly && openModal === "newType"} onClose={() => setOpenModal(null)} ariaLabel="新增分類">
        <form onSubmit={(e) => { e.preventDefault(); handleAddType(); }}>
          <h3>新增商品分類</h3>
          <Field>
            <label htmlFor="new-cat-name">分類名稱</label>
            <input
              id="new-cat-name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="例如：台灣高山茶"
              required
              autoFocus
            />
          </Field>
          <FormActions>
            <GhostButton type="button" onClick={() => setOpenModal(null)}>取消</GhostButton>
            <PrimaryButton type="submit">建立分類</PrimaryButton>
          </FormActions>
        </form>
      </Modal>

      {/* ── 複製商品確認 Modal ── */}
      <Modal
        open={!readOnly && openModal === "confirmDup"}
        onClose={() => { if (!dupLoading) { setOpenModal(null); setDupTarget(null); } }}
        ariaLabel="確認複製商品"
      >
        <div>
          <h3>確認複製商品</h3>
          <p style={{ fontSize: 18, color: "var(--text)", margin: "0 0 8px" }}>
            確定要複製以下商品嗎？
          </p>
          <div style={{
            background: "var(--accent-bg)",
            border: "2px solid var(--line)",
            borderRadius: "var(--radius-sm)",
            padding: "16px 20px",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--accent-ink)",
            margin: "16px 0 8px",
          }}>
            📋 {dupTarget?.name ?? ""}
          </div>
          <p style={{ fontSize: 16, color: "var(--muted)", margin: "8px 0 0" }}>
            系統將建立一份相同名稱（後綴「複製」）的新商品，並複製所有生產步驟，原商品不受影響。
          </p>
          {dupStatus && (
            <p style={{
              fontSize: 16,
              color: "var(--accent-ink)",
              background: "var(--accent-bg)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              margin: "14px 0 0",
              fontWeight: 600,
            }}>
              ⏳ {dupStatus}
            </p>
          )}
          <FormActions>
            <GhostButton
              type="button"
              disabled={dupLoading}
              onClick={() => { setOpenModal(null); setDupTarget(null); }}
            >
              取消
            </GhostButton>
            <PrimaryButton
              type="button"
              disabled={dupLoading}
              onClick={confirmDuplicate}
            >
              {dupLoading ? "複製中…" : "確認複製"}
            </PrimaryButton>
          </FormActions>
        </div>
      </Modal>
    </S.PageWrapper>
  );
}
