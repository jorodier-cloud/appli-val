import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
  title: "Riwaq — L'espace du professeur",
  description:
    "Riwaq : progression, contenus pédagogiques, correction IA et vie de classe pour l'enseignant du second degré.",
  applicationName: "Riwaq",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true, // émet aussi mobile-web-app-capable (standard Android/Chromium)
    title: "Riwaq",
    statusBarStyle: "black-translucent",
  },
  // Conservé pour compatibilité iOS < 15.4 ; les versions récentes lisent
  // mobile-web-app-capable (déjà émis par appleWebApp.capable ci-dessus).
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // "cover" étend le contenu sous les encoches/barres système : nécessaire en mode
  // standalone pour que l'UI de capture caméra (upload de copie) occupe l'écran entier.
  viewportFit: "cover",
  themeColor: "#B4522C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${workSans.variable}`}>
      <body className="flex min-h-screen antialiased">
        <SidebarNav />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
