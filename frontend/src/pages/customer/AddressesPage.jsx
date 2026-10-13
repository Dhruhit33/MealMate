import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Pencil, Trash2, X, Loader2, Home, Briefcase, Navigation, Sparkles, ArrowLeft, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useAddressStore } from "../../store/addressStore";
import MapLocationPicker from "../../components/MapLocationPicker";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_FAINT = "rgba(43,29,18,0.14)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const FIELD_FOCUS = "#FFFEF8";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";
const PISTACHIO = "#6B7F4A";
const NONVEG = "#A83232";

const LABELS = [
  { value: "HOME", label: "Home", icon: Home },
  { value: "WORK", label: "Work", icon: Briefcase },
  { value: "OTHER", label: "Other", icon: Navigation },
];
const empty = { label: "HOME", street: "", city: "", state: "", pincode: "", latitude: 0, longitude: 0 };

// Browser geolocation → reverse-geocode with Nominatim
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      return {
        street: [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(", ") || "",
        city: a.city || a.town || a.village || a.county || "",
        state: a.state || "",
        pincode: a.postcode || "",
      };
    }
  } catch (e) { /* silent */ }
  return null;
}

// Geocode using OpenStreetMap Nominatim (free, no API key)
async function geocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data && data[0]) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
  } catch (e) { /* silent */ }
  return null;
}

export default function AddressesPage() {
  const navigate = useNavigate();
  const { addresses, loading, fetchAddresses, addAddress, updateAddress, deleteAddress, selectedAddressId, selectAddress } = useAddressStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [coordStatus, setCoordStatus] = useState(null); // null | 'found' | 'manual'
  const [locating, setLocating] = useState(false);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  useEffect(() => { fetchAddresses(); }, []);

  const openAdd = () => {
    setForm(empty);
    setEditingId(null);
    setCoordStatus(null);
    setIsLocationConfirmed(false);
    setShowModal(true);
  };
  const openEdit = (a) => {
    setForm({
      label: a.label || "HOME", street: a.street || "", city: a.city || "", state: a.state || "",
      pincode: a.pincode || "", latitude: a.latitude || 0, longitude: a.longitude || 0,
    });
    setEditingId(a.addressId);
    setCoordStatus(a.latitude && a.longitude ? "found" : null);
    setIsLocationConfirmed(Boolean(a.latitude && a.longitude));
    setShowModal(true);
  };

  const handleMapConfirm = (loc) => {
    setForm(f => ({
      ...f,
      latitude: loc.latitude,
      longitude: loc.longitude,
      street: loc.street || f.street,
      city: loc.city || f.city,
      state: loc.state || f.state,
      pincode: loc.pincode || f.pincode,
    }));
    setIsLocationConfirmed(true);
    setCoordStatus("found");
  };

  // Auto-geocode when pincode/city changes
  useEffect(() => {
    if (!showModal) return;
    const q = [form.street, form.city, form.state, form.pincode].filter(Boolean).join(", ");
    if (q.length < 5) return;
    const timer = setTimeout(async () => {
      setGeocoding(true);
      const coords = await geocode(q);
      setGeocoding(false);
      if (coords) {
        setForm((f) => ({ ...f, latitude: coords.latitude, longitude: coords.longitude }));
        setCoordStatus("found");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [form.street, form.city, form.pincode, showModal]);

  // Use browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported by your browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm(f => ({ ...f, latitude: lat, longitude: lng }));
        setCoordStatus("found");
        // Try to reverse-geocode to fill address fields
        const addr = await reverseGeocode(lat, lng);
        if (addr) {
          setForm(f => ({
            ...f,
            street: f.street || addr.street,
            city: f.city || addr.city,
            state: f.state || addr.state,
            pincode: f.pincode || addr.pincode,
            latitude: lat, longitude: lng,
          }));
          toast.success("Location detected! Address auto-filled.");
        } else {
          toast.success("Location coordinates set!");
        }
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        toast.error("Could not get location. Please allow location access.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!form.street || !form.city) return toast.error("Street and city are required");
    // Compulsory check: location MUST be selected and confirmed on the map
    if (!isLocationConfirmed || !form.latitude || !form.longitude) {
      return toast.error("Please choose and confirm your location on the map first (Compulsory)!");
    }
    setSaving(true);
    try {
      if (editingId) { await updateAddress(editingId, form); toast.success("Address updated"); }
      else { await addAddress(form); toast.success("Address added"); }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this address?")) return;
    try { await deleteAddress(id); toast.success("Address deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    border: `1.5px solid transparent`, background: FIELD,
    fontSize: "0.92rem", fontFamily: "var(--font-sans)", color: INK,
    outline: "none", transition: "all 0.2s",
  };
  const focusH = (e) => { e.target.style.borderColor = TERRACOTTA; e.target.style.background = FIELD_FOCUS; };
  const blurH = (e) => { e.target.style.borderColor = "transparent"; e.target.style.background = FIELD; };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 999,
          border: `1px solid ${INK_HAIR}`,
          background: CARD,
          color: INK_SOFT,
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 16,
          fontFamily: "var(--font-sans)",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 3px rgba(43,29,18,0.04)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = TERRACOTTA_SOFT;
          e.currentTarget.style.color = TERRACOTTA_DEEP;
          e.currentTarget.style.transform = "translateX(-3px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = INK_HAIR;
          e.currentTarget.style.color = INK_SOFT;
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "2rem",
            fontWeight: 500, letterSpacing: "-0.02em", color: INK,
          }}>My addresses</h1>
          <p style={{ fontSize: "0.9rem", color: INK_SOFT, marginTop: 4 }}>
            Where should we deliver your food?
          </p>
        </div>
        <button onClick={openAdd} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 18px", borderRadius: 999, border: "none",
          background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
          color: "#FFF5E6", fontSize: "0.85rem", fontWeight: 600,
          fontFamily: "var(--font-sans)", cursor: "pointer",
          boxShadow: `0 6px 18px ${TERRACOTTA}45`,
        }}>
          <Plus size={16} /> Add address
        </button>
      </div>

      {loading && !addresses.length ? (
        <div style={{ textAlign: "center", padding: 60, color: INK_MUTED }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
          Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          background: CARD, borderRadius: 16, border: `1.5px dashed ${INK_HAIR}`,
        }}>
          <MapPin size={36} style={{ color: INK_MUTED, margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontWeight: 600, marginBottom: 4, color: INK }}>No saved addresses yet</p>
          <p style={{ fontSize: "0.85rem", color: INK_SOFT }}>Add a delivery address to get started</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {addresses.map((addr, i) => {
            const info = LABELS.find((l) => l.value === addr.label) || LABELS[2];
            const Icon = info.icon;
            const isSelected = selectedAddressId === addr.addressId;
            return (
              <div key={addr.addressId || i} style={{
                background: isSelected ? `${TERRACOTTA}08` : CARD,
                borderRadius: 16,
                border: `2px solid ${isSelected ? TERRACOTTA : INK_HAIR}`,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                animation: `fade-up 0.3s ease-out ${i * 0.05}s both`,
                boxShadow: isSelected ? `0 6px 20px ${TERRACOTTA}1E` : "0 2px 8px rgba(43,29,18,0.03)",
                transition: "all 0.2s ease",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: isSelected ? `${TERRACOTTA}20` : `linear-gradient(135deg, ${TERRACOTTA}12, ${TERRACOTTA}06)`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    border: isSelected ? `1px solid ${TERRACOTTA}40` : "none"
                  }}><Icon size={19} style={{ color: TERRACOTTA_DEEP }} /></div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.98rem", color: INK }}>{info.label}</span>
                      {isSelected ? (
                        <span style={{
                          background: TERRACOTTA, color: "#FFF5E6",
                          fontSize: "0.72rem", fontWeight: 700,
                          padding: "2px 10px", borderRadius: 999,
                          display: "inline-flex", alignItems: "center", gap: 4
                        }}>
                          <Check size={11} /> Active Delivery Area (25 km active)
                        </span>
                      ) : null}
                    </div>
                    <p style={{ fontSize: "0.86rem", color: INK_SOFT, lineHeight: 1.5, margin: 0 }}>
                      {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(addr)} title="Edit address" style={{
                      width: 34, height: 34, borderRadius: 8, border: `1px solid ${INK_HAIR}`,
                      background: "#FFF", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Pencil size={14} style={{ color: INK_SOFT }} /></button>
                    <button onClick={() => handleDelete(addr.addressId)} title="Delete address" style={{
                      width: 34, height: 34, borderRadius: 8, border: `1px solid ${INK_HAIR}`,
                      background: "#FFF", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Trash2 size={14} style={{ color: NONVEG }} /></button>
                  </div>
                </div>

                {/* Bottom action row: Choose this area / View hotels */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: 10, paddingTop: 10,
                  borderTop: `1px solid ${isSelected ? TERRACOTTA + "25" : INK_HAIR}`
                }}>
                  <div style={{ fontSize: "0.78rem", color: INK_MUTED, display: "flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={12} color={isSelected ? TERRACOTTA : INK_MUTED} />
                    <span>Area: <strong>{addr.city || addr.street || "Custom Location"}</strong> · Max 25 km radius</span>
                  </div>

                  {isSelected ? (
                    <button
                      onClick={() => navigate("/")}
                      style={{
                        padding: "6px 14px", borderRadius: 999,
                        background: TERRACOTTA, color: "#FFF5E6",
                        border: "none", fontSize: "0.8rem", fontWeight: 600,
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                        boxShadow: `0 2px 8px ${TERRACOTTA}35`
                      }}
                    >
                      Browse {addr.city ? `${addr.city} ` : ""}Hotels (25 km) →
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        selectAddress(addr);
                        toast.success(`Active area set to ${addr.city || addr.street}! Showing hotels in 25 km.`);
                      }}
                      style={{
                        padding: "6px 16px", borderRadius: 999,
                        background: "#FFF", color: TERRACOTTA_DEEP,
                        border: `1.5px solid ${TERRACOTTA}`,
                        fontSize: "0.8rem", fontWeight: 700,
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                        transition: "all 0.15s"
                      }}
                    >
                      <MapPin size={12} color={TERRACOTTA} />
                      Choose This Area (Show Hotels)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(43,29,18,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, animation: "fade-in 0.2s ease-out",
        }} onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#FFFAF0", borderRadius: 20,
            width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", padding: "28px 24px",
            boxShadow: "0 20px 60px rgba(43,29,18,0.25)",
            animation: "scale-in 0.2s ease-out",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{
                fontFamily: "var(--font-display)", fontSize: "1.4rem",
                fontWeight: 500, color: INK, letterSpacing: "-0.01em",
              }}>{editingId ? "Edit address" : "New address"}</h3>
              <button onClick={() => setShowModal(false)} style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: FIELD, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><X size={16} style={{ color: INK_SOFT }} /></button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {LABELS.map((l) => {
                const selected = form.label === l.value;
                return (
                  <button key={l.value} onClick={() => setForm({ ...form, label: l.value })} style={{
                    flex: 1, padding: "10px", borderRadius: 10,
                    border: `1.5px solid ${selected ? TERRACOTTA : INK_HAIR}`,
                    background: selected ? `${TERRACOTTA}0C` : "transparent",
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                    fontSize: "0.82rem", fontWeight: 600,
                    color: selected ? TERRACOTTA_DEEP : INK_SOFT,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 0.2s",
                  }}><l.icon size={14} /> {l.label}</button>
                );
              })}
            </div>

            {/* Interactive Map Picker (Compulsory location confirmation) */}
            <MapLocationPicker
              initialLat={form.latitude}
              initialLng={form.longitude}
              initialAddress={[form.street, form.city, form.state, form.pincode].filter(Boolean).join(", ")}
              onConfirmLocation={handleMapConfirm}
              isCompulsory={true}
              title="Pin Delivery Location on Map (Compulsory)"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={form.street} onChange={set("street")} placeholder="Street / House / Area (e.g. Annapurnadham, Adalaj)" style={inputStyle} onFocus={focusH} onBlur={blurH} />
              <div style={{ display: "flex", gap: 10 }}>
                <input value={form.city} onChange={set("city")} placeholder="City (e.g. Adalaj / Gandhinagar)" style={inputStyle} onFocus={focusH} onBlur={blurH} />
                <input value={form.state} onChange={set("state")} placeholder="State" style={inputStyle} onFocus={focusH} onBlur={blurH} />
              </div>
              <input value={form.pincode} onChange={set("pincode")} placeholder="Pincode" style={inputStyle} onFocus={focusH} onBlur={blurH} />
            </div>

            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", padding: "14px", marginTop: 24,
              borderRadius: 12, border: "none",
              background: saving ? INK_FAINT : `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
              color: "#FFF5E6", fontSize: "0.92rem", fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: saving ? "none" : `0 6px 20px ${TERRACOTTA}40`,
            }}>
              {saving ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : (editingId ? "Update address" : "Save address")}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-up { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
