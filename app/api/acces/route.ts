import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCES, egalConstant, jetonAcces } from "@/lib/acces";

export async function POST(req: NextRequest) {
  const code = process.env.ACCESS_CODE;
  const retour = req.nextUrl.clone();
  retour.search = "";

  if (!code) {
    retour.pathname = "/";
    return NextResponse.redirect(retour, 303);
  }

  const saisi = String((await req.formData()).get("code") ?? "");
  const [attendu, recu] = await Promise.all([jetonAcces(code), jetonAcces(saisi)]);

  if (!egalConstant(attendu, recu)) {
    // Petit délai contre les essais en rafale.
    await new Promise((r) => setTimeout(r, 800));
    retour.pathname = "/acces";
    retour.searchParams.set("erreur", "1");
    return NextResponse.redirect(retour, 303);
  }

  retour.pathname = "/";
  const rep = NextResponse.redirect(retour, 303);
  rep.cookies.set(COOKIE_ACCES, attendu, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return rep;
}
