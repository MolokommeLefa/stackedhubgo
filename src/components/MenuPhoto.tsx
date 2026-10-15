import { FALLBACK_IMAGE, imageFor, imagePosition } from "@/lib/menu-extras";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuPhoto({
  item,
  alt = "",
  className,
}: {
  item: { id?: string; category?: MenuItem["category"] };
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src={imageFor(item)}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = item.category
          ? imageFor({ category: item.category })
          : FALLBACK_IMAGE;
      }}
      className={cn("bg-[#1c1612] object-cover", imagePosition(item), className)}
    />
  );
}
