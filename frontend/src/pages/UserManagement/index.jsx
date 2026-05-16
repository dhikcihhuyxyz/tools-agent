import React, { useEffect, useState } from "react";
import {
  Users,
  Shield,
  User,
  KeyRound,
  Clapperboard,
  Activity,
  RefreshCw,
  AlertTriangle,
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

function formatDate(dateStr) {
  const date = parseBackendDate(dateStr);

  if (!date || Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div
    style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "14px",
      padding: "18px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        background: color + "18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "14px",
      }}
    >
      <Icon size={16} color={color} />
    </div>

    <div
      style={{
        fontFamily: "Syne",
        fontSize: "24px",
        fontWeight: 800,
        color: "var(--text-primary)",
        lineHeight: 1,
      }}
    >
      {loading ? "—" : value}
    </div>

    <div
      style={{
        fontSize: "11px",
        color: "var(--text-muted)",
        marginTop: "6px",
      }}
    >
      {label}
    </div>
  </div>
);

const RoleBadge = ({ role }) => {
  const isAdmin = role === "admin";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 8px",
        borderRadius: "99px",
        fontSize: "10px",
        color: isAdmin ? "var(--accent)" : "var(--green)",
        background: isAdmin ? "var(--accent-dim)" : "#22c55e18",
        border: `1px solid ${isAdmin ? "var(--accent-glow)" : "#22c55e40"}`,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {isAdmin ? <Shield size={10} /> : <User size={10} />}
      {role}
    </span>
  );
};

export default function UserManagement() {
  const { isMobile, isTablet } = useWindowSize();

  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError("");

    try {
      const meRes = await api.get("/api/auth/me");
      setCurrentUser(meRes.data);
      localStorage.setItem("user", JSON.stringify(meRes.data));

      if (meRes.data?.role !== "admin") {
        setError("Halaman ini hanya bisa diakses oleh admin.");
        return;
      }

      const [usersRes, summaryRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/users/summary"),
      ]);

      setUsers(usersRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (e) {
      setError(e.response?.data?.detail || "Gagal memuat user management.");
    } finally {
      setLoading(false);
    }
  }

  const statColumns =
    isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(6, 1fr)";

  if (!isAdmin && !loading) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "28px",
          textAlign: "center",
        }}
      >
        <AlertTriangle size={36} color="var(--yellow)" />

        <h2
          style={{
            fontFamily: "Syne",
            fontSize: "20px",
            fontWeight: 800,
            marginTop: "14px",
          }}
        >
          Akses Ditolak
        </h2>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            marginTop: "8px",
          }}
        >
          User Management hanya tersedia untuk admin.
        </p>
      </div>
    );
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
            User Management
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            Pantau user, API key, video task, dan aktivitas penting.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "DM Mono, monospace",
          }}
        >
          <RefreshCw size={13} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#ef444418",
            border: "1px solid #ef444440",
            color: "var(--red)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: statColumns,
          gap: "12px",
        }}
      >
        <StatCard
          loading={loading}
          icon={Users}
          label="Total User"
          value={summary?.total_users ?? 0}
          color="#38bdf8"
        />

        <StatCard
          loading={loading}
          icon={Shield}
          label="Admin"
          value={summary?.total_admins ?? 0}
          color="#a78bfa"
        />

        <StatCard
          loading={loading}
          icon={User}
          label="User Biasa"
          value={summary?.total_regular_users ?? 0}
          color="#22c55e"
        />

        <StatCard
          loading={loading}
          icon={KeyRound}
          label="API Key"
          value={summary?.total_api_keys ?? 0}
          color="#fb923c"
        />

        <StatCard
          loading={loading}
          icon={Clapperboard}
          label="Video"
          value={summary?.total_videos ?? 0}
          color="#ec4899"
        />

        <StatCard
          loading={loading}
          icon={Activity}
          label="Activity"
          value={summary?.total_activities ?? 0}
          color="#facc15"
        />
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          overflow: "hidden",
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
            Memuat user...
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "var(--text-dim)",
              fontSize: "13px",
            }}
          >
            Belum ada user.
          </div>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px" }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      {user.username}
                    </div>

                    <div
                      style={{
                        color: "var(--text-dim)",
                        fontSize: "11px",
                        marginTop: "3px",
                      }}
                    >
                      ID #{user.id}
                    </div>
                  </div>

                  <RoleBadge role={user.role} />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                    marginTop: "14px",
                  }}
                >
                  {[
                    { label: "API Key", value: user.stats?.api_keys ?? 0 },
                    { label: "Video", value: user.stats?.videos ?? 0 },
                    { label: "Completed", value: user.stats?.completed_videos ?? 0 },
                    { label: "Activity", value: user.stats?.activities ?? 0 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "Syne",
                          color: "var(--text-primary)",
                          fontSize: "16px",
                          fontWeight: 800,
                        }}
                      >
                        {item.value}
                      </div>

                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "10px",
                          marginTop: "2px",
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    color: "var(--text-dim)",
                    fontSize: "11px",
                  }}
                >
                  Daftar: {formatDate(user.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "760px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {[
                    "User",
                    "Role",
                    "API Key",
                    "Video",
                    "Completed",
                    "Activity",
                    "Tanggal Daftar",
                  ].map((head) => (
                    <th
                      key={head}
                      style={{
                        textAlign: "left",
                        padding: "13px 16px",
                        color: "var(--text-muted)",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {user.username}
                      </div>

                      <div
                        style={{
                          color: "var(--text-dim)",
                          fontSize: "11px",
                          marginTop: "2px",
                        }}
                      >
                        ID #{user.id}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <RoleBadge role={user.role} />
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
                      {user.stats?.active_api_keys ?? 0} aktif / {user.stats?.api_keys ?? 0} total
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
                      {user.stats?.videos ?? 0}
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
                      {user.stats?.completed_videos ?? 0}
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
                      {user.stats?.activities ?? 0}
                    </td>

                    <td style={{ padding: "14px 16px", color: "var(--text-dim)", fontSize: "11px" }}>
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}