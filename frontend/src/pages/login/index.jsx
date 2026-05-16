import React, { useState } from "react";
import { Zap, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login / register
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function resetMessage() {
    setError(null);
    setSuccess(null);
  }

  async function loginUser() {
    const form = new FormData();
    form.append("username", username.trim());
    form.append("password", password);

    const res = await api.post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("token", res.data.access_token);

    try {
      const me = await api.get("/api/auth/me");
      localStorage.setItem("user", JSON.stringify(me.data));
      window.dispatchEvent(new Event("toolsagent-user-updated"));
    } catch {
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("toolsagent-user-updated"));
    }

    navigate("/dashboard");
  }

  async function registerUser() {
    await api.post("/api/auth/register", {
      username: username.trim(),
      password,
    });

    setSuccess("Akun berhasil dibuat. Sedang masuk ke dashboard...");

    await loginUser();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    resetMessage();

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      return setError("Username dan password wajib diisi");
    }

    if (password.length < 6) {
      return setError("Password minimal 6 karakter");
    }

    if (mode === "register" && password !== confirmPassword) {
      return setError("Konfirmasi password tidak sama");
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await loginUser();
      } else {
        await registerUser();
      }
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          (mode === "login"
            ? "Login gagal. Cek username & password."
            : "Daftar gagal. Coba username lain.")
      );
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "DM Mono, monospace",
        padding: "24px 14px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "400px",
          maxWidth: "80vw",
          height: "400px",
          background:
            "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "390px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "var(--accent)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 0 30px var(--accent-glow)",
            }}
          >
            <Zap size={26} color="#fff" fill="#fff" />
          </div>

          <h1
            style={{
              fontFamily: "Syne",
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--text-primary)",
              lineHeight: 1,
              margin: 0,
            }}
          >
            ToolsAgent
          </h1>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            {isLogin ? "Masuk ke dashboard kamu" : "Buat akun ToolsAgent baru"}
          </p>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "18px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              padding: "6px",
              borderRadius: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("login");
                resetMessage();
              }}
              style={{
                height: "36px",
                borderRadius: "9px",
                border: "1px solid",
                borderColor: isLogin ? "var(--border-hover)" : "transparent",
                background: isLogin ? "var(--bg-hover)" : "transparent",
                color: isLogin ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "DM Mono, monospace",
                fontSize: "12px",
                fontWeight: isLogin ? 700 : 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
              }}
            >
              <LogIn size={14} />
              Masuk
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                resetMessage();
              }}
              style={{
                height: "36px",
                borderRadius: "9px",
                border: "1px solid",
                borderColor: !isLogin ? "var(--border-hover)" : "transparent",
                background: !isLogin ? "var(--bg-hover)" : "transparent",
                color: !isLogin ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "DM Mono, monospace",
                fontSize: "12px",
                fontWeight: !isLogin ? 700 : 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
              }}
            >
              <UserPlus size={14} />
              Daftar
            </button>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                background: "#ef444418",
                border: "1px solid #ef444440",
                color: "var(--red)",
                marginBottom: "16px",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                background: "#22c55e18",
                border: "1px solid #22c55e40",
                color: "#22c55e",
                marginBottom: "16px",
                lineHeight: 1.5,
              }}
            >
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Username
              </label>

              <input
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  color: "var(--text-primary)",
                  width: "100%",
                  outline: "none",
                  fontFamily: "DM Mono, monospace",
                  boxSizing: "border-box",
                }}
                placeholder={isLogin ? "jhonde" : "username kamu"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Password
              </label>

              <div style={{ position: "relative" }}>
                <input
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "10px 40px 10px 12px",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    width: "100%",
                    outline: "none",
                    fontFamily: "DM Mono, monospace",
                    boxSizing: "border-box",
                  }}
                  type={showPass ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Konfirmasi Password
                </label>

                <input
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    width: "100%",
                    outline: "none",
                    fontFamily: "DM Mono, monospace",
                    boxSizing: "border-box",
                  }}
                  type={showPass ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "var(--bg-hover)" : "var(--accent)",
                border: "none",
                color: loading ? "var(--text-dim)" : "#fff",
                borderRadius: "9px",
                padding: "12px",
                fontSize: "13px",
                fontFamily: "DM Mono, monospace",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 0 20px var(--accent-glow)",
                transition: "all 0.2s",
                marginTop: "4px",
                fontWeight: 700,
              }}
            >
              {loading
                ? isLogin
                  ? "Masuk..."
                  : "Mendaftarkan..."
                : isLogin
                ? "Masuk →"
                : "Daftar →"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "11px",
            color: "var(--text-dim)",
            marginTop: "20px",
            lineHeight: 1.6,
          }}
        >
          {isLogin
            ? "Contoh login: jhonde / password kamu"
            : "Daftar hanya menggunakan username dan password"}
        </p>
      </div>
    </div>
  );
}