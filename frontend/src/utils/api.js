import axios from "axios";

function getBaseURL() {
  const envURL = import.meta.env.VITE_API_URL;

  // Untuk deploy Vercel:
  // VITE_API_URL=https://tools-agent-api.vercel.app
  if (envURL) {
    return envURL;
  }

  const hostname = window.location.hostname;

  // Untuk akses lokal dari laptop
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }

  // Untuk akses lokal dari HP lewat WiFi yang sama
  return `http://${hostname}:8000`;
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || "";

    const isAuthEndpoint =
      url.includes("/api/auth/me") ||
      url.includes("/api/auth/login");

    if (status === 401 && isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;