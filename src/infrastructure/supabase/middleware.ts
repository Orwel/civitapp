import { NextResponse, type NextRequest } from "next/server";

/** Obtiene el project-ref de la URL de Supabase (ej. "abcdefgh" de https://abcdefgh.supabase.co) */
function getSupabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** Comprueba si hay cookie de sesión de Supabase (sin llamar a la API, evita "fetch failed" en Edge). */
function hasAuthCookie(request: NextRequest): boolean {
  const ref = getSupabaseProjectRef();
  if (!ref) return false;
  const cookieName = `sb-${ref}-auth-token`;
  const value = request.cookies.get(cookieName)?.value;
  return Boolean(value && value.length > 0);
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/acciones/nueva" ||
    pathname.startsWith("/acciones/nueva/");

  if (needsAuth && !hasAuthCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return response;
}
