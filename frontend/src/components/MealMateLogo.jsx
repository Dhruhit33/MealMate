import React from "react";
import { Link } from "react-router-dom";

/**
 * MealMate Brand Logo Component
 * Combines the signature double-arch cloche "M" emblem with editorial typography.
 */
export function MealMateIcon({ size = 36, className = "", style = {} }) {
  const s = typeof size === "number" ? size : parseInt(size, 10) || 36;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        filter: "drop-shadow(0 4px 10px rgba(193, 74, 42, 0.28))",
        ...style,
      }}
    >
      <defs>
        <linearGradient id={`mmBgGrad-${s}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A50" />
          <stop offset="55%" stopColor="#C0401E" />
          <stop offset="100%" stopColor="#8B2910" />
        </linearGradient>
        <linearGradient id={`mmShine-${s}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`mmDrop-${s}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#4A1405" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Squircle container with rich terracotta gradient */}
      <rect x="2" y="2" width="44" height="44" rx="12.5" fill={`url(#mmBgGrad-${s})`} />
      {/* Subtle top gloss highlight */}
      <rect x="2" y="2" width="44" height="22" rx="12.5" fill={`url(#mmShine-${s})`} />

      {/* Cloche 'M' monogram + companion smile */}
      <g filter={`url(#mmDrop-${s})`}>
        {/* Aroma warmth sparkle */}
        <path
          d="M24 8.5C24 9.8 23.2 10.6 22.2 11.5C23.2 12.4 24 13.2 24 14.5C24 13.2 24.8 12.4 25.8 11.5C24.8 10.6 24 9.8 24 8.5Z"
          fill="#FFE5D0"
        />

        {/* Double-arch dining dome "M" */}
        <path
          d="M12.5 32V21.5C12.5 17.5 15.2 14.8 19 14.8C21.4 14.8 23.2 16.2 24 18.2C24.8 16.2 26.6 14.8 29 14.8C32.8 14.8 35.5 17.5 35.5 21.5V32"
          stroke="#FFF5E6"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Friendly companion smile curve */}
        <path
          d="M17.5 33.2C19.5 35.2 21.6 35.8 24 35.8C26.4 35.8 28.5 35.2 30.5 33.2"
          stroke="#FFD5BE"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default function MealMateLogo({
  size = 36,
  variant = "full", // "full" | "icon" | "wordmark"
  theme = "light", // "light" | "dark"
  to = null,
  showTagline = false,
  tagline = "Food Delivery",
  className = "",
  style = {},
}) {
  const isDark = theme === "dark";
  const primaryTextColor = isDark ? "#FFF5E6" : "#1C1208";
  const terracottaColor = "#C0401E";
  const s = typeof size === "number" ? size : parseInt(size, 10) || 36;
  const fontMultiplier = s / 36;
  const fontSize = `${(1.35 * fontMultiplier).toFixed(2)}rem`;

  const content = (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.max(8, Math.round(s * 0.28)),
        textDecoration: "none",
        userSelect: "none",
        ...style,
      }}
    >
      {variant !== "wordmark" && <MealMateIcon size={s} />}

      {variant !== "icon" && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            style={{
              fontFamily: "var(--font-display, 'Instrument Serif', Georgia, serif)",
              fontSize,
              fontWeight: 600,
              color: primaryTextColor,
              letterSpacing: "-0.015em",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            Meal
            <span style={{ color: terracottaColor, fontWeight: 700 }}>Mate</span>
            <span style={{ color: terracottaColor, fontWeight: 700 }}>.</span>
          </span>

          {showTagline && (
            <span
              style={{
                fontSize: `${(0.68 * fontMultiplier).toFixed(2)}rem`,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 700,
                color: isDark ? "rgba(255,255,255,0.45)" : "rgba(28,18,8,0.42)",
                marginTop: 2,
              }}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none", display: "inline-flex" }}>
        {content}
      </Link>
    );
  }

  return content;
}
