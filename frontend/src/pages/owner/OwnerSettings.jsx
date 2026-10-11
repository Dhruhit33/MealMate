import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { Loader2, Save, MapPin, Navigation } from "lucide-react";
import { useOwnerStore } from "../../store/ownerStore";

const INK      = "#1C1208";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CARD     = "#FFF9EE";
const FIELD_BG = "#F5ECD8";
const TC       = "#C0401E";
const TC_SOFT  = "#DE6A40";
const SAFFRON  = "#D4882A";
const SUCCESS  = "#15803D";

// Reverse-geocode with Nominatim to get coords from address
async function geocodeAddress(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

export default function OwnerSettings() {
  const { currentRestaurant, updateRestaurant, createRestaurant, fetchMyRestaurants } = useOwnerStore();
  const isNew = !currentRestaurant;

  const [form, setForm] = useState({
    name: "", description: "", cuisineType: "", address: "",
    phone: "", minOrderAmount: "", imageUrl: "",
    latitude: "", longitude: "",
  });
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  // Track if geocode was already done for this address to avoid repeating
  const geocodedAddress = useRef("");

  useEffect(() => {
    if (currentRestaurant) {
      setForm({
        name: currentRestaurant.name || "",
        description: currentRestaurant.description || "",
        cuisineType: currentRestaurant.cuisineType || "",
        address: currentRestaurant.address || "",
        phone: currentRestaurant.phone || "",
        minOrderAmount: currentRestaurant.minOrderAmount || "",
        imageUrl: currentRestaurant.imageUrl || "",
        latitude: currentRestaurant.latitude || "",
        longitude: currentRestaurant.longitude || "",
      });
      if (currentRestaurant.address) geocodedAddress.current = currentRestaurant.address;
    }
  }, [currentRestaurant?.restaurantId]);

  // Debounced geocode on address blur (NOT on every keystroke to prevent cursor issues)
  const handleAddressBlur = useCallback(async () => {
    if (!form.address || form.address.length < 10) return;
    if (form.latitude && form.longitude) return; // already have coords
    if (geocodedAddress.current === form.address) return; // already geocoded this exact string
    setGeocoding(true);
    const coords = await geocodeAddress(form.address);
    setGeocoding(false);
    if (coords) {
      geocodedAddress.current = form.address;
      setForm(p => ({ ...p, latitude: coords.lat.toString(), longitude: coords.lng.toString() }));
      toast.success("Location auto-detected from address ✓");
    }
  }, [form.address, form.latitude, form.longitude]);

  // Get current GPS location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(p => ({
          ...p,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        }));
        setLocating(false);
        toast.success("Location detected! ✓");
      },
      () => { setLocating(false); toast.error("Could not get location"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return toast.error("Restaurant name is required");
    if (!form.cuisineType?.trim()) return toast.error("Cuisine type is required");
    if (!form.address?.trim()) return toast.error("Address is required");

    // Auto-geocode if missing coords
    let lat = form.latitude;
    let lng = form.longitude;
    if (!lat || !lng) {
      toast("Detecting location...", { icon: "📍" });
      const coords = await geocodeAddress(form.address);
      if (coords) {
        lat = coords.lat.toString();
        lng = coords.lng.toString();
        setForm(p => ({ ...p, latitude: lat, longitude: lng }));
      } else {
        return toast.error("Could not find coordinates. Please use 'Detect Location' or enter manually.");
      }
    }

    setSaving(true);
    try {
      const payload = { ...form, latitude: lat, longitude: lng };
      if (isNew) {
        await createRestaurant(payload);
        await fetchMyRestaurants();
        toast.success("Restaurant created successfully! 🎉");
      } else {
        await updateRestaurant(currentRestaurant.restaurantId, payload);
        toast.success("Settings saved!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || "Failed to save. Check all required fields.");
    }
    setSaving(false);
  };

  // Use a stable onChange handler that doesn't trigger re-geocoding
  const handleChange = useCallback((key) => (e) => {
    const val = e.target.value;
    setForm(p => {
      // If address changes, clear the coords so geocode can run on blur
      if (key === "address" && val !== p.address) {
        return { ...p, [key]: val, latitude: "", longitude: "" };
      }
      return { ...p, [key]: val };
    });
  }, []);

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: FIELD_BG, borderRadius: 10,
    border: "1.5px solid transparent", fontSize: "0.9rem",
    color: INK, fontFamily: "var(--font-sans)", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  const hasCoords = form.latitude && form.longitude;

  return (
    <div style={{ color: INK, animation: "fade-up 0.4s ease-out", maxWidth: 760 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500, color: INK }}>
          {isNew ? "Register Your Restaurant" : "Restaurant Settings"}
        </h1>
        <p style={{ fontSize: "0.85rem", color: INK_MUTED, marginTop: 4 }}>
          {isNew ? "Fill in your restaurant details to get started" : "Update your restaurant details"}
        </p>
      </div>

      {/* Basic Info */}
      <SettingsSection title="Basic Information">
        <FieldRow label="Restaurant Name" required>
          <input value={form.name} onChange={handleChange("name")} placeholder="e.g. Sharma's Kitchen"
            style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
            onBlur={e => e.target.style.borderColor = "transparent"} />
        </FieldRow>
        <FieldRow label="Description">
          <input value={form.description} onChange={handleChange("description")} placeholder="A short description of your restaurant"
            style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
            onBlur={e => e.target.style.borderColor = "transparent"} />
        </FieldRow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FieldRow label="Cuisine Type" required>
            <input value={form.cuisineType} onChange={handleChange("cuisineType")} placeholder="e.g. North Indian"
              style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
              onBlur={e => e.target.style.borderColor = "transparent"} />
          </FieldRow>
          <FieldRow label="Phone Number">
            <input value={form.phone} onChange={handleChange("phone")} placeholder="+91 98765 43210"
              style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
              onBlur={e => e.target.style.borderColor = "transparent"} />
          </FieldRow>
        </div>
        <FieldRow label="Restaurant Image URL">
          <input value={form.imageUrl} onChange={handleChange("imageUrl")} placeholder="https://example.com/image.jpg"
            style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
            onBlur={e => e.target.style.borderColor = "transparent"} />
        </FieldRow>
      </SettingsSection>

      {/* Location */}
      <SettingsSection title="Location (Required)">
        <FieldRow label="Full Address" required>
          <input value={form.address} onChange={handleChange("address")} placeholder="Street, City, State, PIN"
            style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
            onBlur={e => { e.target.style.borderColor = "transparent"; handleAddressBlur(); }} />
        </FieldRow>

        {/* Detect location button */}
        <button type="button" onClick={handleDetectLocation} disabled={locating}
          style={{ width: "100%", padding: "11px", borderRadius: 10, marginBottom: 18,
            border: `1.5px dashed ${TC_SOFT}`, background: `${TC}06`, color: TC_SOFT,
            fontSize: "0.88rem", fontWeight: 600, fontFamily: "var(--font-sans)",
            cursor: locating ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {locating
            ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Detecting...</>
            : <><Navigation size={14} /> Use My Current Location</>}
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FieldRow label="Latitude" required>
            <input value={form.latitude} onChange={handleChange("latitude")} placeholder="e.g. 28.6139" type="number" step="any"
              style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
              onBlur={e => e.target.style.borderColor = "transparent"} />
          </FieldRow>
          <FieldRow label="Longitude" required>
            <input value={form.longitude} onChange={handleChange("longitude")} placeholder="e.g. 77.2090" type="number" step="any"
              style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
              onBlur={e => e.target.style.borderColor = "transparent"} />
          </FieldRow>
        </div>

        {/* Status indicator */}
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 4,
          background: hasCoords ? `${SUCCESS}08` : `${SAFFRON}08`,
          border: `1px solid ${hasCoords ? SUCCESS + "20" : SAFFRON + "20"}`,
          display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem" }}>
          <MapPin size={14} style={{ color: hasCoords ? SUCCESS : SAFFRON, flexShrink: 0 }} />
          <span style={{ color: hasCoords ? SUCCESS : SAFFRON }}>
            {geocoding ? "Auto-detecting from address..." :
             hasCoords ? `Location set: ${parseFloat(form.latitude).toFixed(4)}, ${parseFloat(form.longitude).toFixed(4)}` :
             "Enter address above — coordinates will auto-detect on blur, or use the button above"}
          </span>
        </div>
      </SettingsSection>

      {/* Delivery settings */}
      <SettingsSection title="Order Settings">
        <FieldRow label="Minimum Order Amount (₹)">
          <input value={form.minOrderAmount} onChange={handleChange("minOrderAmount")} placeholder="0 = no minimum"
            type="number" style={inputStyle} onFocus={e => e.target.style.borderColor = TC_SOFT}
            onBlur={e => e.target.style.borderColor = "transparent"} />
        </FieldRow>
        <p style={{ fontSize: "0.74rem", color: INK_MUTED, marginTop: 8 }}>
          Note: Delivery fee and delivery time are set automatically by the system.
        </p>
      </SettingsSection>

      <button onClick={handleSave} disabled={saving} style={{
        padding: "14px 36px", borderRadius: 12, border: "none",
        background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`, color: "#FFF5E6",
        fontWeight: 700, fontSize: "0.95rem", cursor: saving ? "not-allowed" : "pointer",
        fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 10,
        boxShadow: `0 4px 20px ${TC}40`, opacity: saving ? 0.7 : 1 }}>
        {saving ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={18} />}
        {isNew ? "Create Restaurant" : "Save Changes"}
      </button>

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function FieldRow({ label, required, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "rgba(28,18,8,0.4)", marginBottom: 7 }}>
        {label}{required && <span style={{ color: "#DE6A40" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div style={{ background: "#FFF9EE", borderRadius: 20, padding: "24px 28px",
      border: "1px solid rgba(28,18,8,0.07)", marginBottom: 20 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", marginBottom: 20,
        color: "rgba(28,18,8,0.65)", fontWeight: 500 }}>{title}</h2>
      {children}
    </div>
  );
}
