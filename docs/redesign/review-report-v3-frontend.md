# Frontend Quality Review Report (v3) - Topic-Driven + Slider Reaction Redesign

**Reviewer:** reviewer-fe
**Date:** 2026-02-09
**Scope:** Task #3 (PostCard/Slider/Common Components) + Task #4 (Page Refactoring/Data Visualization)

---

## 1. Summary

Overall the implementation is **solid**. TypeScript build passes cleanly (`npx tsc --noEmit` = 0 errors), no `any` types are used anywhere in the codebase, and the component architecture follows reasonable separation of concerns. The slider component has good keyboard/pointer accessibility, and the new theme/consensus visualization components are well-structured.

**Verdict: PASS** -- No critical/blocking issues found. Several medium-severity and low-severity observations are documented below for future improvement.

---

## 2. TypeScript Build Check

```
npx tsc --noEmit  -->  0 errors, 0 warnings
```

No `any` types found in any `.ts` or `.tsx` file under `src/`.

---

## 3. Component Design (Single Responsibility / Reusability)

### 3.1 Good

| Component | Assessment |
|-----------|-----------|
| `ReactionSlider` | Well-isolated slider with clear props interface. Supports keyboard (arrow keys, Escape, Delete) and pointer (drag + double-tap removal). No external state leaks. |
| `PostContent` | Clean extraction of mention parsing into dedicated component. `@mention` regex links with `stopPropagation` to prevent parent card navigation. |
| `PostCardSkeleton` | Mirrors PostCard structure accurately for loading states. |
| `ConsensusMeter` / `ConsensusMeterMini` | Appropriately split into full vs. mini variants with shared color logic. |
| `AttributeLensBar` | Self-contained filter UI with popover per group. State lifted properly via `activeFilters` / `onFilterChange`. |
| `OpinionSpectrum` | recharts ScatterChart with tooltip, legends, loading states -- well-structured. |
| `PositionMap` / `PositionMapMini` | Full radar chart vs. compact sidebar card -- appropriate split. |
| `EmptyState` | Good generic empty component with icon/title/description/action slots. |
| `InfiniteScroll` | Uses IntersectionObserver properly with cleanup. |

### 3.2 Observations

| ID | Severity | File | Issue |
|----|----------|------|-------|
| C-1 | **Medium** | `ComposeModal.tsx`, `ComposePanel.tsx` | Significant code duplication between modal and panel compose forms. The character count SVG ring, keyboard shortcut hint, success animation, title input, and submit logic are nearly identical (~80% overlap). Consider extracting a shared `ComposeForm` component that both modal and panel wrap. |
| C-2 | **Medium** | `PostCard.tsx` | PostCard is 362 lines with 16 props. It combines display, reaction slider, action bar, dropdown menu, repost confirm dialog, and report modal. The component could benefit from extracting `PostActionBar` and `PostReactionSection` sub-components to improve readability. |
| C-3 | **Low** | Multiple pages | `handleReaction` and `handleReactionRemove` (optimistic update + API call + error rollback) are copy-pasted identically across `home/page.tsx`, `explore/page.tsx`, `themes/[id]/page.tsx`, `users/[handle]/page.tsx`, and `posts/[id]/page.tsx`. Consider extracting a `usePostReaction` custom hook. |
| C-4 | **Low** | `PostContent.tsx` | `MENTION_REGEX` uses a global regex (`/g` flag) with `exec()` in a while loop. This works correctly because the regex is defined at module scope (not inside the component), so `lastIndex` resets between renders. However, note that if this regex were ever moved inside the component, it would break. A safer pattern would be `content.matchAll(regex)`. |
| C-5 | **Low** | `home/page.tsx`, `explore/page.tsx`, `themes/[id]/page.tsx` | Interface types `TimelinePost`, `ThemePost`, etc. are redefined locally in each page with nearly identical shapes. These could be consolidated into a shared type file under `src/types/`. |

---

## 4. Type Safety

### 4.1 Good

- **Zero `any` usage** across entire `src/` directory.
- All component props have explicit TypeScript interfaces.
- `PostAttribute.type` uses union literal type matching database column names.
- `AttributeType` in `AttributeBadge` is properly constrained.
- `database.ts` remains single source of truth; `index.ts` re-exports cleanly.

### 4.2 Observations

| ID | Severity | File | Issue |
|----|----------|------|-------|
| T-1 | **Low** | `mapAttributes.ts` | The `typeMap` record manually mirrors keys from `ReactorAttributeSnapshot`. If a new attribute is added to the DB type, `typeMap` won't flag a missing entry. Consider deriving keys from the type. |
| T-2 | **Low** | `AttributeLensBar.tsx` | `FILTER_GROUPS` is a hardcoded array. If attribute values are added/removed in `database.ts`, this must be manually synchronized. Consider importing from `constants.ts`. |
| T-3 | **Low** | `OpinionSpectrum.tsx:49` | `CustomTooltip` props typed inline as `{ active?: boolean; payload?: Array<{ payload: SpectrumDataPoint }> }` -- this works but could be cleaner using recharts' `TooltipProps` generic. |

---

## 5. State Management

### 5.1 Good

- Optimistic updates for reactions and follows with proper rollback on API failure.
- `useCallback` used appropriately to stabilize fetch functions in dependency arrays.
- `ComposeModal` resets state on close via `useEffect` on `open`.
- `ReactionSlider` syncs external value via `useEffect` only when not dragging.
- `InfiniteScroll` uses `IntersectionObserver` with cleanup on unmount.

### 5.2 Observations

| ID | Severity | File | Issue |
|----|----------|------|-------|
| S-1 | **Medium** | `themes/[id]/page.tsx:184-189` | `useEffect` depends on `fetchPosts` which itself depends on `theme`. This creates a cycle: initial render -> fetchPosts updates theme state -> fetchPosts reference changes -> useEffect re-fires. The `fetchPosts` function at line 134 reads `theme` state to conditionally call `setTheme`, creating an unnecessary dependency chain. The `if (!theme)` guard prevents infinite loops but causes a redundant second fetch. |
| S-2 | **Medium** | `themes/[id]/page.tsx:192-197` | Second `useEffect` for filters change also calls `fetchPosts()` which overlaps with the initial load effect. On initial render, `fetchPosts` is called twice (once from each effect). Consider guarding the filter effect to only fire after initial load. |
| S-3 | **Low** | `BottomNav.tsx:31-37` | `handlePost` only passes `content` but the `ComposeModal.onSubmit` signature expects `(content, title?, themeId?)`. The title is silently dropped here. If a user writes a title in the bottom nav modal, it will be lost. |
| S-4 | **Low** | `home/page.tsx:93` | `handleCompose` receives `_themeId` parameter but uses `composeThemeId` from state instead. The parameter should be used directly, or the `_themeId` param should be removed from the function signature. |

---

## 6. Slider Component Quality (ReactionSlider)

### 6.1 Touch/Mouse Support

- Uses Pointer Events API (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`) which unifies mouse and touch handling.
- `setPointerCapture` / `releasePointerCapture` properly used for drag tracking even when pointer leaves the element.
- `touch-none` CSS class prevents scroll interference during slider interaction.
- Double-tap detection via `lastTapRef` with 300ms threshold for reaction removal.

### 6.2 Accessibility

- Proper `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
- Japanese `aria-label="リアクションスコア"` and `aria-valuetext` with context ("未評価" / "XX%の共感").
- `aria-disabled` attribute set correctly.
- `tabIndex` set to -1 when disabled, 0 otherwise.
- Keyboard support: ArrowLeft/Right/Up/Down for 5-point increments, Escape to cancel drag, Enter/Space to confirm, Delete/Backspace to remove.

### 6.3 Performance

- `useCallback` memoizes all event handlers.
- `getScoreFromPosition` is memoized.
- Gradient recalculated on render (not in state), which is appropriate.
- CSS transitions (`duration-75` for filled track) provide smooth visual feedback without JS animation overhead.
- Score popup only renders when `showPopup && isDragging`.

### 6.4 Observations

| ID | Severity | File | Issue |
|----|----------|------|-------|
| SL-1 | **Low** | `ReactionSlider.tsx:37` | `clampScore` rounds to integer inside `getScoreFromPosition`. This is fine but means the slider has 101 discrete values (0-100). The step size is implicit. Adding a `step` prop would make this configurable in the future. |
| SL-2 | **Low** | `ReactionSlider.tsx:53-54` | `e.target as HTMLElement` cast in `setPointerCapture` -- if the pointer starts on a child element (e.g., the score popup), the capture is set on the wrong element. Using `trackRef.current` instead of `e.target` would be more robust. This applies to `handlePointerDown` (line 54) and `handleThumbPointerDown` (line 109). |

---

## 7. Naming / Consistency

### 7.1 Good

- Consistent Japanese UI text throughout.
- Component file names follow PascalCase convention.
- Props interfaces consistently named `{Component}Props`.
- API response interfaces clearly documented in page files.

### 7.2 Observations

| ID | Severity | File | Issue |
|----|----------|------|-------|
| N-1 | **Low** | `PostCard.tsx:16` | `AlertDialogTitle` is renamed to `AlertDialogTitleComp` (presumably to avoid conflict). This suggests a naming collision that could be resolved by importing differently or aliasing more descriptively. |
| N-2 | **Low** | Various | Some pages define `PostDisplay` locally, others use `TimelinePost`. The data shapes are nearly identical. A shared `PostView` type would unify naming. |

---

## 8. Rendering Performance

| ID | Severity | File | Issue |
|----|----------|------|-------|
| R-1 | **Low** | `PostCard.tsx` | Inline arrow functions in `onReaction`, `onReactionRemove`, `onRepost` callbacks create new function references on each render. While React handles this fine for typical list sizes, for very long lists (100+ posts), wrapping parent-level callbacks with `useCallback` or using a stable ref pattern would prevent unnecessary re-renders. |
| R-2 | **Low** | `explore/page.tsx:141-152` | The sort/filter useEffect (line 144-152) has `fetchPosts` in its dependency array, but `fetchPosts` changes when `buildPostUrl` changes (which changes on `sort`/`filters`). This means the effect fires twice on sort change: once from the effect's own dependencies, and once from the explicit `sort`/`filters` deps. In practice, React batches these, but the dependency design is fragile. |

---

## 9. Security Observations

| ID | Severity | File | Issue |
|----|----------|------|-------|
| SEC-1 | **Low** | `PostContent.tsx` | Mention regex `/@([a-zA-Z0-9_]+)/g` correctly limits handle characters. Content is rendered as text nodes (not `dangerouslySetInnerHTML`), so XSS is not a concern. |
| SEC-2 | **Low** | `PostCard.tsx:93-96` | `window.location.origin` usage for clipboard is safe; no user-controlled data in URL path beyond the post ID. |

---

## 10. Summary of Findings by Severity

### Critical (0)
None.

### Medium (4)
| ID | Description |
|----|-------------|
| C-1 | ComposeModal/ComposePanel code duplication (~80% overlap) |
| C-2 | PostCard is large (362 lines, 16 props) -- could benefit from sub-component extraction |
| S-1 | Double fetch on initial load in themes/[id]/page.tsx due to dependency cycle |
| S-2 | Filter effect overlaps with initial load effect in themes/[id]/page.tsx |

### Low (13)
C-3, C-4, C-5, T-1, T-2, T-3, S-3, S-4, SL-1, SL-2, N-1, N-2, R-1, R-2

---

## 11. Recommendations (Priority Order)

1. **Extract shared `ComposeForm`** (C-1): Create a `ComposeForm` component for the shared compose UI logic, then wrap it in `ComposeModal` (Dialog) and `ComposePanel` (card). This eliminates ~100 lines of duplication.

2. **Fix double-fetch in theme detail** (S-1, S-2): Restructure the `fetchPosts` function to not depend on `theme` state, and guard the filter effect to skip on initial render.

3. **Extract `usePostReaction` hook** (C-3): Consolidate the optimistic reaction update pattern used across 5+ pages into a reusable hook.

4. **Shared timeline types** (C-5, N-2): Create `src/types/timeline.ts` with `PostView`, `ThemeView`, etc. used across all page components.

5. **ReactionSlider pointer capture target** (SL-2): Use `trackRef.current` instead of `e.target` for `setPointerCapture` to ensure correct capture target.

---

## 12. Overall Assessment

The frontend implementation successfully delivers the topic-driven redesign with slider reactions. Code quality is good with proper TypeScript typing, consistent patterns, and sensible component boundaries. The medium-severity issues are maintainability concerns (code duplication, slightly complex state management) rather than functional bugs. No critical issues were found that would block release.

**Build Status:** PASS (0 TypeScript errors)
**any Usage:** NONE
**Accessibility:** Good (slider has full ARIA + keyboard support)
**Performance:** Acceptable (no obvious bottlenecks for typical usage)
