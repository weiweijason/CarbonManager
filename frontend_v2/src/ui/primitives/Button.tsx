import styled, { css } from "styled-components";

/* ─── 共用基礎 ─────────────────────────────────────────────── */
const base = css`
  appearance: none;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0 24px;
  height: var(--touch-target-lg);   /* 60px：長者友善觸控目標 */
  min-width: 120px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    transform 60ms ease;
  user-select: none;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* 清楚的 focus 環，鍵盤/輔助技術可見 */
  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
    box-shadow: 0 0 0 5px rgba(58, 158, 60, 0.20);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

export const ButtonBase = styled.button`${base}`;

/* ─── 主按鈕：填色 ─────────────────────────────────────────── */
export const PrimaryButton = styled.button`
  ${base}
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 3px 10px rgba(58, 158, 60, 0.30);

  &:hover:not(:disabled) {
    background: var(--accent-dk);
    border-color: var(--accent-dk);
    box-shadow: 0 4px 14px rgba(42, 122, 44, 0.38);
  }
`;

/* ─── 次要按鈕：白底邊框 ────────────────────────────────────── */
export const GhostButton = styled.button`
  ${base}
  background: #fff;
  color: var(--text);
  border-color: var(--line);
  box-shadow: var(--shadow-sm);

  &:hover:not(:disabled) {
    background: var(--accent-bg);
    border-color: var(--accent);
    color: var(--accent-ink);
  }
`;

/* ─── 白底按鈕（工具列用） ─────────────────────────────────── */
export const WhiteButton = styled.button<{ $small?: boolean }>`
  ${base}
  height: ${({ $small }) => ($small ? "42px" : "var(--touch-target-lg)")};
  padding: 0 ${({ $small }) => ($small ? "14px" : "20px")};
  font-size: ${({ $small }) => ($small ? "16px" : "18px")};
  background: #fff;
  color: var(--text);
  border-color: var(--line);
  box-shadow: var(--shadow-sm);

  &:hover:not(:disabled) {
    background: var(--accent-bg);
    border-color: var(--accent);
  }
`;

/* ─── 危險按鈕 ─────────────────────────────────────────────── */
export const DangerButton = styled.button`
  ${base}
  background: var(--warn-bg);
  color: var(--warn);
  border-color: #f0b0bb;

  &:hover:not(:disabled) {
    background: var(--warn);
    color: #fff;
    border-color: var(--warn);
  }
`;
