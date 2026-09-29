# StackedHub design system (Phase 2)

Source of truth in code: `src/styles.css`, `src/components/BrandMark.tsx`.

## Colour

| Token | Use |
| --- | --- |
| Primary / brand | Primary buttons, active nav, links |
| Brand accent | Highlights |
| Success | Connected, available, completed |
| Warning | Demo mode, kitchen status |
| Destructive | Errors, cancel |
| Background / card / muted | Surfaces and secondary text |

Target **WCAG AA** (4.5:1) for body text on background and muted-foreground on cards.

## Type

- Family: **Plus Jakarta Sans** (400–800)
- Page title: `text-2xl` / `lg:text-3xl` bold
- Section: `text-lg` bold
- Body / controls: `text-sm`
- Allow browser font scaling (do not set `max-size` tricks that block zoom)

## Layout

- Max content width ~1440px
- Cards: `rounded-3xl`, 24px padding
- Controls: min height 44px (`py-2.5` + padding), `rounded-xl`
- Spacing: 4 / 6 / 8 Tailwind steps

## Components

- Primary button: `bg-primary text-primary-foreground`, disabled at 60% opacity
- Secondary: `glass-soft`
- Status pills: Placed / In kitchen / Ready / Completed / Cancelled
- Logo: stacked plates mark + wordmark in header and auth screens

## States

Every async view must show loading, a specific error (not “Something went wrong”), success toast/inline copy, and an empty state with a next action.
