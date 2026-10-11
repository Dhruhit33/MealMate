import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useCartStore } from "../store/cartStore";

const INK       = "#1C1208";
const INK_SOFT  = "rgba(28,18,8,0.58)";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR  = "rgba(28,18,8,0.07)";
const CARD      = "#FFF9EE";
const FIELD     = "#F5ECD8";
const TC        = "#C0401E";
const TC_SOFT   = "#DE6A40";
const TC_DEEP   = "#8B2910";
const VEG       = "#4A7020";
const NONVEG    = "#A83020";

function VegDot({ isVeg }) {
  const c = isVeg ? VEG : NONVEG;
  return (
    <span style={{
      width:10, height:10, border:`1.5px solid ${c}`,
      borderRadius:2, display:"inline-flex",
      alignItems:"center", justifyContent:"center", flexShrink:0,
    }}>
      {isVeg
        ? <span style={{ width:5, height:5, borderRadius:"50%", background:c }} />
        : <span style={{ width:0, height:0,
            borderLeft:"3px solid transparent", borderRight:"3px solid transparent",
            borderBottom:`5px solid ${c}` }} />
      }
    </span>
  );
}

export default function CartPanel({ open, onClose }) {
  const navigate = useNavigate();
  const { items, restaurantName, getTotal, getItemCount, updateQuantity, clearCart } = useCartStore();
  const [clearing, setClearing] = useState(false);

  const total = getTotal();
  const itemCount = getItemCount();

  // Fee logic: free delivery above ₹499, else ₹29
  const deliveryFee = total >= 499 ? 0 : 29;
  const grandTotal  = total + deliveryFee;

  const handleCheckout = () => { onClose(); navigate("/checkout"); };
  const handleClear = async () => {
    setClearing(true);
    await clearCart();
    setClearing(false);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div onClick={onClose} style={{
          position:"fixed", inset:0, zIndex:200,
          background:"rgba(28,18,8,0.32)",
          backdropFilter:"blur(4px)",
          animation:"fade-in 0.2s ease-out",
        }} />
      )}

      {/* Drawer */}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0,
        width:400, maxWidth:"100vw", zIndex:201,
        display:"flex", flexDirection:"column",
        background:"#FFFAF0",
        boxShadow:"-24px 0 64px rgba(28,18,8,0.14)",
        transform:open?"translateX(0)":"translateX(100%)",
        transition:"transform 0.32s cubic-bezier(0.2,0.8,0.2,1)",
      }}>

        {/* Header */}
        <div style={{
          padding:"20px 22px 16px",
          borderBottom:`1px solid ${INK_HAIR}`,
          display:"flex", alignItems:"center", gap:12,
        }}>
          <div style={{
            width:38, height:38, borderRadius:10,
            background:`linear-gradient(135deg,${TC_SOFT},${TC_DEEP})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 12px ${TC}35`,
          }}>
            <ShoppingBag size={17} style={{ color:"#FFF5E6" }} />
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{
              fontFamily:"var(--font-display)", fontSize:"1.3rem",
              fontWeight:500, color:INK, letterSpacing:"-0.01em",
            }}>Your cart</h2>
            {restaurantName&&(
              <p style={{ fontSize:"0.76rem", color:INK_MUTED, marginTop:1 }}>from {restaurantName}</p>
            )}
          </div>
          {items.length>0&&(
            <button onClick={handleClear} disabled={clearing} style={{
              fontSize:"0.74rem", color:NONVEG, background:"none",
              border:"none", cursor:"pointer", fontFamily:"var(--font-sans)",
              fontWeight:600, padding:"4px 8px", borderRadius:6,
              opacity:clearing?0.5:1, transition:"opacity 0.2s",
            }}>Clear</button>
          )}
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:8, border:"none",
            background:FIELD, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <X size={15} style={{ color:INK_SOFT }} />
          </button>
        </div>

        {/* Delivery fee banner */}
        {items.length>0&&(
          <div style={{
            margin:"12px 16px 0",
            padding:"10px 14px",
            borderRadius:10,
            background: deliveryFee===0 ? "#ECFDF5" : `${TC}09`,
            border: `1px solid ${deliveryFee===0?"#BBF7D0":TC+"22"}`,
            display:"flex", alignItems:"center", gap:8,
            fontSize:"0.78rem",
            color: deliveryFee===0 ? "#15803D" : TC_DEEP,
            fontWeight:600,
          }}>
            <Tag size={13} />
            {deliveryFee===0
              ? "🎉 Free delivery on this order!"
              : `Add ₹${499-total} more for FREE delivery`
            }
          </div>
        )}

        {/* Items */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
          {items.length===0 ? (
            <div style={{
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              height:"100%", gap:16, paddingBottom:80,
            }}>
              <div style={{
                width:80, height:80, borderRadius:"50%",
                background:FIELD, display:"flex",
                alignItems:"center", justifyContent:"center",
              }}>
                <ShoppingBag size={32} style={{ color:INK_MUTED }} />
              </div>
              <div style={{ textAlign:"center" }}>
                <p style={{ fontWeight:700, color:INK, marginBottom:4 }}>Your cart is empty</p>
                <p style={{ fontSize:"0.84rem", color:INK_SOFT }}>
                  Add items from a restaurant to get started
                </p>
              </div>
              <button onClick={onClose} style={{
                padding:"10px 24px", borderRadius:999, border:"none",
                background:`linear-gradient(135deg,${TC_SOFT},${TC} 55%,${TC_DEEP})`,
                color:"#FFF5E6", fontSize:"0.88rem", fontWeight:600,
                fontFamily:"var(--font-sans)", cursor:"pointer",
                boxShadow:`0 4px 14px ${TC}40`,
              }}>Browse restaurants</button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {items.map((item,i)=>(
                <div key={item.menuItemId} style={{
                  background:CARD, borderRadius:14,
                  border:`1px solid ${INK_HAIR}`,
                  padding:"13px 15px",
                  display:"flex", alignItems:"center", gap:13,
                  animation:`fade-up 0.3s ease-out ${i*0.04}s both`,
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                      <VegDot isVeg={item.isVeg} />
                      <span style={{ fontSize:"0.9rem", fontWeight:600, color:INK,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {item.name}
                      </span>
                    </div>
                    <p style={{
                      fontSize:"0.86rem", color:TC_DEEP,
                      fontFamily:"var(--font-display)", fontWeight:700,
                    }}>₹{(item.price*item.quantity).toFixed(0)}</p>
                    {item.quantity>1&&(
                      <p style={{ fontSize:"0.7rem", color:INK_MUTED, marginTop:1 }}>
                        ₹{item.price} × {item.quantity}
                      </p>
                    )}
                  </div>

                  {/* Qty controls */}
                  <div style={{
                    display:"flex", alignItems:"center", gap:6,
                    background:FIELD, borderRadius:10, padding:"4px 6px",
                  }}>
                    <button onClick={()=>updateQuantity(item.menuItemId,item.quantity-1)} style={{
                      width:26, height:26, borderRadius:7, border:"none",
                      background:item.quantity===1?`${NONVEG}15`:`${TC}14`,
                      color:item.quantity===1?NONVEG:TC_DEEP,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all 0.15s",
                    }}>
                      {item.quantity===1?<Trash2 size={11}/>:<Minus size={11}/>}
                    </button>
                    <span style={{ fontSize:"0.9rem", fontWeight:700, color:INK,
                      minWidth:18, textAlign:"center" }}>{item.quantity}</span>
                    <button onClick={()=>updateQuantity(item.menuItemId,item.quantity+1)} style={{
                      width:26, height:26, borderRadius:7, border:"none",
                      background:`${TC}14`, color:TC_DEEP,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      <Plus size={11}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length>0&&(
          <div style={{
            borderTop:`1px solid ${INK_HAIR}`,
            padding:"18px 20px 26px",
          }}>
            {/* Bill */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                fontSize:"0.86rem", color:INK_SOFT, marginBottom:7 }}>
                <span>Subtotal ({itemCount} item{itemCount!==1?"s":""})</span>
                <span style={{ fontWeight:600, color:INK }}>₹{total.toFixed(0)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between",
                fontSize:"0.82rem", color:INK_MUTED, marginBottom:7 }}>
                <span>Delivery fee</span>
                <span style={{ color:deliveryFee===0?"#15803D":INK_MUTED, fontWeight:deliveryFee===0?700:400 }}>
                  {deliveryFee===0?"FREE":`₹${deliveryFee}`}
                </span>
              </div>
              <div style={{ height:1, background:INK_HAIR, margin:"10px 0" }} />
              <div style={{ display:"flex", justifyContent:"space-between",
                fontSize:"1rem", fontWeight:700, color:INK }}>
                <span>Total</span>
                <span style={{ color:TC_DEEP, fontFamily:"var(--font-display)", fontSize:"1.1rem" }}>
                  ₹{grandTotal.toFixed(0)}
                </span>
              </div>
            </div>

            <button onClick={handleCheckout} style={{
              width:"100%", padding:"15px", borderRadius:14, border:"none",
              background:`linear-gradient(135deg,${TC_SOFT},${TC} 55%,${TC_DEEP})`,
              color:"#FFF5E6", fontSize:"0.94rem", fontWeight:600,
              fontFamily:"var(--font-sans)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              boxShadow:`0 8px 24px ${TC}42`,
              transition:"all 0.2s",
            }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 12px 32px ${TC}55`; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 8px 24px ${TC}42`; }}
            >
              Proceed to checkout <ArrowRight size={16}/>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-up  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in  { from{opacity:0} to{opacity:1} }
      `}</style>
    </>
  );
}
