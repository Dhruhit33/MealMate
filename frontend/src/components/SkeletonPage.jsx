const INK_HAIR = "rgba(28,18,8,0.07)";
const FIELD = "#F5ECD8";

export default function SkeletonPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FEFCF8" }}>
      {/* Navbar skeleton */}
      <div style={{
        height: 72, background: "rgba(250,243,231,0.88)",
        borderBottom: `1px solid ${INK_HAIR}`,
        display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
      }}>
        <div style={{ width: 100, height: 28, background: FIELD, borderRadius: 8, animation: "shimmer 1.5s infinite" }} />
        <div style={{ flex: 1, maxWidth: 420, height: 38, background: FIELD, borderRadius: 12, animation: "shimmer 1.5s infinite" }} />
      </div>

      {/* Content skeleton */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ height: 52, width: "40%", background: FIELD, borderRadius: 10, marginBottom: 24, animation: "shimmer 1.5s infinite" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 24 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: "#FFF9EE", borderRadius: 20, border: `1px solid ${INK_HAIR}`, overflow: "hidden", animationDelay: `${i * 0.05}s` }}>
              <div style={{ height: 190, background: `linear-gradient(90deg, ${FIELD} 0%, ${INK_HAIR} 50%, ${FIELD} 100%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
              <div style={{ padding: 20 }}>
                <div style={{ height: 16, width: "65%", background: FIELD, borderRadius: 4, marginBottom: 10, animation: "shimmer 1.5s infinite" }} />
                <div style={{ height: 12, width: "45%", background: FIELD, borderRadius: 4, animation: "shimmer 1.5s infinite" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
