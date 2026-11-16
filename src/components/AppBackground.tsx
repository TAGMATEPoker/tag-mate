'use client';

export default function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F3F7FC]"
    >
      {/* ミント・水色・ラベンダーの柔らかな面光源グラデーション */}
      <div
        className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full opacity-80 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 214, 159, 0.26) 0%, rgba(186, 238, 255, 0.18) 55%, transparent 75%)',
        }}
      />
      <div
        className="absolute -right-24 top-28 h-[460px] w-[460px] rounded-full opacity-80 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(167, 139, 250, 0.24) 0%, rgba(191, 219, 254, 0.2) 55%, transparent 75%)',
        }}
      />
      <div
        className="absolute -bottom-32 left-1/4 h-[480px] w-[560px] rounded-full opacity-85 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(52, 211, 153, 0.22) 0%, rgba(125, 211, 252, 0.2) 50%, rgba(221, 214, 254, 0.18) 75%, transparent 85%)',
        }}
      />

      {/* 添付画像風のドットパターン＆スート装飾SVG */}
      <svg
        className="absolute inset-0 h-full w-full opacity-75"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="tagmate-dots"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.35" fill="rgba(0, 196, 154, 0.16)" />
            <circle cx="17" cy="17" r="1.2" fill="rgba(139, 92, 246, 0.13)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tagmate-dots)" />

        {/* 左上・右下の淡いカードスートアクセント */}
        <text
          x="6%"
          y="18%"
          fontSize="22"
          fill="rgba(0, 196, 154, 0.22)"
          transform="rotate(-14 60 140)"
        >
          ♠
        </text>
        <text
          x="88%"
          y="24%"
          fontSize="20"
          fill="rgba(167, 139, 250, 0.24)"
          transform="rotate(16 700 180)"
        >
          ♥
        </text>
        <text
          x="10%"
          y="78%"
          fontSize="20"
          fill="rgba(56, 189, 248, 0.24)"
          transform="rotate(12 80 620)"
        >
          ♦
        </text>
        <text
          x="86%"
          y="82%"
          fontSize="22"
          fill="rgba(0, 196, 154, 0.22)"
          transform="rotate(-12 720 660)"
        >
          ♣
        </text>
      </svg>
    </div>
  );
}