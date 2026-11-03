import { FALLBACK_IMAGE, imageFor, imageFrame, imagePosition } from "@/lib/menu-extras";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuPhoto({
  item,
  alt = "",
  className,
}: {
  item: { id?: string; name?: string; category?: MenuItem["category"] };
  alt?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden bg-[#1c1612]", className)}>
      <img
        src={imageFor(item)}
        alt={alt}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = item.category
            ? imageFor({ category: item.category })
            : FALLBACK_IMAGE;
        }}
        className={cn("h-full max-w-none object-cover", imageFrame(item), imagePosition(item))}
      />
    </div>
  );
}
