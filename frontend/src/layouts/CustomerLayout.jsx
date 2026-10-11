import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function CustomerLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "32px 24px" }}>
        <Outlet />
      </main>
      <Footer />
      <style>{`@media (max-width: 768px) { main { padding: 16px 14px !important; } }`}</style>
    </div>
  );
}
