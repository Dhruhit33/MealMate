// ═══════════════════════════════════════════════════════════════════════════
// FoodRush Notification Service — Toast + Sound notifications
// ═══════════════════════════════════════════════════════════════════════════

import toast from "react-hot-toast";

// Sound effects using Web Audio API (no external files needed)
class SoundService {
  constructor() {
    this.ctx = null;
  }

  _getCtx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch { return null; }
    }
    return this.ctx;
  }

  playOrderAlert() {
    const ctx = this._getCtx();
    if (!ctx) return;
    // Three ascending beeps
    [0, 0.15, 0.3].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 520 + i * 100;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
  }

  playDeliveryAlert() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }
}

const sound = new SoundService();

// ─── Order status to human-readable message ────────────────────────────────
const STATUS_MESSAGES = {
  PLACED:           { msg: "Order placed! Restaurant will confirm soon.",  icon: "📝", sound: null },
  ACCEPTED:         { msg: "Restaurant accepted your order!",               icon: "✅", sound: null },
  PREPARING:        { msg: "Chef is cooking your food! 🍳",                icon: "👨‍🍳", sound: null },
  READY:            { msg: "Order ready! Assigning delivery partner...",    icon: "📦", sound: null },
  OUT_FOR_DELIVERY: { msg: "Your food is on the way! 🛵",                  icon: "🛵", sound: "delivery" },
  DELIVERED:        { msg: "Delivered! Enjoy your meal! 🎉",               icon: "🎉", sound: "delivery" },
  CANCELLED:        { msg: "Order has been cancelled.",                     icon: "❌", sound: null },
};

export function notifyOrderStatus(status, restaurantName = "") {
  const info = STATUS_MESSAGES[status];
  if (!info) return;

  const message = restaurantName
    ? `${info.icon} ${restaurantName}: ${info.msg}`
    : `${info.icon} ${info.msg}`;

  if (status === "DELIVERED" || status === "OUT_FOR_DELIVERY") {
    toast.success(message, { duration: 5000, icon: info.icon });
    sound.playDeliveryAlert();
  } else if (status === "CANCELLED") {
    toast.error(message, { duration: 5000 });
  } else {
    toast(message, { duration: 4000, icon: info.icon });
  }

  // Browser push notification (if permission granted)
  if (Notification.permission === "granted") {
    new Notification("FoodRush", { body: info.msg, icon: "/icon.png" });
  }
}

export function notifyNewOrder(orderId) {
  toast.success(`🔔 New order #${orderId?.slice(-6)} received!`, {
    duration: 8000,
    style: {
      background: "#1C1208",
      color: "#FFF5E6",
      fontWeight: "bold",
    },
  });
  sound.playOrderAlert();
}

export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export { sound };
export default { notifyOrderStatus, notifyNewOrder, requestNotificationPermission };
