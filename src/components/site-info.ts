/** Public contact details from the earlier Stacked Foods site. Presentation only. */
export const PHONE_DISPLAY = "073 330 9881";
export const PHONE_HREF = "tel:+27733309881";
export const WHATSAPP_DISPLAY = "079 279 0592";
export const WHATSAPP_HREF = "https://wa.me/27792790592";

export const ADDRESS_LINES = [
  "Hendrik Potgieter Road",
  "Weltevredenpark",
  "Johannesburg, 1709",
] as const;
export const ADDRESS_QUERY = "Hendrik Potgieter Road, Weltevredenpark, Johannesburg, 1709";
export const DIRECTIONS_HREF = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS_QUERY)}`;

export const SLOGAN = "Stacked high. Tastes higher.";

export const OPENING_HOURS = [
  { days: "Monday–Thursday", hours: "10:00–17:00" },
  { days: "Friday", hours: "10:00–17:30" },
  { days: "Saturday", hours: "09:30–17:30" },
  { days: "Sunday", hours: "09:30–16:30" },
] as const;

export const HOURS_SUMMARY =
  "Mon–Thu 10:00–17:00 · Fri 10:00–17:30 · Sat 09:30–17:30 · Sun 09:30–16:30";
