import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: "var(--bg-base)", overflow: "hidden",
    }}>
      {!isMobile && <Sidebar />}
      {isMobile  && <Sidebar />}

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", minWidth: 0,
      }}>
        <Topbar isMobile={isMobile} />
        <main style={{
          flex: 1, overflowY: "auto",
          padding: isMobile ? "16px" : "28px 32px",
          background: "var(--bg-base)",
        }}>
          <div className="fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}