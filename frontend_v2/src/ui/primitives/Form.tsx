import styled from "styled-components";

/* ─── 單一欄位容器 ─────────────────────────────────────────── */
export const Field = styled.div`
  display: grid;
  gap: 8px;
  margin: 14px 0;
  text-align: left;

  /* 標籤：清晰可讀 */
  label {
    font-size: 17px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.1px;
  }

  /* 說明文字 */
  small {
    font-size: 15px;
    color: var(--muted);
  }

  /* 共用 input / textarea / select 樣式 */
  input,
  textarea,
  select {
    width: 100%;
    padding: 0 16px;
    height: var(--touch-target-lg);   /* 60px */
    border: 2px solid var(--line);
    border-radius: var(--radius-sm);
    font-size: 18px;
    font-family: inherit;
    color: var(--text);
    background: #fff;
    transition: border-color 150ms, box-shadow 150ms;
    appearance: none;
    -webkit-appearance: none;
    outline: none;

    &::placeholder {
      color: #9aab96;
      font-size: 17px;
    }

    &:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(58, 158, 60, 0.18);
    }

    &:disabled {
      background: #f5f7f4;
      color: var(--muted);
      cursor: not-allowed;
    }
  }

  textarea {
    height: auto;
    min-height: 100px;
    padding: 14px 16px;
    resize: vertical;
  }

  /* select：自訂下拉箭頭 */
  select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%234A5E4B' d='M5 7l5 5 5-5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 44px;
    cursor: pointer;
  }
`;

/* ─── 錯誤提示 ─────────────────────────────────────────────── */
export const FieldError = styled.p`
  margin: 4px 0 0;
  font-size: 15px;
  color: var(--warn);
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: "⚠";
    font-size: 16px;
  }
`;

/* ─── 表單底部操作列 ────────────────────────────────────────── */
export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;

  /* 在小螢幕讓按鈕各佔一行 */
  @media (max-width: 400px) {
    flex-direction: column-reverse;
    > * { width: 100%; }
  }
`;

/* ─── 表單區塊分隔線 ────────────────────────────────────────── */
export const FormDivider = styled.hr`
  border: none;
  border-top: 1.5px solid var(--line);
  margin: 20px 0;
`;
