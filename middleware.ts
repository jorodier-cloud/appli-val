import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCES, egalConstant, jetonAcces } from "@/lib/acces";

export async function middleware(req: NextRequest) {
  const code = process.env.ACCESS_CODE;
  if (!code) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/acces" || pathname === "/api/acces") return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_ACCES)?.value ?? "";
  if (cookie && egalConstant(cookie, await jetonAcces(code))) return NextResponse.next();

  // Server Action ou appel non navigateur : refus net, pas de redirection.
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new NextResponse("Accès refusé", { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/acces";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Tout sauf les fichiers statiques de Next et les icônes publiques.
  matcher: ["/((?!_next/static|_next/image|favicon.png|apple-touch-icon.png|icons/|manifest.webmanifest).*)"],
};
