import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, ChefHat, X, PlusCircle } from "lucide-react";
import { useOwnerStore } from "../../store/ownerStore";

const INK      = "#1C1208";
const INK_SOFT = "rgba(28,18,8,0.6)";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CARD     = "#FFF9EE";
const CARD2    = "#F5ECD8";
const TC       = "#C0401E";
const TC_SOFT  = "#DE6A40";
const SUCCESS  = "#15803D";
const DANGER   = "#DC2626";
const PISTACHIO= "#5A7040";

export default function OwnerMenu() {
  const {
    currentRestaurant, menuItems, categories, menuLoading,
    fetchMenu, addMenuItem, updateMenuItem, toggleItemAvailability, deleteMenuItem, addCategory,
  } = useOwnerStore();

  const [filterCat, setFilterCat] = useState("all");
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [busyIds, setBusyIds] = useState({});

  const rid = currentRestaurant?.restaurantId;

  useEffect(() => { if (rid) fetchMenu(rid); }, [rid]);

  const filtered = filterCat === "all" ? menuItems
    : menuItems.filter(i => i.categoryId === filterCat || i.category?.categoryId === filterCat);

  const setBusy = (id, val) => setBusyIds(p => ({ ...p, [id]: val }));

  const handleToggle = async (item) => {
    setBusy(item.itemId, true);
    try { await toggleItemAvailability(rid, item.itemId); }
    catch { toast.error("Failed to toggle"); }
    setBusy(item.itemId, false);
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try { await deleteMenuItem(rid, item.itemId); toast.success("Item deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  if (menuLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Loader2 size={28} style={{ color: TC_SOFT, animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const vegCount = menuItems.filter(i => i.isVeg).length;

  return (
    <div style={{ color: INK, animation: "fade-up 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500, color: INK }}>Menu</h1>
          <p style={{ fontSize: "0.85rem", color: INK_MUTED, marginTop: 4 }}>
            {menuItems.length} items · {vegCount} veg · {menuItems.length - vegCount} non-veg
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowCatModal(true)} style={{ display: "flex", alignItems: "center",
            gap: 6, padding: "9px 16px", borderRadius: 10, border: `1px solid ${INK_HAIR}`,
            background: "transparent", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
            color: INK_SOFT, fontFamily: "var(--font-sans)" }}>
            <Plus size={14} /> Category
          </button>
          <button onClick={() => { setEditItem(null); setShowItemModal(true); }} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10,
            border: "none", background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
            cursor: "pointer", fontSize: "0.88rem", fontWeight: 700, color: "#FFF5E6",
            boxShadow: `0 4px 16px ${TC}40`, fontFamily: "var(--font-sans)" }}>
            <PlusCircle size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Category filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {[{ categoryId: "all", name: "All" }, ...categories].map(cat => (
          <button key={cat.categoryId} onClick={() => setFilterCat(cat.categoryId)} style={{
            padding: "7px 16px", borderRadius: 999, border: `1px solid`,
            borderColor: filterCat === cat.categoryId ? TC : INK_HAIR,
            background: filterCat === cat.categoryId ? `${TC}12` : "transparent",
            color: filterCat === cat.categoryId ? TC : INK_MUTED,
            fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px",
          border: `1.5px dashed ${INK_HAIR}`, borderRadius: 20 }}>
          <ChefHat size={40} style={{ color: INK_MUTED, margin: "0 auto 16px", display: "block", opacity: 0.4 }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>No items yet</h3>
          <p style={{ fontSize: "0.85rem", color: INK_MUTED }}>
            Add your first menu item to get started
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {filtered.map(item => (
            <div key={item.itemId} style={{ background: CARD, borderRadius: 18,
              border: `1px solid ${INK_HAIR}`, overflow: "hidden",
              opacity: item.isAvailable === false ? 0.55 : 1, transition: "opacity 0.2s" }}>
              {/* Image */}
              {item.imageUrl ? (
                <div style={{ height: 160, background: `url(${item.imageUrl}) center/cover`,
                  position: "relative" }}>
                  {item.isAvailable === false && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.78rem", fontWeight: 700, color: "#FFF",
                      letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      UNAVAILABLE
                    </div>
                  )}
                  {item.isBestSeller && (
                    <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px",
                      borderRadius: 999, background: "rgba(212,136,42,0.9)", color: "#FFF",
                      fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.1em", backdropFilter: "blur(4px)" }}>
                      🔥 Bestseller
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: 100, background: CARD2,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "2.5rem", opacity: 0.4 }}>🍽</span>
                </div>
              )}

              {/* Content */}
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      {/* Veg/NonVeg dot */}
                      <span style={{ width: 12, height: 12, border: `1.5px solid ${item.isVeg ? PISTACHIO : DANGER}`,
                        borderRadius: 2, display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%",
                          background: item.isVeg ? PISTACHIO : DANGER }} />
                      </span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: INK }}>{item.name}</span>
                    </div>
                    {item.description && (
                      <p style={{ fontSize: "0.74rem", color: INK_MUTED, lineHeight: 1.4,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: TC }}>
                    ₹{parseFloat(item.price || 0).toFixed(0)}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {/* Toggle availability */}
                    <button onClick={() => handleToggle(item)} disabled={busyIds[item.itemId]}
                      title={item.isAvailable === false ? "Mark available" : "Mark unavailable"}
                      style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${INK_HAIR}`,
                        background: CARD2, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {busyIds[item.itemId]
                        ? <Loader2 size={13} style={{ color: INK_MUTED, animation: "spin 1s linear infinite" }} />
                        : item.isAvailable === false
                          ? <EyeOff size={13} style={{ color: DANGER }} />
                          : <Eye size={13} style={{ color: SUCCESS }} />}
                    </button>
                    {/* Edit */}
                    <button onClick={() => { setEditItem(item); setShowItemModal(true); }}
                      style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${INK_HAIR}`,
                        background: CARD2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Edit2 size={13} style={{ color: INK_SOFT }} />
                    </button>
                    {/* Delete */}
                    <button onClick={() => handleDelete(item)}
                      style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${DANGER}20`,
                        background: `${DANGER}08`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} style={{ color: DANGER }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <ItemModal
          item={editItem} categories={categories} rid={rid}
          onClose={() => { setShowItemModal(false); setEditItem(null); }}
          onSave={async (data) => {
            if (editItem) { await updateMenuItem(rid, editItem.itemId, data); toast.success("Item updated!"); }
            else { await addMenuItem(rid, data); toast.success("Item added!"); }
            setShowItemModal(false); setEditItem(null);
          }}
        />
      )}

      {/* Category Modal */}
      {showCatModal && (
        <CatModal rid={rid} onClose={() => setShowCatModal(false)}
          onSave={async (data) => { await addCategory(rid, data); toast.success("Category added!"); setShowCatModal(false); }} />
      )}

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#FFFBF5", borderRadius: 20, padding: "28px", width: "100%",
        maxWidth: 480, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${INK_HAIR}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 500, color: INK }}>{title}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8,
            border: `1px solid ${INK_HAIR}`, background: "rgba(28,18,8,0.03)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} style={{ color: INK_MUTED }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 14px", background: "#F5ECD8", borderRadius: 10,
          border: `1.5px solid transparent`, fontSize: "0.9rem", color: INK,
          fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor = "#DE6A40"}
        onBlur={e => e.target.style.borderColor = "transparent"} />
    </div>
  );
}

function ItemModal({ item, categories, rid, onClose, onSave }) {
  const TC_SOFT = "#DE6A40";
  const [form, setForm] = useState({
    name: item?.name || "", description: item?.description || "",
    price: item?.price || "", categoryId: item?.categoryId || item?.category?.categoryId || "",
    isVeg: item?.isVeg ?? true, isBestSeller: item?.isBestSeller ?? false, imageUrl: item?.imageUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const set = k => v => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error("Name and price required"); return; }
    setSaving(true);
    try { await onSave({ ...form, price: parseFloat(form.price) }); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  return (
    <Modal title={item ? "Edit Item" : "Add Menu Item"} onClose={onClose}>
      <Field label="Item Name" value={form.name} onChange={set("name")} placeholder="e.g. Butter Chicken" />
      <Field label="Description" value={form.description} onChange={set("description")} placeholder="Short description" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Field label="Price (₹)" value={form.price} onChange={set("price")} type="number" placeholder="0" />
        <div>
          <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>Category</label>
          <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
            style={{ width: "100%", padding: "11px 12px", background: "#F5ECD8", borderRadius: 10,
              border: "1.5px solid transparent", fontSize: "0.88rem", color: INK,
              fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer" }}>
            <option value="">No category</option>
            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <Field label="Image URL" value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://..." />
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={form.isVeg} onChange={e => setForm(p => ({ ...p, isVeg: e.target.checked }))} />
          <span style={{ fontSize: "0.85rem", color: INK }}>Vegetarian 🌿</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={form.isBestSeller} onChange={e => setForm(p => ({ ...p, isBestSeller: e.target.checked }))} />
          <span style={{ fontSize: "0.85rem", color: INK }}>Bestseller 🔥</span>
        </label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10,
          border: `1px solid ${INK_HAIR}`, background: "transparent",
          color: INK_MUTED, fontSize: "0.88rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "11px", borderRadius: 10,
          border: "none", background: `linear-gradient(135deg, ${TC_SOFT}, #C0401E)`, color: "#FFF5E6",
          fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "var(--font-sans)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          {item ? "Update" : "Add Item"}
        </button>
      </div>
    </Modal>
  );
}

function CatModal({ rid, onClose, onSave }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const TC_SOFT = "#DE6A40";
  return (
    <Modal title="Add Category" onClose={onClose}>
      <Field label="Category Name" value={name} onChange={setName} placeholder="e.g. Starters, Mains, Desserts" />
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10,
          border: `1px solid ${INK_HAIR}`, background: "transparent",
          color: INK_MUTED, fontSize: "0.88rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          Cancel
        </button>
        <button onClick={async () => { if (!name) return; setSaving(true); await onSave({ name }).catch(() => {}); setSaving(false); }}
          disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${TC_SOFT}, #C0401E)`, color: "#FFF5E6",
            fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          Add Category
        </button>
      </div>
    </Modal>
  );
}
