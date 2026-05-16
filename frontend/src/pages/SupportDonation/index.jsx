import React from "react";
import {
  HeartHandshake,
  Server,
  KeyRound,
  Wrench,
  Database,
  Download,
  Sparkles,
} from "lucide-react";

const QRIS_PATH = "/qris.jpg";

const benefits = [
  {
    icon: Server,
    title: "Upgrade Server",
    desc: "Membantu meningkatkan performa dan stabilitas ToolsAgent.",
  },
  {
    icon: KeyRound,
    title: "Kuota API",
    desc: "Mendukung kebutuhan API untuk fitur generate video AI.",
  },
  {
    icon: Sparkles,
    title: "Fitur Baru",
    desc: "Membantu pengembangan fitur baru yang lebih powerful.",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    desc: "Mendukung proses testing, perbaikan bug, dan optimasi sistem.",
  },
  {
    icon: Database,
    title: "Storage & Bandwidth",
    desc: "Membantu kebutuhan penyimpanan file dan bandwidth.",
  },
];

export default function SupportDonation() {
  const handleDownloadQRIS = () => {
    const link = document.createElement("a");
    link.href = QRIS_PATH;
    link.download = "qris-toolsagent.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1120px",
        margin: "0 auto",
      }}
    >
      <section
        style={{
          background: "linear-gradient(135deg, var(--bg-surface), var(--bg-card))",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          padding: "clamp(20px, 4vw, 34px)",
          marginBottom: "22px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-60px",
            top: "-60px",
            width: "180px",
            height: "180px",
            borderRadius: "999px",
            background: "var(--accent-glow)",
            filter: "blur(12px)",
            opacity: 0.35,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <HeartHandshake size={22} color="var(--accent)" />
          </div>

          <h2
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "clamp(24px, 5vw, 38px)",
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.8px",
              lineHeight: 1.1,
            }}
          >
            Support dan Donasi
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              lineHeight: 1.8,
              maxWidth: "680px",
              margin: "12px 0 0",
            }}
          >
            Dukung pengembangan ToolsAgent agar bisa terus upgrade server,
            menambah kuota API, meningkatkan storage, memperbaiki bug, dan
            membangun fitur-fitur baru.
          </p>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <section
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "22px",
          }}
        >
          <h3
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "18px",
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            Scan QRIS
          </h3>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              lineHeight: 1.7,
              margin: "0 0 18px",
            }}
          >
            Scan QRIS di bawah ini untuk mendukung pengembangan ToolsAgent.
          </p>

          <div
            style={{
              width: "100%",
              background: "#fff",
              borderRadius: "16px",
              padding: "14px",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "260px",
            }}
          >
            <img
              src={QRIS_PATH}
              alt="QRIS Support dan Donasi ToolsAgent"
              style={{
                width: "100%",
                maxWidth: "320px",
                height: "auto",
                borderRadius: "10px",
                display: "block",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";

                const parent = e.currentTarget.parentElement;

                if (parent) {
                  parent.innerHTML = `
                    <div style="
                      width:100%;
                      min-height:260px;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      text-align:center;
                      color:#111;
                      font-family:Arial,sans-serif;
                      padding:20px;
                      line-height:1.6;
                    ">
                      File QRIS belum ditemukan.<br/>
                      Letakkan gambar QRIS di:<br/>
                      frontend/public/qris.jpg
                    </div>
                  `;
                }
              }}
            />
          </div>

          <button
            onClick={handleDownloadQRIS}
            style={{
              marginTop: "16px",
              width: "100%",
              height: "42px",
              borderRadius: "10px",
              border: "1px solid var(--border-hover)",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Download size={16} />
            Download QRIS
          </button>

          <p
            style={{
              color: "var(--text-dim)",
              fontSize: "11px",
              lineHeight: 1.6,
              margin: "14px 0 0",
              textAlign: "center",
            }}
          >
            Setiap dukungan sangat berarti untuk membantu ToolsAgent terus
            berkembang.
          </p>
        </section>

        <section
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "22px",
          }}
        >
          <h3
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "18px",
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            Donasi digunakan untuk apa?
          </h3>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              lineHeight: 1.7,
              margin: "0 0 18px",
            }}
          >
            Dukungan kamu akan membantu kebutuhan teknis dan pengembangan
            project ini.
          </p>

          <div style={{ display: "grid", gap: "10px" }}>
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    background: "var(--accent-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color="var(--accent)" />
                </div>

                <div>
                  <h4
                    style={{
                      margin: 0,
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {title}
                  </h4>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      lineHeight: 1.6,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}