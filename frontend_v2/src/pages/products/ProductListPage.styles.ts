// frontend_v2/src/pages/products/ProductListPage.styles.ts
import styled from "styled-components";

/* ─── 頁面外層 ──────────────────────────────────────────────── */
export const PageWrapper = styled.div`
  background: var(--bg);
  min-height: 100vh;
  width: 100%;
  padding: 16px 16px 100px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/* ─── 頂部工具列 ────────────────────────────────────────────── */
export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--accent-ink);
  }

  .actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }
`;

/* ─── 提示文字 ──────────────────────────────────────────────── */
export const Hint = styled.div`
  font-size: 16px;
  color: var(--muted);
  padding: 2px 4px;
`;

/* ─── 類型篩選列 ────────────────────────────────────────────── */
export const TypeBar = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

export const TypeChip = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  height: 48px;
  padding: 0 20px;
  border-radius: 100px;
  border: 2px solid ${({ $active }) => ($active ? "var(--accent)" : "var(--line)")};
  background: ${({ $active }) => ($active ? "var(--accent)" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "var(--text)")};
  font-size: 17px;
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  cursor: pointer;
  white-space: nowrap;
  transition: all 160ms ease;
  box-shadow: ${({ $active }) => ($active ? "0 3px 10px rgba(58,158,60,.30)" : "var(--shadow-sm)")};

  &:hover {
    border-color: var(--accent);
    color: ${({ $active }) => ($active ? "#fff" : "var(--accent-ink)")};
    background: ${({ $active }) => ($active ? "var(--accent-dk)" : "var(--accent-bg)")};
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
`;

/* ─── 產品列表 ──────────────────────────────────────────────── */
export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/* ─── 產品卡片 ──────────────────────────────────────────────── */
export const ProductCard = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 18px 20px;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
    border-color: var(--accent);
  }

  &:active {
    transform: translateY(0);
  }
`;

/* ─── 縮圖佔位 ──────────────────────────────────────────────── */
export const Thumb = styled.div`
  width: 60px;
  height: 60px;
  background: var(--accent-bg);
  border-radius: var(--radius-sm);
  margin-right: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
`;

/* ─── 產品資訊 ──────────────────────────────────────────────── */
export const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ProductName = styled.div`
  font-size: 19px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ProductMeta = styled.div`
  font-size: 15px;
  color: var(--muted);
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const EmissionBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-ink);
  background: var(--accent-bg);
  border-radius: 100px;
  padding: 3px 10px;
`;

/* ─── 卡片選單按鈕 ──────────────────────────────────────────── */
export const MenuWrapper = styled.button`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--muted);
  border-radius: var(--radius-sm);
  transition: background 150ms;

  &:hover {
    background: var(--accent-bg);
    color: var(--accent-ink);
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
`;

/* ─── 空狀態 ────────────────────────────────────────────────── */
export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: var(--muted);

  .icon {
    font-size: 56px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  p {
    font-size: 18px;
    margin: 0 0 20px;
  }
`;

/* ─── 懸浮新增按鈕 ──────────────────────────────────────────── */
export const Fab = styled.button`
  position: fixed;
  bottom: 28px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  font-size: 32px;
  border: none;
  box-shadow: 0 6px 18px rgba(58, 158, 60, 0.42);
  cursor: pointer;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms, transform 100ms, box-shadow 150ms;

  &:hover {
    background: var(--accent-dk);
    box-shadow: 0 8px 22px rgba(42, 122, 44, 0.50);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 3px solid var(--accent-ink);
    outline-offset: 3px;
  }
`;

/* 向後相容 */
export const PrimaryBtn = Fab;
export const SecondaryBtn = styled.button`
  background: #f3f5f1;
  border: 2px solid var(--line);
  color: var(--text);
  font-size: 17px;
  font-weight: 500;
  padding: 0 18px;
  height: var(--touch-target);
  border-radius: var(--radius-sm);
  cursor: pointer;
  &:hover { background: var(--accent-bg); border-color: var(--accent); }
`;
export const ActionBtn = SecondaryBtn;
