import React from "react";
import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";

const pageTitles = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Ringkasan aktivitas akun kamu",
  },
  "/motion-studio": {
    title: "Motion Studio",
    subtitle: "Generate video dengan AI",
  },
  "/api-vault": {
    title: "API Vault",
    subtitle: "Kelola API key untuk proses generate",
  },
  "/activity-log": {
    title: "Activity Log",
    subtitle: "Timeline aktivitas akun kamu",
  },
  "/support-donasi": {
    title: "Support dan Donasi",
    subtitle: "Dukung pengembangan ToolsAgent",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Pengaturan aplikasi",
  },
};

export default function Topbar({ isMobile }) {
  const { pathname } = useLocation();

  const page = pageTitles[pathname] || {
    title: "ToolsAgent",
    subtitle: "",
  };

  const now = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      style={{
        height: "60px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 16px 0 64px" : "0 32px",
        flexShrink: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: isMobile ? "190px" : "none",
          }}
        >
          {page.title}
        </h1>

        {!isMobile && (
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "3px",
            }}
          >
            {page.subtitle}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {!isMobile && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-dim)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            {now}
          </span>
        )}

        <button
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-muted)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Bell size={14} />
        </button>
      </div>
    </header>
  );
}