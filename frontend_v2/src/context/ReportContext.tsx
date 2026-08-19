// src/context/ReportContext.tsx
import React, { createContext, useContext } from "react";

const Ctx = /*#__PURE__*/ createContext({
  exportXlsmByProduct: async (productId: string) => {},
});

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const exportXlsmByProduct = async (productId: string) => {
    if (!productId) {
      throw new Error("缺少產品 ID");
    }

    // 和 http.ts 一樣的概念：有 VITE_API_BASE 就用，沒有就走 /api
    const base =
      (import.meta.env.VITE_API_BASE as string | undefined) || "/api";

    const url =
      base.replace(/\/$/, "") +
      "/report/" +
      encodeURIComponent(productId);

    // 取得 JWT Token
    const token =
      localStorage.getItem("access_token") ??
      localStorage.getItem("token");

    if (!token) {
      throw new Error("未登入，無法匯出報表");
    }

    // 使用 fetch 並帶上 Authorization header
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`匯出失敗 (${response.status}): ${errorText}`);
    }

    // 將回應轉為 blob 並下載
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${productId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <Ctx.Provider value={{ exportXlsmByProduct }}>
      {children}
    </Ctx.Provider>
  );
}

export const useReport = () => useContext(Ctx);
