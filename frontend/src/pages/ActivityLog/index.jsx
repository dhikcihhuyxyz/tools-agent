import React, { useState, useEffect } from "react";
import {
  Clapperboard,
  KeyRound,
  RefreshCw,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Activity,
} from "lucide-react";
import api from "../../utils/api";
import useWindowSize from "../../utils/useWindowSize";

function parseBackendDate(dateStr) {
  if (!dateStr) return null;

  const hasTimezone =
    dateStr.endsWith("Z") ||
    /[+-]\d{2}:\d{2}$/.test(dateStr);

  return new Date(hasTimezone ? dateStr : `${dateStr}Z`);
}

function timeAgo(dateStr) {
  const date = parseBackendDate(dateStr);
  if (!date || Number.isNaN(date.getTime())) return "-";

  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diff < 10) return "baru saja";
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;

  return `${Math.floor(diff / 86400)} hari lalu`;
}

function getUsernameFromLog(log) {
  return (
    log?.metadata?.username ||
    log?.metadata?.user ||
    log?.metadata?.created_user ||
    log?.description?.match(/'([^']+)'/)?.[1] ||
    "User"
  );
}

function isImportantLog(log) {
  if (!log) return false;

  const action = log.action || "";
  const module = log.module || "";
  const status = log.status || "";

  const hiddenActions = [
    "user_login",
    "user_login_failed",
    "default_admin_created",
    "status_check_failed",
  ];

  if (hiddenActions.includes(action)) return false;

  if (action === "user_register") return true;

  if (module === "motion_studio") return true;

  if (
    action.includes("generate_video") ||
    action.includes("video_task")
  ) {
    return true;
  }

  if (
    action.startsWith("api_key_") ||
    module === "api_vault" ||
    module === "magnific"
  ) {
    return true;
  }

  if (status === "failed" || status === "warning") return true;

  return false;
}

function formatLog(log) {
  const action = log.action || "";
  const username = getUsernameFromLog(log);

  if (action === "user_register") {
    return {
      ...log,
      displayTitle: `${username} mendaftar`,
      displayDescription: `User baru "${username}" berhasil membuat akun.`,
    };
  }

  if (action === "generate_video_started") {
    return {
      ...log,
      displayTitle: "Mulai generate video",
      displayDescription:
        log.description || "User memulai proses generate video.",
    };
  }

  if (action === "generate_video_queued") {
    return {
      ...log,
      displayTitle: "Video masuk antrean",
      displayDescription:
        log.description || "Task video berhasil dibuat dan masuk antrean.",
    };
  }

  if (action === "generate_video_completed") {
    return {
      ...log,
      displayTitle: "Video selesai",
      displayDescription:
        log.description || "Video berhasil selesai diproses.",
    };
  }

  if (action === "generate_video_failed") {
    return {
      ...log,
      displayTitle: "Generate video gagal",
      displayDescription:
        log.description || "Video gagal diproses.",
    };
  }

  if (action === "api_key_create") {
    return {
      ...log,
      displayTitle: "API key ditambahkan",
      displayDescription:
        log.description || "User menambahkan API key baru.",
    };
  }

  if (action === "api_key_update") {
    return {
      ...log,
      displayTitle: "API key diperbarui",
      displayDescription:
        log.description || "User memperbarui API key.",
    };
  }

  if (action === "api_key_delete") {
    return {
      ...log,
      displayTitle: "API key dihapus",
      displayDescription:
        log.description || "User menghapus API key.",
    };
  }

  if (action === "api_key_limited") {
    return {
      ...log,
      displayTitle: "API key terkena limit",
      displayDescription:
        log.description || "API key terkena limit dan perlu failover.",
    };
  }

  if (action === "api_key_failover") {
    return {
      ...log,
      displayTitle: "API key failover",
      displayDescription:
        log.description || "Sistem mencoba API key berikutnya.",
    };
  }

  return {
    ...log,
    displayTitle: log.title || "Aktivitas",
    displayDescription: log.description || "",
  };
}

const MODULE_CONFIG = {
  auth: {
    icon: UserPlus,
    color: "#38bdf8",
    label: "User",
  },
  api_vault: {
    icon: KeyRound,
    color: "#fb923c",
    label: "API Vault",
  },
  magnific: {
    icon: AlertTriangle,
    color: "#a78bfa",
    label: "Magnific",
  },
  motion_studio: {
    icon: Clapperboard,
    color: "#a78bfa",
    label: "Motion Studio",
  },
};

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle,
    color: "var(--green)",
    label: "Sukses",
  },
  failed: {
    icon: XCircle,
    color: "var(--red)",
    label: "Gagal",
  },
  warning: {
    icon: AlertTriangle,
    color: "var(--yellow)",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "var(--accent)",
    label: "Info",
  },
};

const FILTERS = [
  { id: "all", label: "Semua", test: () => true },
  { id: "user", label: "User Daftar", test: (log) => log.action === "user_register" },
  { id: "video", label: "Video", test: (log) => log.module === "motion_studio" || log.action?.includes("generate_video") },
  { id: "api_key", label: "API Key", test: (log) => log.module === "api_vault" || log.module === "magnific" || log.action?.startsWith("api_key_") },
  { id: "problem", label: "Warning/Gagal", test: (log) => ["warning", "failed"].includes(log.status) },
];

export default function ActivityLog() {
  const { isMobile } = useWindowSize();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const PER_PAGE = 15;

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);

    try {
      const logsRes = await api.get("/api/activity/");
      const cleaned = (logsRes.data || [])
        .filter(isImportantLog)
        .map(formatLog);

      setActivities(cleaned);
    } catch (e) {
      console.error("Gagal memuat activity log:", e);
    } finally {
      setLoading(false);
    }
  }

  const activeFilter = FILTERS.find((item) => item.id === filter) || FILTERS[0];
  const filtered = activities.filter(activeFilter.test);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const summary = {
    total: activities.length,
    user: activities.filter((log) => log.action === "user_register").length,
    video: activities.filter((log) => log.module === "motion_studio" || log.action?.includes("generate_video")).length,
    apiKey: activities.filter((log) => log.module === "api_vault" || log.module === "magnific" || log.action?.startsWith("api_key_")).length,
    problem: activities.filter((log) => ["warning", "failed"].includes(log.status)).length,
  };

  function handleFilter(nextFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

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
            Activity Log
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            Aktivitas penting saja: user daftar, generate video, API key, warning, dan error.
          </p>
        </div>

        <button
          onClick={fetchAll}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "DM Mono, monospace",
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
          gap: "12px",
        }}
      >
        {[
          { label: "Penting", value: summary.total },
          { label: "User Daftar", value: summary.user },
          { label: "Video", value: summary.video },
          { label: "API Key", value: summary.apiKey },
          { label: "Warning/Gagal", value: summary.problem },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "16px 18px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                fontFamily: "Syne",
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {loading ? "—" : item.value}
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "5px",
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "6px",
          background: "var(--bg-card)",
          padding: "5px",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          width: "fit-content",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleFilter(item.id)}
            style={{
              padding: "7px 14px",
              borderRadius: "7px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "DM Mono, monospace",
              background: filter === item.id ? "var(--accent)" : "transparent",
              color: filter === item.id ? "#fff" : "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: isMobile ? "14px" : "20px",
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "var(--text-dim)",
              fontSize: "13px",
            }}
          >
            Memuat aktivitas...
          </div>
        ) : paginated.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "var(--text-dim)",
              fontSize: "13px",
            }}
          >
            Belum ada aktivitas penting
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {paginated.map((item) => {
              const moduleConfig = MODULE_CONFIG[item.module] || {
                icon: Activity,
                color: "#6b7280",
                label: item.module || "System",
              };

              const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.info;
              const Icon = moduleConfig.icon;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "13px 14px",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      minWidth: "38px",
                      background: moduleConfig.color + "18",
                      border: `1px solid ${moduleConfig.color}30`,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} color={moduleConfig.color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "var(--text-primary)",
                              fontWeight: 600,
                            }}
                          >
                            {item.displayTitle}
                          </span>

                          <span
                            style={{
                              fontSize: "10px",
                              color: statusConfig.color,
                              background: statusConfig.color + "18",
                              border: `1px solid ${statusConfig.color}30`,
                              padding: "2px 7px",
                              borderRadius: "99px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <StatusIcon size={10} />
                            {statusConfig.label}
                          </span>
                        </div>

                        {item.displayDescription && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              margin: "5px 0 0",
                              lineHeight: 1.6,
                            }}
                          >
                            {item.displayDescription}
                          </p>
                        )}

                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-dim)",
                            marginTop: "6px",
                            fontFamily: "DM Mono, monospace",
                          }}
                        >
                          {moduleConfig.label} · {item.action}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-dim)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: page === 1 ? "var(--text-dim)" : "var(--text-muted)",
                borderRadius: "7px",
                padding: "6px 14px",
                fontSize: "12px",
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Prev
            </button>

            <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: page === totalPages ? "var(--text-dim)" : "var(--text-muted)",
                borderRadius: "7px",
                padding: "6px 14px",
                fontSize: "12px",
                cursor: page === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}