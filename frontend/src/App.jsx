import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import SkeletonPage from "./components/SkeletonPage";

// ── Layouts (each role gets its own shell) ────────────────────────────────
import CustomerLayout from "./layouts/CustomerLayout";
import OwnerLayout    from "./layouts/OwnerLayout";
import DriverLayout   from "./layouts/DriverLayout";

// ── Public pages ──────────────────────────────────────────────────────────
const LoginPage    = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyOtpPage = lazy(() => import("./pages/VerifyOtpPage"));

// ── Customer pages ────────────────────────────────────────────────────────
const HomePage             = lazy(() => import("./pages/customer/HomePage"));
const SearchPage           = lazy(() => import("./pages/customer/SearchPage"));
const RestaurantDetailPage = lazy(() => import("./pages/customer/RestaurantDetailPage"));
const ProfilePage          = lazy(() => import("./pages/customer/ProfilePage"));
const AddressesPage        = lazy(() => import("./pages/customer/AddressesPage"));
const CheckoutPage         = lazy(() => import("./pages/customer/CheckoutPage"));
const OrdersPage           = lazy(() => import("./pages/customer/OrdersPage"));
const OrderDetailPage      = lazy(() => import("./pages/customer/OrderDetailPage"));
const WalletPage           = lazy(() => import("./pages/customer/WalletPage"));
const OrderTrackingPage    = lazy(() => import("./pages/customer/OrderTrackingPage"));

// ── Owner pages ───────────────────────────────────────────────────────────
const OwnerOverview  = lazy(() => import("./pages/owner/OwnerOverview"));
const OwnerOrders    = lazy(() => import("./pages/owner/OwnerOrders"));
const OwnerMenu      = lazy(() => import("./pages/owner/OwnerMenu"));
const OwnerSettings  = lazy(() => import("./pages/owner/OwnerSettings"));

// ── Driver pages ──────────────────────────────────────────────────────────
const DriverHome     = lazy(() => import("./pages/driver/DriverHome"));
const DriverHistory  = lazy(() => import("./pages/driver/DriverHistory"));

export default function App() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────── */}
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/register"   element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* ── Customer routes ──────────────────────────────────────── */}
        <Route element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route path="/"                       element={<HomePage />} />
          <Route path="/search"                 element={<SearchPage />} />
          <Route path="/restaurants/:id"        element={<RestaurantDetailPage />} />
          <Route path="/profile"                element={<ProfilePage />} />
          <Route path="/addresses"              element={<AddressesPage />} />
          <Route path="/checkout"               element={<CheckoutPage />} />
          <Route path="/orders"                 element={<OrdersPage />} />
          <Route path="/orders/:orderId"        element={<OrderDetailPage />} />
          <Route path="/orders/:orderId/track"  element={<OrderTrackingPage />} />
          <Route path="/wallet"                 element={<WalletPage />} />
        </Route>

        {/* ── Owner routes ─────────────────────────────────────────── */}
        <Route element={
          <ProtectedRoute allowedRoles={["RESTAURANT_OWNER"]}>
            <OwnerLayout />
          </ProtectedRoute>
        }>
          <Route path="/owner"          element={<OwnerOverview />} />
          <Route path="/owner/orders"   element={<OwnerOrders />} />
          <Route path="/owner/menu"     element={<OwnerMenu />} />
          <Route path="/owner/settings" element={<OwnerSettings />} />
        </Route>

        {/* ── Driver routes ─────────────────────────────────────────── */}
        <Route element={
          <ProtectedRoute allowedRoles={["DRIVER", "DELIVERY_DRIVER"]}>
            <DriverLayout />
          </ProtectedRoute>
        }>
          <Route path="/driver"         element={<DriverHome />} />
          <Route path="/driver/history" element={<DriverHistory />} />
        </Route>

        {/* ── Fallback: redirect based on role ─────────────────────── */}
        <Route path="*" element={<RoleRoute />} />
      </Routes>
    </Suspense>
  );
}
