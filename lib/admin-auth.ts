import { cookies } from "next/headers";

export async function isAdmin() {
  const store = await cookies();
  return store.get("admin_session")?.value === "1";
}