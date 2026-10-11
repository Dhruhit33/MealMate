// ═══════════════════════════════════════════════════════════════════════════
// FoodRush WebSocket Service — Real-time order tracking & notifications
// Uses native WebSocket with STOMP-like fallback via @stomp/stompjs
// ═══════════════════════════════════════════════════════════════════════════

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;
let subscriptions = {};
let reconnectTimer = null;
let isConnecting = false;
const listeners = new Map(); // eventName → Set of callbacks

class SocketService {
  constructor() {
    this.connected = false;
    this.userId = null;
    this.token = null;
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
  }

  connect(token, userId) {
    if (isConnecting || this.connected) return;
    this.token = token;
    this.userId = userId;
    isConnecting = true;

    try {
      stompClient = new Client({
        webSocketFactory: () => {
          try {
            return new SockJS(`/api/ws`);
          } catch {
            return new WebSocket(`ws://${window.location.host}/api/ws`);
          }
        },
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: () => {},

        onConnect: () => {
          this.connected = true;
          isConnecting = false;
          emit("connected");
          this.onConnectCallbacks.forEach((cb) => cb());

          // Re-subscribe to all channels after reconnect
          Object.entries(subscriptions).forEach(([topic, handlers]) => {
            handlers.forEach((handler) => this._subscribe(topic, handler));
          });
        },

        onDisconnect: () => {
          this.connected = false;
          isConnecting = false;
          emit("disconnected");
          this.onDisconnectCallbacks.forEach((cb) => cb());
        },

        onStompError: (frame) => {
          console.warn("[Socket] STOMP error:", frame);
          this.connected = false;
          isConnecting = false;
        },
      });

      stompClient.activate();
    } catch (err) {
      console.warn("[Socket] Failed to init STOMP, using polling fallback:", err);
      isConnecting = false;
      emit("fallback");
    }
  }

  disconnect() {
    if (stompClient) {
      stompClient.deactivate();
      stompClient = null;
    }
    subscriptions = {};
    this.connected = false;
    isConnecting = false;
    emit("disconnected");
  }

  _subscribe(topic, callback) {
    if (!stompClient || !this.connected) return null;
    try {
      return stompClient.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch {
          callback(message.body);
        }
      });
    } catch (err) {
      console.warn("[Socket] Subscribe error:", err);
      return null;
    }
  }

  subscribeToOrder(orderId, callback) {
    const topic = `/topic/order/${orderId}`;
    if (!subscriptions[topic]) subscriptions[topic] = new Set();
    subscriptions[topic].add(callback);
    return this._subscribe(topic, callback);
  }

  subscribeToDriverLocation(orderId, callback) {
    const topic = `/topic/driver-location/${orderId}`;
    if (!subscriptions[topic]) subscriptions[topic] = new Set();
    subscriptions[topic].add(callback);
    return this._subscribe(topic, callback);
  }

  subscribeToRestaurantOrders(restaurantId, callback) {
    const topic = `/topic/restaurant/${restaurantId}/orders`;
    if (!subscriptions[topic]) subscriptions[topic] = new Set();
    subscriptions[topic].add(callback);
    return this._subscribe(topic, callback);
  }

  subscribeToDriverAssignments(driverId, callback) {
    const topic = `/topic/driver/${driverId}/assignments`;
    if (!subscriptions[topic]) subscriptions[topic] = new Set();
    subscriptions[topic].add(callback);
    return this._subscribe(topic, callback);
  }

  sendDriverLocation(orderId, driverId, lat, lng) {
    if (!stompClient || !this.connected) return;
    try {
      stompClient.publish({
        destination: "/app/driver-location",
        body: JSON.stringify({ orderId, driverId, latitude: lat, longitude: lng }),
      });
    } catch (err) {
      console.warn("[Socket] Send location error:", err);
    }
  }

  onConnect(cb) { this.onConnectCallbacks.push(cb); }
  onDisconnect(cb) { this.onDisconnectCallbacks.push(cb); }

  on(event, cb) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(cb);
    return () => listeners.get(event)?.delete(cb);
  }

  isConnected() { return this.connected; }
}

function emit(event, data) {
  listeners.get(event)?.forEach((cb) => cb(data));
}

const socketService = new SocketService();
export default socketService;
