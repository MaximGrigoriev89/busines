import { businessTierVisualForTier } from "./businessTierVisual";
import type { Business } from "./types";
import coffeeTier1 from "./assets/businesses/coffee-point/tier-1.png";
import coffeeTier2 from "./assets/businesses/coffee-point/tier-2.png";
import coffeeTier3 from "./assets/businesses/coffee-point/tier-3.png";
import bakeryTier1 from "./assets/businesses/mini-bakery/tier-1.png";
import bakeryTier2 from "./assets/businesses/mini-bakery/tier-2.png";
import bakeryTier3 from "./assets/businesses/mini-bakery/tier-3.png";
import shoeRepairTier1 from "./assets/businesses/shoe-repair/tier-1.png";
import shoeRepairTier2 from "./assets/businesses/shoe-repair/tier-2.png";
import shoeRepairTier3 from "./assets/businesses/shoe-repair/tier-3.png";
import carWashTier1 from "./assets/businesses/car-wash/tier-1.png";
import carWashTier2 from "./assets/businesses/car-wash/tier-2.png";
import carWashTier3 from "./assets/businesses/car-wash/tier-3.png";

const GENERATED_BUSINESS_ART: Record<number, [string, string, string]> = {
  0: [coffeeTier1, coffeeTier2, coffeeTier3],
  1: [bakeryTier1, bakeryTier2, bakeryTier3],
  2: [shoeRepairTier1, shoeRepairTier2, shoeRepairTier3],
  3: [carWashTier1, carWashTier2, carWashTier3],
};

const PALETTES = [
  { roof: "#2563eb", front: "#dbeafe", side: "#bfdbfe", accent: "#f59e0b" },
  { roof: "#16a34a", front: "#dcfce7", side: "#bbf7d0", accent: "#0284c7" },
  { roof: "#7c3aed", front: "#ede9fe", side: "#ddd6fe", accent: "#f59e0b" },
  { roof: "#dc2626", front: "#fee2e2", side: "#fecaca", accent: "#0ea5e9" },
  { roof: "#0f766e", front: "#ccfbf1", side: "#99f6e4", accent: "#f97316" },
];

export function businessArtForBusiness(business: Pick<Business, "id" | "tier" | "icon">): string {
  const visual = businessTierVisualForTier(business.tier);
  const generatedArt = GENERATED_BUSINESS_ART[business.id]?.[visual.stage - 1];
  if (generatedArt) return generatedArt;

  const palette = PALETTES[business.id % PALETTES.length];
  const floors = visual.stage + 1;
  const windows = Array.from({ length: floors }, (_, floor) => (
    Array.from({ length: 4 }, (_, column) => {
      const x = 96 + column * 28;
      const y = 114 - floor * 22;
      return `<rect x="${x}" y="${y}" width="15" height="12" rx="3" fill="${floor < visual.stage ? palette.accent : "#ffffff"}" opacity="${floor < visual.stage ? "0.78" : "0.62"}"/>`;
    }).join("")
  )).join("");
  const sign = visual.stage >= 3
    ? `<rect x="120" y="52" width="88" height="22" rx="8" fill="${palette.accent}"/><text x="164" y="68" text-anchor="middle" font-size="14" font-weight="800" fill="#ffffff">T${business.tier}</text>`
    : "";
  const crane = visual.stage === 1
    ? `<path d="M46 55h62M54 55v72M39 127h84" stroke="#64748b" stroke-width="8" stroke-linecap="round"/><path d="M108 55l30 24" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>`
    : "";
  const awning = visual.stage >= 2
    ? `<path d="M78 91h166l-15 22H93z" fill="${palette.roof}"/><path d="M96 113v36M226 113v36" stroke="${palette.roof}" stroke-width="8" stroke-linecap="round"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 190">
    <defs>
      <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#f8fafc"/>
        <stop offset="1" stop-color="#e2e8f0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#475569" flood-opacity="0.2"/>
      </filter>
    </defs>
    <rect width="320" height="190" rx="26" fill="url(#sky)"/>
    <ellipse cx="164" cy="158" rx="118" ry="18" fill="#94a3b8" opacity="0.24"/>
    ${crane}
    <g filter="url(#shadow)">
      <path d="M76 82h172v72H76z" fill="${palette.side}"/>
      <path d="M94 70h136v84H94z" fill="${palette.front}"/>
      <path d="M84 70h156l-22-28H106z" fill="${palette.roof}"/>
      ${awning}
      ${windows}
      <rect x="144" y="125" width="38" height="29" rx="7" fill="#334155"/>
      ${sign}
    </g>
    <circle cx="258" cy="52" r="27" fill="#ffffff" opacity="0.86"/>
    <text x="258" y="62" text-anchor="middle" font-size="25">${escapeXml(business.icon)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
