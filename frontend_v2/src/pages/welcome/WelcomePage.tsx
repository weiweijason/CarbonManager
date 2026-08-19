import React, { useEffect, useState } from "react";
import Modal from "@/ui/components/Modal";
import { PrimaryButton, GhostButton } from "@/ui/primitives/Button";
import { Field, FieldError, FormActions } from "@/ui/primitives/Form";
import * as S from "./WelcomePage.styles";
import { useNavigate } from "react-router-dom";

import { useUser } from "@/context/UserContext";
import type { BackendUserType } from "@/api/auth";
import { getUserFriendlyMessage } from "@/api/http";

// ---- 表單驗證輔助函式 ----
function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return "請輸入電子郵件";
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!pattern.test(email.trim())) return "無效的電子郵件格式";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "請輸入密碼";
  if (password.length < 8) return "密碼至少需要 8 個字元";
  if (password.length > 128) return "密碼不得超過 128 個字元";
  if (!/[A-Z]/.test(password)) return "密碼需包含至少一個大寫字母";
  if (!/[a-z]/.test(password)) return "密碼需包含至少一個小寫字母";
  if (!/[0-9]/.test(password)) return "密碼需包含至少一個數字";
  return null;
}

function validateUserName(name: string): string | null {
  if (!name || !name.trim()) return "請輸入使用者名稱";
  if (name.trim().length > 100) return "使用者名稱不得超過 100 個字元";
  return null;
}

export default function WelcomePage() {
  const [open, setOpen] = useState<null | "login" | "signup">(null);
  const navigate = useNavigate();

  // 只依賴 Context 的狀態，避免用 localStorage 造成重複導頁
  const { ready, isAuthed } = useUser();

  // ✅ 初始化完成且確定登入後，導向商品頁
  useEffect(() => {
    if (ready && isAuthed) {
      navigate("/products", { replace: true });
    }
  }, [ready, isAuthed, navigate]);

  return (
    <S.Bg>
      {/* 中央卡片 */}
      <S.Card role="region" aria-label="歡迎頁">
        <S.Hero
          src="/images/tea_v2.png"
          srcSet="/images/tea_v2.png 960w, /images/tea_v2.png 1920w"
          sizes="(max-width: 768px) 92vw, 960px"
          alt="茶園風景"
          loading="eager"
        />

        <S.Title>茶葉商品碳足跡管理平台</S.Title>
        <S.Subtitle>
          管理並追蹤您的茶葉產品與記錄其碳足跡，讓消費者與茶行攜手打造綠色的未來。
        </S.Subtitle>

        <S.Actions>
          <PrimaryButton onClick={() => setOpen("login")}>登入</PrimaryButton>
          <GhostButton onClick={() => setOpen("signup")}>註冊</GhostButton>
        </S.Actions>

        <S.FooterHint>
          <small>© {new Date().getFullYear()} 碳足跡管理平台</small>
        </S.FooterHint>
      </S.Card>

      {/* 登入 / 註冊 Modal */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        ariaLabel={open === "login" ? "登入" : "註冊"}
      >
        {open === "login" ? (
          <LoginForm onDone={() => setOpen(null)} />
        ) : (
          <SignupForm onDone={() => setOpen(null)} />
        )}
      </Modal>
    </S.Bg>
  );
}

/* -------------------- 登入表單 -------------------- */
function LoginForm({ onDone }: { onDone: () => void }) {
  const [account, setAcc] = useState("");
  const [password, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    // 前端驗證
    const emailErr = validateEmail(account);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!password) {
      setError("請輸入密碼");
      return;
    }
    
    setLoading(true);
    try {
      await login(account.trim(), password); // 成功會寫 token + me
      onDone(); // 關閉 Modal
      navigate("/products"); // 直接跳商品頁
    } catch (err: any) {
      setError(getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>登入帳號</h3>
      <Field>
        <label htmlFor="login-account">電子郵件</label>
        <input
          id="login-account"
          type="email"
          required
          value={account}
          onChange={(e) => setAcc(e.target.value)}
          placeholder="example@mail.com"
          autoComplete="username"
        />
      </Field>
      <Field>
        <label htmlFor="login-pwd">密碼</label>
        <input
          id="login-pwd"
          type="password"
          required
          value={password}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="請輸入密碼"
          autoComplete="current-password"
        />
      </Field>
      {error && <FieldError>{error}</FieldError>}
      <FormActions>
        <GhostButton type="button" onClick={onDone} disabled={loading}>
          取消
        </GhostButton>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "登入中…" : "登入"}
        </PrimaryButton>
      </FormActions>
    </form>
  );
}

/* -------------------- 註冊表單（後端對齊） -------------------- */
function SignupForm({ onDone }: { onDone: () => void }) {
  const [account, setAcc] = useState("");
  const [userName, setUserName] = useState(""); // 後端要求 user_name
  const [password, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [role, setRole] = useState<BackendUserType>("shop"); // "shop" | "customer"
  const [shopName, setShopName] = useState(""); // role=shop 時必填

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useUser();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    // 前端驗證
    const emailErr = validateEmail(account);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    
    if (password !== confirmPwd) {
      setError("兩次輸入的密碼不一致");
      return;
    }
    
    const nameErr = validateUserName(userName);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    
    if (role === "shop") {
      if (!shopName || !shopName.trim()) {
        setError("請輸入茶行名稱");
        return;
      }
      if (shopName.trim().length > 200) {
        setError("茶行名稱不得超過 200 個字元");
        return;
      }
    }

    setLoading(true);
    try {
      await register({
        account: account.trim().toLowerCase(),
        password,
        role,
        user_name: userName.trim(),
        organization_name: role === "shop" ? shopName.trim() : undefined,
      }); // 成功會寫 token + me
      onDone(); // 關閉 Modal
      navigate("/products"); // 直接跳商品頁
    } catch (err: any) {
      setError(getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>建立新帳號</h3>

      <Field>
        <label htmlFor="reg-account">電子郵件</label>
        <input
          id="reg-account"
          type="email"
          required
          value={account}
          onChange={(e) => setAcc(e.target.value)}
          placeholder="example@mail.com"
          autoComplete="username"
        />
      </Field>

      <Field>
        <label htmlFor="reg-name">使用者名稱</label>
        <input
          id="reg-name"
          type="text"
          required
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="請輸入您的名稱"
        />
      </Field>

      <Field>
        <label htmlFor="reg-pwd">密碼</label>
        <input
          id="reg-pwd"
          type="password"
          required
          value={password}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="至少 8 個字元"
          autoComplete="new-password"
        />
      </Field>

      <Field>
        <label htmlFor="reg-confirm">確認密碼</label>
        <input
          id="reg-confirm"
          type="password"
          required
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          placeholder="再次輸入相同密碼"
          autoComplete="new-password"
        />
      </Field>

      <Field>
        <label htmlFor="reg-role">我的身份</label>
        <select
          id="reg-role"
          value={role}
          onChange={(e) => setRole(e.target.value as BackendUserType)}
        >
          <option value="shop">🏪 茶行業者</option>
          <option value="customer">👤 消費者</option>
        </select>
      </Field>

      {role === "shop" && (
        <Field>
          <label htmlFor="reg-shop">茶行名稱</label>
          <input
            id="reg-shop"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="請輸入茶行或品牌名稱"
            required
          />
        </Field>
      )}

      {error && <FieldError>{error}</FieldError>}
      <FormActions>
        <GhostButton type="button" onClick={onDone} disabled={loading}>
          取消
        </GhostButton>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "建立中…" : "建立帳號"}
        </PrimaryButton>
      </FormActions>
    </form>
  );
}
