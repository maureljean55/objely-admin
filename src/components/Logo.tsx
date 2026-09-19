export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 48" fill="none" className={className} role="img" aria-label="Objely Admin">
      <defs>
        <linearGradient id="objelyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#087BEA" />
          <stop offset="100%" stopColor="#8D6CF3" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="40" height="40" rx="10" fill="url(#objelyGrad)" />
      <circle cx="22" cy="24" r="9" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M28.5 30.5L34 36" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="22" cy="24" r="3.5" fill="#FFFFFF" />
      <text x="52" y="28" fontFamily="system-ui, -apple-system, Inter, sans-serif" fontSize="20" fontWeight="700" fill="#102653" letterSpacing="-0.5">
        Objely
      </text>
      <rect x="122" y="14" width="56" height="18" rx="4" fill="#EEF3FA" />
      <text x="128" y="27" fontFamily="system-ui, -apple-system, Inter, sans-serif" fontSize="10" fontWeight="600" fill="#087BEA" letterSpacing="0.5">
        ADMIN
      </text>
    </svg>
  );
}
