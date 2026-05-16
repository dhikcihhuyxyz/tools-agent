import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Clapperboard,
  KeyRound,
  Activity,
  Settings,
  Zap,
  Menu,
  X,
  HeartHandshake,
  Users,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/motion-studio", icon: Clapperboard, label: "Motion Studio" },
  { to: "/api-vault", icon: KeyRound, label: "API Vault" },
  { to: "/activity-log", icon: Activity, label: "Activity Log" },
  {
    to: "/user-management",
    icon: Users,
    label: "User Management",
    adminOnly: true,
  },
  { to: "/support-donasi", icon: HeartHandshake, label: "Support dan Donasi" },
];

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitial(username) {
  if (!username) return "U";
  return username.trim().charAt(0).toUpperCase();
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

function SidebarContent({ onClose }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const handler = () => setUser(getStoredUser());

    window.addEventListener("storage", handler);
    window.addEventListener("toolsagent-user-updated", handler);

    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("toolsagent-user-updated", handler);
    };
  }, []);

  const username = user?.username || "User";
  const role = user?.role || "user";

  const visibleNavItems = navItems.filter((item) => {
    if (!item.adminOnly) return true;
    return role === "admin";
  });

  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "var(--accent)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px var(--accent-glow)",
            }}
          >
            <Zap size={17} color="#fff" fill="#fff" />
          </div>

          <span
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 800,
              fontSize: "16px",
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            ToolsAgent
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          overflowY: "auto",
        }}
      >
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
              background: isActive ? "var(--bg-hover)" : "transparent",
              border: isActive
                ? "1px solid var(--border-hover)"
                : "1px solid transparent",
              transition: "all 0.15s ease",
              position: "relative",
              lineHeight: 1.2,
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "18px",
                      background: "var(--accent)",
                      borderRadius: "0 3px 3px 0",
                      boxShadow: "0 0 8px var(--accent)",
                    }}
                  />
                )}

                <Icon
                  size={15}
                  color={isActive ? "var(--accent)" : "var(--text-muted)"}
                />

                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: "12px 10px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          title="Klik untuk logout"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "6px",
            transition: "background 0.15s",
            minWidth: 0,
            flex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              minWidth: "28px",
              background: "var(--accent-dim)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--accent)",
              border: "1px solid var(--accent-glow)",
            }}
          >
            {getInitial(username)}
          </div>

          <div style={{ minWidth: 0, textAlign: "left" }}>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "116px",
              }}
            >
              {username}
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {role}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            navigate("/settings");
            onClose && onClose();
          }}
          title="Settings"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            color: "var(--text-muted)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Settings size={15} />
        </button>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!isMobile) {
    return <SidebarContent onClose={null} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        style={{
          position: "fixed",
          top: "13px",
          left: "16px",
          zIndex: 100,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--text-muted)",
        }}
      >
        <Menu size={18} />
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 300,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>
    </>
  );
}