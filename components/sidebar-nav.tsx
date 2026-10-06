"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardCheck, House, ListOrdered, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BackupControls } from "@/components/backup-controls";

const LINKS = [
  { href: "/", label: "Accueil", short: "Accueil", Icon: House },
  { href: "/progressions", label: "Mes progressions", short: "Progressions", Icon: ListOrdered },
  { href: "/generateur", label: "Générateur de supports", short: "Générer", Icon: Sparkles },
  { href: "/evaluations", label: "Évaluations & correction", short: "Évaluations", Icon: ClipboardCheck },
  { href: "/banque", label: "Banque de ressources", short: "Banque", Icon: BookOpen },
];

function isActiveLink(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Sur téléphone (usage principal de la capture de copies), la barre latérale de
 * 236 px mangeait 60 % de l'écran : elle cède la place à une barre d'onglets
 * fixée en bas, à portée de pouce, qui respecte la zone de sécurité iOS.
 */
function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-terracotta-deep/30 bg-terracotta-deep pb-[env(safe-area-inset-bottom)] text-[#F6E9D6] md:hidden"
    >
      {LINKS.map(({ href, short, Icon }) => {
        const active = isActiveLink(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] font-medium",
              active ? "text-white" : "opacity-75"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-11 items-center justify-center rounded-t-full rounded-b-md",
                active && "bg-sable text-terracotta-deep"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            {short}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
    <MobileTabBar pathname={pathname} />
    <nav
      aria-label="Navigation principale"
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col md:flex gap-1.5 overflow-y-auto bg-gradient-to-b from-terracotta-deep to-terracotta px-[18px] py-7 text-[#F6E9D6]">
      <div className="mb-8 flex items-center gap-2.5 pl-1.5">
        <div className="h-[34px] w-[34px] shrink-0 rounded-t-full rounded-b-md border-2 border-[#F6E9D6] bg-ochre" />
        <div>
          <span className="font-display text-[22px] font-semibold leading-none tracking-wide">
            Riwaq
          </span>
          <small className="mt-0.5 block text-[12px] opacity-80">
            Espace prof
          </small>
        </div>
      </div>

      {LINKS.map((link) => {
        const isActive = isActiveLink(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-sable font-semibold text-terracotta-deep shadow-[var(--shadow-riwaq)]"
                : "text-[#F6E9D6] opacity-80 hover:bg-white/10 hover:opacity-100"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isActive ? "bg-terracotta-deep opacity-100" : "bg-[#F6E9D6] opacity-50"
              )}
            />
            {link.label}
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-3 p-3.5">
        <BackupControls variant="sidebar" />
        <div className="text-xs leading-relaxed opacity-70">
          Riwaq — nom provisoire, « riwaq » désigne la galerie à arcades qui
          distribue les pièces d&apos;une maison marocaine.
        </div>
      </div>
    </nav>
    </>
  );
}
