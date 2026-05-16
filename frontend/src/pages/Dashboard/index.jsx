import React, { useState, useEffect } from "react";
import {
  Clapperboard,
  KeyRound,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Activity,
  HeartHandshake,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  if (action.includes("generate_video")) return true;
  if (action.startsWith("api_key_")) return true;
  if (module === "api_vault" || module === "magnific") return true;
  if (status === "failed" || status === "warning") return true;

  return false;
}

function formatActivityTitle(log) {
  const action = log.action || "";
  const username = getUsernameFromLog(log);

  if (action === "user_register") return `${username} mendaftar`;
  if (action === "generate_video_started") return "Mulai generate video";
  if (action === "generate_video_queued") return "Video masuk antrean";
  if (action === "generate_video_completed") return "Video selesai";
  if (action === "generate_video_failed") return "Generate video gagal";
  if (action === "api_key_create") return "API key ditambahkan";
  if (action === "api_key_update") return "API key diperbarui";
  if (action === "api_key_delete") return "API key dihapus";
  if (action === "api_key_limited") return "API key terkena limit";
  if (action === "api_key_failover") return "API key failover";

  return log.title || "Aktivitas";
}

const StatCard = ({ icon: Icon, label, value, sub, color, trend, loading }) => (
  <div
    style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "14px",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "80px",
        height: "80px",
        background: color + "0a",
        borderRadius: "0 14px 0 80px",
      }}
    />

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          background: color + "18",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} color={color} />
      </div>

      {trend && (
        <span
          style={{
            fontSize: "11px",
            color: "var(--green)",
            background: "#22c55e15",
            padding: "3px 8px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <ArrowUpRight size={10} />
          {trend}
        </span>
      )}
    </div>

    <div>
      <div
        style={{
          fontSize: "26px",
          fontWeight: 700,
          fontFamily: "Syne",
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        {loading ? <span style={{ color: "var(--text-dim)" }}>—</span> : value}
      </div>

      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
        {label}
      </div>
    </div>

    {sub && (
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-dim)",
          borderTop: "1px solid var(--border)",
          paddingTop: "10px",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const StatusDot = ({ status }) => {
  const colors = {
    active: "var(--green)",
    limited: "var(--yellow)",
    inactive: "var(--red)",
  };

  return (
    <span
      style={{
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: colors[status] || "var(--text-dim)",
        display: "inline-block",
        boxShadow: `0 0 6px ${colors[status] || "var(--text-dim)"}`,
      }}
    />
  );
};

const ActivityRow = ({ item }) => {
  const iconMap = {
    user_register: UserPlus,
    motion_studio: Clapperboard,
    api_vault: KeyRound,
    magnific: KeyRound,
  };

  const color =
    item.status === "success"
      ? "#22c55e"
      : item.status === "failed"
      ? "#ef4444"
      : item.status === "warning"
      ? "#eab308"
      : "#a78bfa";

  const Icon =
    item.action === "user_register"
      ? UserPlus
      : iconMap[item.module] || Activity;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        background: "var(--bg-surface)",
        borderRadius: "10px",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          minWidth: "30px",
          background: color + "18",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={13} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </div>

        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
          {item.time}
        </div>
      </div>
    </div>
  );
};

function KeyStatusPanel() {
  const [keys, setKeys] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get("/api/vault/keys")
      .then((res) => {
        setKeys(res.data || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const getStatus = (key) =>
    !key.is_active ? "inactive" : key.is_limited ? "limited" : "active";

  const statusLabel = {
    active: "Aktif",
    limited: "Limit",
    inactive: "Nonaktif",
  };

  const statusColor = {
    active: "var(--green)",
    limited: "var(--yellow)",
    inactive: "var(--red)",
  };

  if (!loaded) {
    return <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>Memuat...</div>;
  }

  if (keys.length === 0) {
    return (
      <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.7 }}>
        Belum ada API key. Tambahkan API key Magnific di API Vault.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {keys
        .filter((key) => key.service === "magnific")
        .map((key) => {
          const status = getStatus(key);

          return (
            <div
              key={key.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "var(--bg-surface)",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                <StatusDot status={status} />

                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {key.name}
                </span>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  color: statusColor[status],
                  whiteSpace: "nowrap",
                }}
              >
                {statusLabel[status]}
              </span>
            </div>
          );
        })}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [clock, setClock] = useState(new Date());
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [keyStatus, setKeyStatus] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);

    try {
      const [meRes, vaultRes, videosRes, activityRes] = await Promise.all([
        api.get("/api/auth/me"),
        api.get("/api/vault/status"),
        api.get("/api/motion/history"),
        api.get("/api/activity/"),
      ]);

      setUser(meRes.data || null);
      setKeyStatus(vaultRes.data || null);

      const videos = videosRes.data || [];
      const importantLogs = (activityRes.data || [])
        .filter(isImportantLog)
        .map((log) => ({
          ...log,
          title: formatActivityTitle(log),
          time: timeAgo(log.created_at),
        }));

      const today = new Date().toDateString();

      setStats({
        videos: videos.length,
        videosToday: videos.filter((video) => {
          const date = parseBackendDate(video.created_at);
          return date && date.toDateString() === today;
        }).length,
        completedVideos: videos.filter((video) => video.status === "completed").length,
        activities: importantLogs.length,
        registeredUsers: importantLogs.filter((log) => log.action === "user_register").length,
      });

      setActivities(importantLogs.slice(0, 6));
    } catch (err) {
      console.error("Gagal memuat dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const hour = clock.getHours();
  const greeting =
    hour < 12 ? "Selamat pagi" : hour < 17 ? "Selamat siang" : "Selamat malam";

  const displayName = user?.username || "User";

  const statsColumns =
    isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)";

  const bottomColumns = isMobile || isTablet ? "1fr" : "1fr 320px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Syne",
              fontWeight: 800,
              color: "var(--text-primary)",
              lineHeight: 1,
              fontSize: isMobile ? "20px" : "24px",
              margin: 0,
            }}
          >
            {greeting}, {displayName} 👋
          </h2>

          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>
            Ringkasan generate video, API key, dan aktivitas penting.
          </p>
        </div>

        {!isMobile && (
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "13px",
              color: "var(--text-dim)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "8px 14px",
            }}
          >
            {clock.toLocaleTimeString("id-ID")}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: statsColumns, gap: "14px" }}>
        <StatCard
          loading={loading}
          icon={Clapperboard}
          label="Video Di-generate"
          value={stats?.videos ?? 0}
          color="#a78bfa"
          trend={stats?.videosToday ? `+${stats.videosToday} hari ini` : null}
          sub="Motion Studio"
        />

        <StatCard
          loading={loading}
          icon={CheckCircle}
          label="Video Selesai"
          value={stats?.completedVideos ?? 0}
          color="#22c55e"
          sub="Completed"
        />

        <StatCard
          loading={loading}
          icon={KeyRound}
          label="API Key Aktif"
          value={keyStatus?.active ?? 0}
          color="#22c55e"
          sub={keyStatus ? `${keyStatus.limited} limit · ${keyStatus.inactive} nonaktif` : "—"}
        />

        <StatCard
          loading={loading}
          icon={TrendingUp}
          label="Aktivitas Penting"
          value={stats?.activities ?? 0}
          color="#fb923c"
          sub={`${stats?.registeredUsers ?? 0} user daftar`}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: bottomColumns, gap: "14px" }}>
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
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                fontFamily: "Syne",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Aktivitas Penting Terbaru
            </h3>

            <span
              onClick={() => navigate("/activity-log")}
              style={{ fontSize: "11px", color: "var(--accent)", cursor: "pointer" }}
            >
              Lihat semua →
            </span>
          </div>

          {loading ? (
            <div
              style={{
                color: "var(--text-dim)",
                fontSize: "13px",
                textAlign: "center",
                padding: "30px 0",
              }}
            >
              Memuat data...
            </div>
          ) : activities.length === 0 ? (
            <div
              style={{
                color: "var(--text-dim)",
                fontSize: "13px",
                textAlign: "center",
                padding: "30px 0",
              }}
            >
              Belum ada aktivitas penting
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {activities.map((activity) => (
                <ActivityRow key={activity.id} item={activity} />
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h3
            style={{
              fontFamily: "Syne",
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Status API Key
          </h3>

          <KeyStatusPanel />

          <button
            onClick={() => navigate("/api-vault")}
            style={{
              marginTop: "auto",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-glow)",
              color: "var(--accent)",
              borderRadius: "8px",
              padding: "9px",
              fontSize: "12px",
              fontFamily: "DM Mono, monospace",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Zap size={13} />
            Kelola API Key
          </button>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "var(--accent-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HeartHandshake size={18} color="var(--accent)" />
          </div>

          <div>
            <h3
              style={{
                fontFamily: "Syne",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Dukung Pengembangan ToolsAgent
            </h3>

            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                margin: "4px 0 0",
              }}
            >
              Support dan donasi membantu upgrade server, API, storage, dan pengembangan fitur baru.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/support-donasi")}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "9px",
            padding: "9px 14px",
            fontSize: "12px",
            fontFamily: "DM Mono, monospace",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Buka QRIS →
        </button>
      </div>
    </div>
  );
}