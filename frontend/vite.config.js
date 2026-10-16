import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: "window",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://13.234.110.133",
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on("error", (err, req, res) => {
            // Silently handle ECONNREFUSED when backend is offline
            if (err.code === "ECONNREFUSED") {
              if (res && res.writeHead && !res.headersSent) {
                res.writeHead(503, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Backend is not running on AWS" }));
              }
              return;
            }
            console.error("[vite proxy error]", err.message);
          });
        },
      },
    },
  },
});
