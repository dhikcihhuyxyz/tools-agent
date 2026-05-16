import React, { useEffect, useState } from "react";
import {
  Save,
  User,
  Bell,
  Shield,
  RefreshCw,
  KeyRound,
  Clapperboard,
  Info,
  LogOut,
} from "lucide-react";
import api from "../../utils/api";
import useWindowSize from "../../utils/useWindowSize";

const inputStyle = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
  fontFamily: "DM Mono, monospace",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
  marginBottom: "6px",
  display: "block",
};

const SectionCard = ({ icon: Icon, title, children }) => (
  <div
    style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "14px",
      padding: "20px",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px",
        paddingBottom: "14px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          background: "var(--accent-dim)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} color="var(--accent)" />
      </div>

      <h3
        style={{
          fontFamily: "Syne",
          fontSize: "14px",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        {title}
      </h3>
    </div>

    {children}
  </div>
);

const Toggle = ({ value, onChange, label, sub }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "14px",
      padding: "12px 0",
      borderBottom: "1px solid var(--border)",
    }}
  >
    <div>
      <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
        {label}
      </div>

      {sub && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-dim)",
            marginTop: "3px",
            lineHeight: 1.5,
          }}
        >
          {sub}
        </div>
      )}
    </div>

    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: "40px",
        height: "22px",
        borderRadius: "11px",
        background: value ? "var(--accent)" : "var(--bg-hover)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        boxShadow: value ? "0 0 10px var(--accent-glow)" : "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: value ? "21px" : "3px",
          width: "16px",
          height: "16px",
          background: "#fff",
          borderRadius: "50%",
          transition: "left 0.2s",
        }}
      />
    </button>
  </div>
);

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export default function Settings() {
  const { isMobile, isTablet } = useWindowSize();

  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState(() => getStoredUser());
  const [username, setUsername] = useState(user?.username || "");
  const [role, setRole] = useState(user?.role || "user");

  const [notifVideo, setNotifVideo] = useState(true);
  const [notifKeyLimit, setNotifKeyLimit] = useState(true);
  const [notifActivity, setNotifActivity] = useState(true);

  const [autoRotate, setAutoRotate] = useState(true);
  const [autoPoll, setAutoPoll] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  function showMsg(text, type) {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  }

  async function fetchMe() {
    setRefreshing(true);

    try {
      const res = await api.get("/api/auth/me");

      setUser(res.data);
      setUsername(res.data.username || "");
      setRole(res.data.role || "user");

      localStorage.setItem("user", JSON.stringify(res.data));
      window.dispatchEvent(new Event("toolsagent-user-updated"));

      showMsg("Data akun berhasil diperbarui", "success");
    } catch (e) {
      showMsg(e.response?.data?.detail || "Gagal mengambil data akun", "error");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setSaving(true);

    try {
      const current = {
        ...(user || {}),
        username: username || user?.username || "User",
        role,
      };

      localStorage.setItem("user", JSON.stringify(current));
      window.dispatchEvent(new Event("toolsagent-user-updated"));

      setUser(current);
      showMsg("Profil lokal berhasil diperbarui", "success");
    } catch {
      showMsg("Gagal menyimpan profil", "error");
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    setSaving(true);

    try {
      const preferences = {
        notifVideo,
        notifKeyLimit,
        notifActivity,
        autoRotate,
        autoPoll,
        compactMode,
      };

      localStorage.setItem("toolsagent_preferences", JSON.stringify(preferences));

      showMsg("Preferensi berhasil disimpan", "success");
    } catch {
      showMsg("Gagal menyimpan preferensi", "error");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("toolsagent_preferences");
      if (!raw) return;

      const pref = JSON.parse(raw);

      setNotifVideo(pref.notifVideo ?? true);
      setNotifKeyLimit(pref.notifKeyLimit ?? true);
      setNotifActivity(pref.notifActivity ?? true);
      setAutoRotate(pref.autoRotate ?? true);
      setAutoPoll(pref.autoPoll ?? true);
      setCompactMode(pref.compactMode ?? false);
    } catch {
      // ignore invalid local storage
    }
  }, []);

  const gridColumns = isMobile || isTablet ? "1fr" : "1fr 1fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Syne",
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Settings
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            Pengaturan akun, notifikasi, dan sistem ToolsAgent.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMe}
          disabled={refreshing}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "12px",
            cursor: refreshing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "DM Mono, monospace",
          }}
        >
          <RefreshCw size={13} className={refreshing ? "spin" : ""} />
          Refresh Akun
        </button>
      </div>

      {msg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            background: msg.type === "success" ? "#22c55e18" : "#ef444418",
            border: `1px solid ${
              msg.type === "success" ? "#22c55e40" : "#ef444440"
            }`,
            color: msg.type === "success" ? "var(--green)" : "var(--red)",
          }}
        >
          {msg.text}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridColumns,
          gap: "16px",
        }}
      >
        <SectionCard icon={User} title="Profil Akun">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input
                style={inputStyle}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-dim)",
                  marginTop: "6px",
                  lineHeight: 1.6,
                }}
              >
                Saat ini perubahan username hanya disimpan lokal di browser.
                Login tetap memakai username yang ada di backend.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Role</label>
              <input style={inputStyle} value={role} disabled />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  color: "var(--green)",
                }}
              >
                Authenticated
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                style={{
                  background: "var(--accent)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                <Save size={14} />
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </button>

              <button
                type="button"
                onClick={logout}
                style={{
                  background: "#ef444418",
                  border: "1px solid #ef444440",
                  color: "var(--red)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Bell} title="Notifikasi">
          <div>
            <Toggle
              value={notifVideo}
              onChange={setNotifVideo}
              label="Video selesai di-generate"
              sub="Notifikasi saat task Motion Studio completed."
            />

            <Toggle
              value={notifKeyLimit}
              onChange={setNotifKeyLimit}
              label="API key terkena limit"
              sub="Notifikasi saat key Magnific perlu failover."
            />

            <Toggle
              value={notifActivity}
              onChange={setNotifActivity}
              label="Aktivitas penting"
              sub="Notifikasi untuk login, generate gagal, dan perubahan API key."
            />
          </div>

          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            style={{
              marginTop: "16px",
              background: "var(--accent)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              padding: "10px",
              width: "100%",
              fontSize: "13px",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
            }}
          >
            <Save size={14} />
            Simpan Notifikasi
          </button>
        </SectionCard>

        <SectionCard icon={Shield} title="Sistem">
          <div>
            <Toggle
              value={autoRotate}
              onChange={setAutoRotate}
              label="Auto-failover API key"
              sub="Sistem otomatis mencoba API key berikutnya saat key gagal atau terkena limit."
            />

            <Toggle
              value={autoPoll}
              onChange={setAutoPoll}
              label="Auto-poll video status"
              sub="Frontend otomatis mengecek status video yang masih queued atau processing."
            />

            <Toggle
              value={compactMode}
              onChange={setCompactMode}
              label="Compact mode"
              sub="Preferensi tampilan lebih ringkas. Saat ini disimpan sebagai preferensi lokal."
            />
          </div>

          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            style={{
              marginTop: "16px",
              background: "var(--accent)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              padding: "10px",
              width: "100%",
              fontSize: "13px",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
            }}
          >
            <Save size={14} />
            Simpan Sistem
          </button>
        </SectionCard>

        <SectionCard icon={Info} title="Info Aplikasi">
          <div
            style={{
              padding: "12px 14px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-dim)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Stack
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { icon: Shield, label: "Backend", value: "FastAPI + SQLite" },
                { icon: Clapperboard, label: "Motion Studio", value: "Magnific AI" },
                { icon: KeyRound, label: "API Vault", value: "User-based key management" },
                { icon: Bell, label: "Activity Log", value: "Auth, API Vault, Motion Studio" },
                { icon: Info, label: "Versi", value: "1.0.0" },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </span>

                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-dim)",
                      fontFamily: "DM Mono, monospace",
                      textAlign: "right",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}