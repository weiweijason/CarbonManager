import styled from "styled-components";

/* 背景遮罩 */
export const Backdrop = styled.div`
  --modal-gap: 20px;
  --safe-inline: max(env(safe-area-inset-left), env(safe-area-inset-right), 0px);

  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(2px);

  display: flex;
  align-items: center;
  justify-content: center;

  padding-left:  calc(var(--modal-gap) + var(--safe-inline));
  padding-right: calc(var(--modal-gap) + var(--safe-inline));
  padding-top:    var(--modal-gap);
  padding-bottom: var(--modal-gap);

  box-sizing: border-box;

  @media (max-width: 400px) {
    --modal-gap: 12px;
  }
`;

/* 卡片外框 */
export const Card = styled.div<{ $maxW: number }>`
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  box-sizing: border-box;

  width: 100%;
  max-width: ${({ $maxW }) => `${$maxW}px`};
  margin-inline: auto;

  max-height: 88dvh;
  overflow: hidden;
`;

/* 滾動內容區 */
export const ScrollArea = styled.div`
  padding: 28px 28px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(88dvh - 2px);
  box-sizing: border-box;
  max-width: 100%;

  @media (max-width: 400px) {
    padding: 20px 16px 18px;
  }

  /* Modal 內部標題 */
  h3 {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 2px solid var(--line);
  }
`;
