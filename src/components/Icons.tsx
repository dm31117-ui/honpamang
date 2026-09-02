/** 인라인 SVG 아이콘 — 24×24 viewBox, currentColor stroke. */

interface IconProps {
  size?: number;
  strokeWidth?: number;
}

const base = (size: number, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  'aria-hidden': true,
  focusable: false as const,
});

export function PlusIcon({ size = 14, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ size = 13, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ size = 14, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 14, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 14, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ArrowUpRightIcon({ size = 15, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

export function SearchIcon({ size = 15, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
