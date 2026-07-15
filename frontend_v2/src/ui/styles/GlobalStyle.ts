import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  :root{
    /* === 顏色 === */
    --bg:         #EDF3ED;
    --card:       #FFFFFF;
    --line:       #CFDEC9;
    --text:       #18271A;   /* 深墨綠，高對比 */
    --muted:      #4A5E4B;   /* 次要文字，仍有足夠對比 */
    --accent:     #3A9E3C;   /* 主色加深，確保 AA 以上 */
    --accent-dk:  #2A7A2C;   /* hover / active */
    --accent-ink: #1A4E1C;   /* 文字版主色 */
    --accent-bg:  #EBF7EB;   /* 極淺主色背景 */
    --chip:       #F0F8EF;
    --warn:       #C00020;
    --warn-bg:    #FFF0F2;
    --ok:         #1A6E1A;
    --ok-bg:      #EAFAEA;

    /* === 圓角 === */
    --radius-sm:  12px;
    --radius:     16px;
    --radius-lg:  22px;

    /* === 陰影 === */
    --shadow-sm:  0 2px 8px  rgba(0,0,0,.08);
    --shadow:     0 6px 20px rgba(0,0,0,.10);
    --shadow-lg:  0 12px 36px rgba(0,0,0,.14);

    /* === 間距（長者友善：更寬鬆） === */
    --space-1: 8px;
    --space-2: 14px;
    --space-3: 20px;
    --space-4: 28px;
    --space-5: 36px;

    /* === 內容最大寬 === */
    --shell-max: 1080px;
  }

  html { font-size: 18px; }

  html, body { height: 100%; }
  body {
    min-height: 100svh;
    margin: 0;
    /* 優先系統字體，確保中文清晰 */
    font-family:
      "PingFang TC", "Noto Sans TC", "Microsoft JhengHei",
      ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 18px;
    line-height: 1.65;
    color: var(--text);
    background: var(--bg);
    overflow-x: clip;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1 { font-size: 26px; font-weight: 800; line-height: 1.3; margin: 0; }
  h2 { font-size: 22px; font-weight: 700; line-height: 1.35; margin: 0; }
  h3 { font-size: 20px; font-weight: 700; line-height: 1.4;  margin: 0; }
  h4 { font-size: 18px; font-weight: 600; line-height: 1.45; margin: 0; }

  p  { margin: 0 0 8px; }

  /* 通用 focus 環：清晰可見 */
  :focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
  }

  img, svg, video { max-width: 100%; height: auto; }
  .modal-card { max-height: 84dvh; overflow: auto; -webkit-overflow-scrolling: touch; }
`;
