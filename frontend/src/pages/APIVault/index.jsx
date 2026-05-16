import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import api from "../../utils/api";
import useWindowSize from "../../utils/useWindowSize";

const SERVICE_OPTIONS = [
  { value: "magnific", label: "Magnific" },
];

const StatusBadge = ({ isActive, isLimited }) => {
  if (!isActive) {
    return (
      <span style={{ fontSize: "11px", color: "var(--red)", background: "#ef444418", padding: "3px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
        <XCircle size={11} /> Nonaktif
      </span>
    );
  }

  if (isLimited) {
    return (
      <span style={{ fontSize: "11px", color: "var(--yellow)", background: "#eab30818", padding: "3px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
        <AlertTriangle size={11} /> Limit
      </span>
    );
  }

  return (
    <span style={{ fontSize: "11px", color: "var(--green)", background: "#22c55e18", padding: "3px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
      <CheckCircle size={11} /> Aktif
    </span>
  );
};

const inputStyle = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "var(--text-primary)",
  width: "100%",
  outline: "none",
  fontFamily: "DM Mono, monospace",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
  marginBottom: "6px",
  display: "block",
};

export default function APIVault() {
  const { isMobile } = useWindowSize();

  const [keys, setKeys] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    service: "magnific",
    key_value: "",
    priority: 1,
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  function showMsg(text, type) {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  async function fetchAll() {
    setLoading(true);

    try {
      const [keysRes, statusRes] = await Promise.all([
        api.get("/api/vault/keys"),
        api.get("/api/vault/status"),
      ]);

      setKeys(keysRes.data || []);
      setStatus(statusRes.data || null);
    } catch (e) {
      showMsg(e.response?.data?.detail || "Gagal memuat API Vault", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.key_value.trim()) {
      return showMsg("Nama dan API key wajib diisi", "error");
    }

    setSaving(true);

    try {
      await api.post("/api/vault/keys", {
        name: form.name.trim(),
        service: form.service,
        key_value: form.key_value.trim(),
        priority: Number(form.priority) || 1,
      });

      setForm({
        name: "",
        service: "magnific",
        key_value: "",
        priority: 1,
      });

      setShowForm(false);
      showMsg("API key berhasil ditambahkan", "success");
      fetchAll();
    } catch (e) {
      showMsg(e.response?.data?.detail || "Gagal menambahkan API key", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus API key ini?")) return;

    try {
      await api.delete(`/api/vault/keys/${id}`);
      showMsg("API key berhasil dihapus", "success");
      fetchAll();
    } catch (e) {
      showMsg(e.response?.data?.detail || "Gagal menghapus API key", "error");
    }
  }

  async function handleReset(id) {
    try {
      await api.post(`/api/vault/keys/${id}/reset`);
      showMsg("Status limit key berhasil direset", "success");
      fetchAll();
    } catch (e) {
      showMsg(e.response?.data?.detail || "Gagal reset API key", "error");
    }
  }

  async function handleToggleActive(key) {
    try {
      if (key.is_active) {
        await api.post(`/api/vault/keys/${key.id}/disable`);
        showMsg("API key dinonaktifkan", "success");
      } else {
        await api.post(`/api/vault/keys/${key.id}/enable`);
        showMsg("API key diaktifkan", "success");
      }

      fetchAll();
    } catch (e) {
      showMsg(e.response?.data?.detail || "Gagal update API key", "error");
    }
  }

  const magnificKeys = keys.filter((key) => key.service === "magnific");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
        <div>
          <h2 style={{ fontFamily: "Syne", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            API Vault
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Kelola API key Magnific. Sistem akan failover otomatis jika key terkena limit.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "var(--accent)", border: "none", color: "#fff", borderRadius: "9px", padding: "10px 18px", fontSize: "13px", fontFamily: "DM Mono, monospace", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 0 20px var(--accent-glow)", whiteSpace: "nowrap" }}
        >
          <Plus size={15} /> Tambah Key
        </button>
      </div>

      {msg && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", fontSize: "13px", background: msg.type === "success" ? "#22c55e18" : "#ef444418", border: `1px solid ${msg.type === "success" ? "#22c55e40" : "#ef444440"}`, color: msg.type === "success" ? "var(--green)" : "var(--red)" }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Total Key", value: status?.total ?? 0 },
          { label: "Aktif", value: status?.active ?? 0 },
          { label: "Limit", value: status?.limited ?? 0 },
          { label: "Nonaktif", value: status?.inactive ?? 0 },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontFamily: "Syne", fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>
              {loading ? "—" : item.value}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--accent-glow)", borderRadius: "14px", padding: "20px" }}>
          <h3 style={{ fontFamily: "Syne", fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
            Tambah API Key Baru
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={labelStyle}>Nama / Label</label>
              <input
                style={inputStyle}
                placeholder="cth: Magnific Key #1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Service</label>
              <select
                style={inputStyle}
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              >
                {SERVICE_OPTIONS.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>API Key</label>
            <input
              style={inputStyle}
              placeholder="Paste API key di sini..."
              value={form.key_value}
              onChange={(e) => setForm({ ...form, key_value: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Prioritas Failover</label>
            <input
              style={{ ...inputStyle, width: isMobile ? "100%" : "140px" }}
              type="number"
              min={1}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{ background: "var(--accent)", border: "none", color: "#fff", borderRadius: "8px", padding: "9px 20px", fontSize: "13px", cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Menyimpan..." : "Simpan Key"}
            </button>

            <button
              onClick={() => setShowForm(false)}
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: "8px", padding: "9px 20px", fontSize: "13px", cursor: "pointer" }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <KeyRound size={16} color="var(--accent)" />
          <h3 style={{ fontFamily: "Syne", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Magnific
          </h3>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", background: "var(--bg-hover)", padding: "2px 8px", borderRadius: "10px" }}>
            {magnificKeys.length} key
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", fontSize: "13px" }}>
            Memuat API key...
          </div>
        ) : magnificKeys.length === 0 ? (
          <div style={{ padding: "24px", background: "var(--bg-card)", border: "1px dashed var(--border)", borderRadius: "12px", fontSize: "13px", color: "var(--text-dim)", textAlign: "center" }}>
            Belum ada API key Magnific. Tambahkan key agar Motion Studio bisa generate video.
          </div>
        ) : (
          magnificKeys.map((key) => (
            <div
              key={key.id}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: isMobile ? "14px" : "16px 18px", marginBottom: "10px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div style={{ width: "28px", height: "28px", minWidth: "28px", background: "#a78bfa18", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#a78bfa", fontWeight: 700 }}>
                  #{key.priority}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>
                    {key.name}
                  </div>

                  <code style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "DM Mono, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: isMobile ? "160px" : "360px", marginTop: "3px" }}>
                    {key.key_value}
                  </code>

                  {key.last_error && (
                    <div style={{ fontSize: "11px", color: "var(--red)", marginTop: "5px", lineHeight: 1.5 }}>
                      {key.last_error}
                    </div>
                  )}
                </div>

                <StatusBadge isActive={key.is_active} isLimited={key.is_limited} />
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {key.is_limited && (
                  <button onClick={() => handleReset(key.id)} style={{ background: "#eab30815", border: "1px solid #eab30830", color: "var(--yellow)", borderRadius: "7px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                    <RefreshCw size={11} /> Reset Limit
                  </button>
                )}

                <button onClick={() => handleToggleActive(key)} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: "7px", padding: "6px 10px", cursor: "pointer", fontSize: "11px" }}>
                  {key.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>

                <button onClick={() => handleDelete(key.id)} style={{ background: "#ef444415", border: "1px solid #ef444430", color: "var(--red)", borderRadius: "7px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                  <Trash2 size={11} /> Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}