<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Shared customer and operations shells own layout and visual tokens; keep individual pages unframed to avoid nested surface layouts.
- Menu photography resolves by item name through the shared image helper, with category fallbacks for unknown items; never depend on database IDs for image matching.
- Customer tracking reads the existing order-by-ID API and uses the same lifecycle constants as the staff queue; never invent progress or delivery positions.
