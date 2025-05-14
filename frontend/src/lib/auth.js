export function getCurrentUserRole() {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  console.log("getCurrentUserRole user", user);
  
  return user?.role || null; // Should return "USER", "ADMIN", or "TECHNICAL_USER"
}
