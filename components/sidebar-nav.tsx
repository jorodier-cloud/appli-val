"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BackupControls } from "@/components/backup-controls";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/progressions", label: "Mes progressions" },
  { href: "/generateur", label: "Générateur de supports" },
  { href: "/evaluations", label: "Évaluations & correction" },
  { href: "/banque", label: "Banque de ressources" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-[236px] shrink-0 flex-col gap-1.5 bg-gradient-to-b from-terracotta-deep to-terracotta px-[18px] py-7 text-[#F6E9D6]">
      <div className="mb-8 flex items-center gap-2.5 pl-1.5">
        <div className="h-[34px] w-[34px] shrink-0 rounded-t-full rounded-b-md border-2 border-[#F6E9D6] bg-ochre" />
        <div>
          <span className="font-display text-[22px] font-semibold leading-none tracking-wide">
            Riwaq
          </span>
          <small className="-mt-0.5 block text-[10.5px] uppercase tracking-[1.5px] opacity-75">
            Espace prof
          </small>
        </div>
      </div>

      {LINKS.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
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
  );
}
