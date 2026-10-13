import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#1C1208",
          background: "#FEFCF8"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>
            Something went wrong loading this page
          </h2>
          <p style={{
            maxWidth: "480px",
            fontSize: "0.9rem",
            marginBottom: "20px",
            background: "#FEE2E2",
            padding: "10px 16px",
            borderRadius: "8px",
            color: "#991B1B",
            wordBreak: "break-word"
          }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                border: "none",
                background: "#C0401E",
                color: "#FFF",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                border: "1px solid #D1D5DB",
                background: "#FFF",
                color: "#374151",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
