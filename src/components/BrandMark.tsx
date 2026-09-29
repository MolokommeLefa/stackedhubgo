export function BrandMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      role="img"
      aria-label="StackedHub"
    >
      <rect width="40" height="40" rx="10" className="fill-primary" />
      <path
        d="M10 26c4-2 16-2 20 0M10 20c4-2 16-2 20 0M10 14c4-2 16-2 20 0"
        fill="none"
        stroke="currentColor"
        className="text-primary-foreground"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
