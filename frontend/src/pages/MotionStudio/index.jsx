import React, { useState, useEffect, useRef, useCallback } from "react";
import { Video, Play, Trash2, RefreshCw, Download, Image, Film } from "lucide-react";
import api from "../../utils/api";
import useWindowSize from "../../utils/useWindowSize";

const MODELS = [
  { id: "kling-2.6-motion", name: "Kling 2.6 Motion Control Pro", badge: "Recommended", color: "#a78bfa" },
  { id: "kling-2.6-std-motion", name: "Kling 2.6 Motion Control Std", badge: "Standard", color: "#818cf8" },
  { id: "kling-2.6-pro", name: "Kling 2.6 Pro", badge: "High Quality", color: "#38bdf8" },
  { id: "kling-v3-pro", name: "Kling 3 Pro", badge: "Latest", color: "#34d399" },
  { id: "kling-v3-std", name: "Kling 3 Standard", badge: "Value", color: "#22c55e" },
  { id: "kling-v3-motion-pro", name: "Kling 3 Motion Control Pro", badge: "Motion", color: "#f472b6" },
  { id: "kling-o1-pro", name: "Kling O1 Pro", badge: "Complex", color: "#fb923c" },
  { id: "kling-o1-std", name: "Kling O1 Standard", badge: "Fast", color: "#fbbf24" },
  { id: "kling-4k-i2v", name: "Kling 4K I2V", badge: "4K", color: "#e879f9" },
  { id: "kling-2.5-pro", name: "Kling 2.5 Pro", badge: "Stable", color: "#94a3b8" },
];

const DURATIONS = [3, 5, 8, 10, 15];
const RATIOS = ["16:9", "9:16", "1:1"];

const selectStyle = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "13px",
  color: "var(--text-primary)",
  width: "100%",
  outline: "none",
  fontFamily: "DM Mono, monospace",
};

const StatusBadge = ({ status }) => {
  const map = {
    queued: { color: "#9090b0", bg: "#9090b015", label: "Antrian" },
    processing: { color: "#fbbf24", bg: "#fbbf2420", label: "Proses..." },
    completed: { color: "#4ade80", bg: "#4ade8020", label: "Selesai" },
    failed: { color: "#f87171", bg: "#f8717120", label: "Gagal" },
  };

  const s = map[status] || map.queued;

  return (
    <span
      style={{
        fontSize: "12px",
        color: s.color,
        background: s.bg,
        padding: "4px 12px",
        borderRadius: "20px",
        whiteSpace: "nowrap",
        fontWeight: 600,
      }}
    >
      {s.label}
    </span>
  );
};

function DropZone({ label, accept, icon: Icon, onUploaded, uploaded, color }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      const isVideo = file.type.startsWith("video/");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", isVideo ? "video" : "image");

      setUploading(true);

      try {
        const res = await api.post("/api/motion/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        onUploaded(res.data.url);
      } catch (e) {
        alert("Gagal upload: " + (e.response?.data?.detail || e.message));
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  return (
    <div
      onClick={() => !uploaded && !uploading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${dragging ? color : uploaded ? color + "70" : "var(--border)"}`,
        borderRadius: "14px",
        padding: "18px",
        textAlign: "center",
        cursor: uploaded || uploading ? "default" : "pointer",
        background: dragging ? color + "10" : uploaded ? color + "08" : "var(--bg-surface)",
        transition: "all 0.2s ease",
        minHeight: "145px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {uploading ? (
        <div style={{ color: "var(--text-dim)", fontSize: "13px" }}>
          <RefreshCw size={20} className="spin" style={{ margin: "0 auto 8px", display: "block" }} />
          Mengupload...
        </div>
      ) : uploaded ? (
        <div style={{ width: "100%" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              background: color + "25",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
            }}
          >
            <Icon size={19} color={color} />
          </div>

          <div style={{ fontSize: "13px", color, fontWeight: 700, marginBottom: "5px" }}>✓ Terupload!</div>

          <div
            style={{
              fontSize: "11px",
              color: "var(--text-dim)",
              wordBreak: "break-all",
              marginBottom: "12px",
              lineHeight: 1.4,
            }}
          >
            {uploaded.split("/").pop()?.slice(0, 30)}...
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUploaded(null);
            }}
            style={{
              background: "#f8717118",
              border: "1px solid #f8717130",
              color: "var(--red)",
              borderRadius: "8px",
              padding: "6px 14px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Ganti
          </button>
        </div>
      ) : (
        <div>
          <div
            style={{
              width: "42px",
              height: "42px",
              background: "var(--bg-hover)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
            }}
          >
            <Icon size={19} color="var(--text-dim)" />
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "5px", fontWeight: 600 }}>
            {label}
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.4 }}>
            Drag & drop atau klik untuk browse
          </div>
        </div>
      )}
    </div>
  );
}

export default function MotionStudio() {
  const { isMobile } = useWindowSize();

  const [model, setModel] = useState(MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [duration, setDuration] = useState(5);
  const [ratio, setRatio] = useState("16:9");
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [msg, setMsg] = useState(null);

  const pollRef = useRef({});

  useEffect(() => {
    fetchHistory();

    return () => {
      Object.values(pollRef.current).forEach(clearInterval);
    };
  }, []);

  async function fetchHistory() {
    setLoadingHist(true);

    try {
      const res = await api.get("/api/motion/history");
      const data = Array.isArray(res.data) ? res.data : [];

      setHistory(data);

      data
        .filter((task) => ["queued", "processing"].includes(task.status))
        .forEach((task) => startPolling(task.task_id));
    } catch (e) {
      console.error("Gagal fetch history:", e);
    } finally {
      setLoadingHist(false);
    }
  }

  function startPolling(taskId) {
    if (!taskId || taskId === "null" || taskId === "undefined") return;
    if (pollRef.current[taskId]) return;

    pollRef.current[taskId] = setInterval(async () => {
      try {
        const res = await api.get(`/api/motion/status/${taskId}`);

        setHistory((prev) =>
          prev.map((task) => (task.task_id === taskId ? { ...task, ...res.data } : task))
        );

        if (["completed", "failed"].includes(res.data.status)) {
          clearInterval(pollRef.current[taskId]);
          delete pollRef.current[taskId];
        }
      } catch (e) {
        console.error("Polling gagal:", e);
        clearInterval(pollRef.current[taskId]);
        delete pollRef.current[taskId];
      }
    }, 6000);
  }

  async function handleGenerate() {
    if (!imageUrl) return showMsg("Upload foto dulu sebelum generate!", "error");

    setGenerating(true);

    try {
      const res = await api.post("/api/motion/generate", {
        model,
        prompt: prompt || "Animate this image naturally",
        image_url: imageUrl,
        video_ref_url: videoRef || null,
        duration,
        aspect_ratio: ratio,
      });

      showMsg("Generate dimulai! Status diperbarui otomatis.", "success");

      await fetchHistory();

      if (res.data.task_id) startPolling(res.data.task_id);

      setPrompt("");
      setImageUrl(null);
      setVideoRef(null);
    } catch (e) {
      showMsg(e.response?.data?.detail || "Gagal generate video", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(taskId) {
    if (!confirm("Hapus task ini?")) return;

    try {
      await api.delete(`/api/motion/task/${taskId}`);
      setHistory((prev) => prev.filter((task) => task.task_id !== taskId));
    } catch {
      showMsg("Gagal menghapus", "error");
    }
  }

  function showMsg(text, type) {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  }

  const cardStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "18px",
    padding: isMobile ? "18px" : "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  };

  const sectionTitleStyle = {
    fontFamily: "Syne",
    fontSize: "16px",
    fontWeight: 800,
    marginBottom: "16px",
    color: "var(--text-primary)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Header */}
      <div>
        <h2
          style={{
            fontFamily: "Syne",
            fontSize: isMobile ? "22px" : "28px",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Motion Studio
        </h2>

        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "7px", marginBottom: 0 }}>
          Generate video AI dari foto + video reference menggunakan Magnific API
        </p>
      </div>

      {/* Toast */}
      {msg && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            fontSize: "14px",
            background: msg.type === "success" ? "#4ade8018" : "#f8717118",
            border: `1px solid ${msg.type === "success" ? "#4ade8040" : "#f8717140"}`,
            color: msg.type === "success" ? "var(--green)" : "var(--red)",
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Upload | Model | Prompt */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: "16px",
          alignItems: "stretch",
        }}
      >
        {/* Upload */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Upload File</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <DropZone
              label="Foto sumber"
              accept="image/jpeg,image/png,image/webp"
              icon={Image}
              color="#a78bfa"
              uploaded={imageUrl}
              onUploaded={setImageUrl}
            />

            <DropZone
              label="Video reference (opsional)"
              accept="video/mp4,video/quicktime,video/webm"
              icon={Film}
              color="#38bdf8"
              uploaded={videoRef}
              onUploaded={setVideoRef}
            />
          </div>
        </div>

        {/* Model */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Pilih Model</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              overflowY: "auto",
              maxHeight: "350px",
              paddingRight: "2px",
            }}
          >
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "11px 13px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: model === m.id ? m.color + "20" : "var(--bg-surface)",
                  border: `1px solid ${model === m.id ? m.color + "70" : "var(--border)"}`,
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: model === m.id ? m.color : "var(--text-muted)",
                    fontWeight: model === m.id ? 700 : 500,
                    lineHeight: 1.35,
                  }}
                >
                  {m.name}
                </span>

                <span
                  style={{
                    fontSize: "10px",
                    color: m.color,
                    background: m.color + "20",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt + Settings + Generate */}
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Prompt</h3>

          <div>
            <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>
              Prompt <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>(opsional, boleh kosong)</span>
            </label>

            <textarea
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "12px 13px",
                fontSize: "13px",
                color: "var(--text-primary)",
                width: "100%",
                outline: "none",
                fontFamily: "DM Mono, monospace",
                resize: "vertical",
                minHeight: "118px",
                lineHeight: 1.5,
                boxSizing: "border-box",
              }}
              placeholder="Deskripsikan gerakan yang diinginkan... (opsional)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>
                Durasi
              </label>

              <select style={selectStyle} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} detik
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>
                Aspect Ratio
              </label>

              <select style={selectStyle} value={ratio} onChange={(e) => setRatio(e.target.value)}>
                {RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !imageUrl}
            style={{
              background: generating || !imageUrl ? "var(--bg-hover)" : "var(--accent)",
              border: "none",
              color: generating || !imageUrl ? "var(--text-dim)" : "#fff",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "14px",
              fontFamily: "DM Mono, monospace",
              cursor: generating || !imageUrl ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: generating || !imageUrl ? "none" : "0 0 24px var(--accent-glow)",
              transition: "all 0.2s ease",
              marginTop: "auto",
              minHeight: "46px",
            }}
          >
            {generating ? (
              <>
                <RefreshCw size={15} className="spin" /> Mengirim...
              </>
            ) : (
              <>
                <Play size={15} /> Generate Video
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hasil Generate */}
      <div style={{ ...cardStyle, width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "Syne",
                fontSize: "18px",
                fontWeight: 800,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Hasil Generate
            </h3>

            <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "6px 0 0" }}>
              Riwayat generate ditampilkan di area tengah bawah.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              borderRadius: "10px",
              padding: "9px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loadingHist ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)", fontSize: "14px" }}>
            Memuat riwayat...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)", fontSize: "14px" }}>
            <Video size={44} style={{ margin: "0 auto 16px", opacity: 0.2, display: "block" }} />
            Belum ada video yang di-generate
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "14px",
            }}
          >
            {history.map((task) => (
              <div
                key={task.task_id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "16px",
                  overflow: "hidden",
                  borderTop: `3px solid ${
                    task.status === "completed"
                      ? "var(--green)"
                      : task.status === "failed"
                        ? "var(--red)"
                        : task.status === "processing"
                          ? "var(--yellow)"
                          : "var(--text-dim)"
                  }`,
                }}
              >
                {task.status === "completed" && task.result_url && (
                  <video
                    controls
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      marginBottom: "12px",
                      background: "#000",
                      maxHeight: "220px",
                    }}
                    src={task.result_url}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "9px",
                    flexWrap: "wrap",
                    gap: "7px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--accent)",
                        background: "var(--accent-dim)",
                        padding: "4px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      {task.model}
                    </span>

                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                      {task.duration}s · {task.aspect_ratio}
                    </span>
                  </div>

                  <StatusBadge status={task.status} />
                </div>

                {task.prompt && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginBottom: "12px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={task.prompt}
                  >
                    {task.prompt}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
  {task.created_at
    ? new Date(task.created_at.endsWith("Z") ? task.created_at : `${task.created_at}Z`).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })
    : "-"}
</span>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    {task.status === "completed" && task.result_url && (
                      <a
                        href={task.result_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: "#4ade8018",
                          border: "1px solid #4ade8030",
                          color: "var(--green)",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          textDecoration: "none",
                        }}
                      >
                        <Download size={12} /> Download
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(task.task_id)}
                      style={{
                        background: "#f8717118",
                        border: "1px solid #f8717130",
                        color: "var(--red)",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                      }}
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
