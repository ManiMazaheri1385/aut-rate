import * as React from "react";
import { cn } from "@/lib/utils";

interface SealProps {
  /** Pixel size of the square stamp. */
  size?: number;
  className?: string;
  /** Ink color: deep petrol on light surfaces, mint on dark ones. */
  tone?: "petrol" | "mint";
}

/**
 * The registry seal: a bespoke circular stamp with rotating Persian text,
 * drawn once for this project. It signs the hero, the footer and the brand.
 */
export function Seal({ size = 120, className, tone = "petrol" }: SealProps) {
  const ink = tone === "petrol" ? "#0A5C63" : "#D8ECE6";
  const gold = "#D9A441";
  const id = React.useId().replace(/[:]/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="مهر استادسنجی امیرکبیر"
      className={cn("shrink-0", className)}
    >
      <defs>
        <path id={`seal-arc-${id}`} d="M 100,100 m -74,0 a 74,74 0 1,1 148,0 a 74,74 0 1,1 -148,0" />
      </defs>

      {/* Outer rim: double ring */}
      <circle cx="100" cy="100" r="96" fill="none" stroke={ink} strokeWidth="3.5" />
      <circle cx="100" cy="100" r="88" fill="none" stroke={ink} strokeWidth="1.5" />

      {/* Rotating inscription */}
      <text fill={ink} fontSize="15.5" fontWeight="700" letterSpacing="2">
        <textPath href={`#seal-arc-${id}`} startOffset="0%">
          دانشگاه صنعتی امیرکبیر
        </textPath>
      </text>
      <text fill={ink} fontSize="13" fontWeight="600" letterSpacing="4">
        <textPath href={`#seal-arc-${id}`} startOffset="50%">
          سامانه استادسنجی
        </textPath>
      </text>

      {/* Gilded rim dots between the two inscriptions */}
      <circle cx="26" cy="100" r="2.4" fill={gold} />
      <circle cx="174" cy="100" r="2.4" fill={gold} />

      {/* Inner field: graduation cap drawn in-house */}
      <g transform="translate(100 92)">
        {/* mortarboard */}
        <path d="M -34 -8 L 0 -22 L 34 -8 L 0 6 Z" fill={ink} />
        <path d="M -18 -2 L -18 12 Q 0 24 18 12 L 18 -2 L 0 6 Z" fill={ink} opacity="0.85" />
        {/* tassel */}
        <line x1="30" y1="-5" x2="30" y2="16" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="30" cy="19" r="3.2" fill={gold} />
      </g>

      {/* Founding line */}
      <text x="100" y="140" textAnchor="middle" fill={ink} fontSize="11" fontWeight="600" letterSpacing="1">
        دانشکده ریاضیات و علوم کامپیوتر
      </text>
    </svg>
  );
}
