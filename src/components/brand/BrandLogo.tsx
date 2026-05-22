import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Barra de navegación y pies tipo “header”. */
export const BRAND_LOGO_HEADER_SRC = "/Logo/Logo-4.png";
/** Bloques destacados del hero (marca vertical). */
export const BRAND_LOGO_HERO_SRC = "/Logo/Logo-5.png";

export type BrandLogoMark = "horizontal" | "vertical";

const SRC: Record<BrandLogoMark, string> = {
  horizontal: BRAND_LOGO_HEADER_SRC,
  vertical: BRAND_LOGO_HERO_SRC,
};

const defaultDimensions: Record<BrandLogoMark, { width: number; height: number }> = {
  horizontal: { width: 320, height: 88 },
  vertical: { width: 160, height: 200 },
};

type BrandLogoProps = {
  /** `horizontal` = cabecera; `vertical` = hero / bloques tipo encabezado visual. */
  mark?: BrandLogoMark;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** `null` = solo imagen (sin enlace). */
  href?: string | null;
};

export function BrandLogo({
  mark = "horizontal",
  className,
  width: widthProp,
  height: heightProp,
  priority,
  href = "/",
}: BrandLogoProps) {
  const defaults = defaultDimensions[mark];
  const width = widthProp ?? defaults.width;
  const height = heightProp ?? defaults.height;

  const img = (
    <Image
      src={SRC[mark]}
      alt="Civitapp"
      width={width}
      height={height}
      className={cn(
        mark === "horizontal"
          ? "h-12 w-auto max-w-[min(100%,18rem)] object-contain object-left sm:h-14 sm:max-w-[22rem] md:h-[3.75rem] md:max-w-[26rem]"
          : "mx-auto h-28 w-auto max-h-40 max-w-[11rem] object-contain object-center sm:h-36 sm:max-w-[13rem]",
        className
      )}
      priority={priority}
      sizes={
        mark === "horizontal"
          ? "(max-width: 640px) 220px, (max-width: 1024px) 280px, 320px"
          : "(max-width: 640px) 140px, 180px"
      }
    />
  );
  if (href === null) return img;
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-navy)]"
    >
      {img}
    </Link>
  );
}
