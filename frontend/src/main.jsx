import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import socketService from "./services/socketService.js";
import { requestNotificationPermission } from "./services/notificationService.js";
import { useAuthStore } from "./store/authStore.js";

const { token, user } = useAuthStore.getState();
if (token && user?.userId) {
  socketService.connect(token, user.userId);
}

useAuthStore.subscribe((state, prev) => {
  if (state.token && !prev.token) {
    socketService.connect(state.token, state.user?.userId);
    requestNotificationPermission();
  }
  if (!state.token && prev.token) {
    socketService.disconnect();
  }
});

requestNotificationPermission();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "var(--font-sans)",
            fontSize: "0.88rem",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(28,18,8,0.15)",
            padding: "12px 16px",
          },
          success: { iconTheme: { primary: "#15803D", secondary: "#ECFDF5" } },
          error: { iconTheme: { primary: "#DC2626", secondary: "#FEF2F2" } },
        }}
      />
      <App />
    </BrowserRouter>
  </StrictMode>
);
