//src/pages/lifecycle/ProductLifeCycle.styles.ts
import styled from "styled-components";

/* ─── 階段容器 ────────────────────────────────────────────── */
export const StageContainer = styled.div`
  max-width: 600px;
  margin: 0 auto 28px;
`;

/* ─── Modal 區塊 ─────────────────────────────────────────── */
export const ModalBody = styled.div`
  /* 由 Modal.styles.ts 的 ScrollArea 提供外層 padding */
`;

export const ModalTitle = styled.h3`
  margin: 0 0 20px;
  color: var(--accent-ink);
  font-size: 22px;
  font-weight: 700;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--line);
`;

/* ─── 詳細資訊列 ─────────────────────────────────────────── */
export const MetaRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
`;

export const MetaLabel = styled.span`
  color: var(--muted);
  font-size: 16px;
  font-weight: 600;
  min-width: 72px;
  flex-shrink: 0;
`;

export const MetaText = styled.span`
  color: var(--text);
  font-size: 16px;
  line-height: 1.5;
`;

/* ─── 成功提示 ───────────────────────────────────────────── */
export const SuccessTip = styled.p`
  color: var(--ok);
  background: var(--ok-bg);
  border: 1.5px solid #a8e8a8;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 17px;
  font-weight: 600;
  margin: 12px 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "✅";
    font-size: 18px;
  }
`;

/* ─── 輸入框 ─────────────────────────────────────────────── */
export const Input = styled.input`
  width: 100%;
  padding: 0 16px;
  height: 56px;
  font-size: 18px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--line);
  background: #fff;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;

  &::placeholder {
    color: #9aab96;
    font-size: 17px;
  }

  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(58, 158, 60, 0.18);
  }
`;

/* ─── 用量列（數量 + 單位） ──────────────────────────────── */
export const AmountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  ${Input} {
    flex: 1;
  }
`;

export const UnitText = styled.span`
  font-size: 17px;
  font-weight: 600;
  color: var(--muted);
  min-width: 56px;
  flex-shrink: 0;
`;

/* ─── 碳排放量顯示 ────────────────────────────────────────── */
export const EmissionText = styled.p`
  font-size: 17px;
  color: var(--text);
  margin: 10px 0 0;
  padding: 12px 16px;
  background: var(--chip);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 8px;

  strong {
    color: var(--accent-ink);
  }
`;

/* ─── 歷史記錄框 ─────────────────────────────────────────── */
export const HistoryBox = styled.div`
  margin: 20px 0 10px;
  padding: 14px 16px;
  background: #f8faf8;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-sm);
  max-height: 200px;
  overflow-y: auto;
`;

export const HistoryTitle = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
  margin-bottom: 10px;
`;

export const EmptyHint = styled.div`
  font-size: 16px;
  color: var(--muted);
  text-align: center;
  padding: 12px 0;
`;

export const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  font-size: 16px;

  &:last-child {
    border-bottom: none;
  }
`;

export const HistoryTime = styled.span`
  color: var(--muted);
  font-size: 14px;
  margin-left: 8px;
`;

/* ─── 按鈕列 ─────────────────────────────────────────────── */
export const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;

  @media (max-width: 400px) {
    flex-direction: column-reverse;
    > * { width: 100%; }
  }
`;

/* 向後相容 */
export const SubmitButton = styled.button`
  height: 56px;
  padding: 0 24px;
  background: var(--accent);
  color: #fff;
  border-radius: var(--radius-sm);
  border: 2px solid var(--accent);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: background 140ms, box-shadow 140ms;

  &:hover { background: var(--accent-dk); }
  &:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
`;

export const CancelButton = styled.button`
  height: 56px;
  padding: 0 24px;
  background: #fff;
  color: var(--text);
  border-radius: var(--radius-sm);
  border: 2px solid var(--line);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 140ms, border-color 140ms;

  &:hover { background: var(--accent-bg); border-color: var(--accent); }
  &:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
`;
