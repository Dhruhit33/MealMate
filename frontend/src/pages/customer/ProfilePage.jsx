import { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Pencil, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

export default function ProfilePage() {
  const { user, fetchProfile, updateProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  useEffect(() => { fetchProfile().catch(() => {}); }, []);
  useEffect(() => { if (user) setForm({ name: user.name || "", phone: user.phone || "" }); }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setLoading(true);
    try { await updateProfile(form); toast.success("Profile updated!"); setEditing(false); }
    catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
    finally { setLoading(false); }
  };

  const badges = {
    CUSTOMER: { label: "Customer", bg: "#EFF6FF", color: "#1D4ED8" },
    DRIVER: { label: "Driver", bg: "#F0FDF4", color: "#15803D" },
    RESTAURANT_OWNER: { label: "Restaurant Owner", bg: "#FFF7ED", color: "#C2410C" },
    ADMIN: { label: "Admin", bg: "#FAF5FF", color: "#7E22CE" },
  };
  const badge = badges[user?.role] || badges.CUSTOMER;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 32 }}>My Profile</h1>

      <div style={{
        background: "linear-gradient(135deg, #1A1814, #2D2520)", borderRadius: 20, padding: "36px 32px",
        display: "flex", alignItems: "center", gap: 24, marginBottom: 28,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-brand-400), var(--color-brand-600))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem", fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
        <div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>{user?.name || "Loading..."}</div>
          <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{user?.email}</div>
          <span style={{ display: "inline-block", marginTop: 10, padding: "4px 12px", borderRadius: 99, background: badge.bg, color: badge.color, fontSize: "0.75rem", fontWeight: 600 }}>{badge.label}</span>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-sand-light)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--color-sand-light)" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Personal information</span>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99,
              border: "1.5px solid var(--color-sand)", background: "transparent", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: "0.8rem", fontWeight: 500, color: "var(--color-stone)",
            }}><Pencil size={13} /> Edit</button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(false)} style={{
                padding: "6px 14px", borderRadius: 99, border: "1.5px solid var(--color-sand)",
                background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)",
                fontSize: "0.8rem", fontWeight: 500, color: "var(--color-stone)", display: "flex", alignItems: "center", gap: 4,
              }}><X size={13} /> Cancel</button>
              <button onClick={handleSave} disabled={loading} style={{
                padding: "6px 14px", borderRadius: 99, border: "none", background: "var(--color-brand-500)",
                cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.8rem", fontWeight: 600,
                color: "#fff", display: "flex", alignItems: "center", gap: 4,
              }}>{loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />} Save</button>
            </div>
          )}
        </div>

        {[
          { icon: User, label: "Full name", value: user?.name, field: "name", editable: true },
          { icon: Mail, label: "Email", value: user?.email, field: "email", editable: false },
          { icon: Phone, label: "Phone", value: user?.phone, field: "phone", editable: true },
          { icon: Shield, label: "Role", value: badge.label, field: "role", editable: false },
        ].map((item, i, arr) => (
          <div key={item.field} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "18px 24px",
            borderBottom: i < arr.length - 1 ? "1px solid var(--color-sand-light)" : "none",
          }}>
            <item.icon size={18} style={{ color: "var(--color-stone-lighter)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-stone-lighter)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{item.label}</div>
              {editing && item.editable ? (
                <input value={form[item.field]} onChange={(e) => setForm({ ...form, [item.field]: e.target.value })} style={{
                  width: "100%", padding: "6px 10px", borderRadius: 6, border: "1.5px solid var(--color-brand-300)",
                  background: "var(--color-brand-50)", fontSize: "0.9rem", fontFamily: "var(--font-sans)", color: "var(--color-charcoal)", outline: "none",
                }} />
              ) : (
                <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{item.value || "\u2014"}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
