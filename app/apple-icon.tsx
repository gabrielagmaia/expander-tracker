import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#EDE9FE",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={120}
          height={99}
          viewBox="0 0 68 56"
          fill="none"
        >
          {/* Arms */}
          <path
            d="M30,22 C16,24 4,30 9,42"
            stroke="#C4B5FD"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M38,22 C52,24 64,30 59,42"
            stroke="#C4B5FD"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Molar bands */}
          <rect x="2" y="40" width="14" height="12" rx="4" fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="2" />
          <rect x="52" y="40" width="14" height="12" rx="4" fill="#DDD6FE" stroke="#8B5CF6" strokeWidth="2" />
          {/* Central screw body */}
          <rect x="24" y="6" width="20" height="18" rx="5" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
          <line x1="24" y1="15" x2="44" y2="15" stroke="#C4B5FD" strokeWidth="1.5" opacity="0.7" />
          <circle cx="34" cy="15" r="3" fill="#A78BFA" opacity="0.9" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
