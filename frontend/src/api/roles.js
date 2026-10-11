export function normaliseRole(role = "") {
  const r = (role || "").toUpperCase();
  if (r.includes("OWNER") || r.includes("RESTAURANT")) return "RESTAURANT_OWNER";
  if (r.includes("DRIVER") || r.includes("DELIVERY"))   return "DRIVER";
  return "CUSTOMER";
}
