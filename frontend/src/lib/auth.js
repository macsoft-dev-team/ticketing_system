export function getCurrentUserRole() {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  return user?.role || null; // Should return "USER", "ADMIN", or "TECHNICAL_USER"
}
