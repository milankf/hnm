# Version History

Track component replacements (major) and significant in-component changes (minor) for easy rollback.

---

## How to read this

- **vX.0.0 (major)**: Component replaced. Old component kept; new one plugged in.
- **vX.Y.0 (minor)**: Large changes within the same component (layout, structure, styling).

---

## Versions

### v4.0.0 (major)

- **Wedding page v4** (`/v4`): Simplified layout — hero + video slots only. Each of 7 videos gets its own 250vh section.
  - Route: `app/v4/page.tsx`
  - Component: `components/wedding-page-v4.tsx`
  - Hero: landing with typewriter “kristoffer and aubrey”
  - 7 empty placeholder sections; content to be copied from v3 one by one
  - 9-video strip (1 cut top, 7 full, 1 cut bottom); section exit drives lock → scroll
  - Sections removed for now: Our story, Countdown, Venues, Program, RSVP

### v3.0.0 (major)

- **Wedding page v3** (`/v3`): New layout with scroll-driven video strip background.
  - Route: `app/v3/page.tsx`
  - Component: `components/wedding-page-v3.tsx`
  - Videos alternate between `intro_vid.mp4` and `walk_vid.mp4` in a vertical strip
  - As you scroll, the strip translates to reveal the next video as each section’s background
  - **Scroll pattern**: When a section scrolls up, the video strip scrolls up to the next video; then locks when that video is centered. See `docs/v3-scroll-pattern.md`.
  - Film effects (grain, flicker, gate weave, vignette, yellow tint) applied to all videos
  - Sections: Hero, Our story, Date/countdown, Venues, Program, RSVP — all with video background

### v2.1.0 (minor)

- **WeddingPage** (`components/wedding-page.tsx`): Landing hero text color changed from white to stone-900; removed registry/wishlist text from Our story section.

### v1.1.0 (minor)

- **Event Details**: Redesigned with scroll-driven flow.
  - Phase 1: Date + countdown centered (venues hidden)
  - Phase 2: Countdown closes on scroll
  - Phase 3–4: Redemptorist Church typewriter + photo/map (scroll to open/close)
  - Phase 5–6: Beverly View typewriter (cursor persists) + photo/map (scroll to open/close)
  - New: `components/event-countdown.tsx` (DD:HH:MM:SS), `ScrollTypewriter` for scroll-driven text reveal

### v2.0.0 (major)

- **Event details**: Replaced static date/venue block with scroll-driven experience.
  - Phase 1: Centered date + big countdown (DD:HH:MM:SS), venues hidden
  - Phase 2: Countdown closes on scroll
  - Phase 3–4: Redemptorist Church typewriter (scroll-driven) then photo+map open/close
  - Phase 5–6: Beverly View Events Pavillion typewriter (cursor stays) then photo+map open/close
  - New: `components/event-countdown.tsx`, `ScrollTypewriter` in `wedding-page.tsx`

### v2.0.0 (major)

- **Event details**: Replaced static date + venues block with scroll-driven experience.
  - New: Centered date + large countdown (DD:HH:MM:SS), venues hidden initially
  - New: `components/event-countdown.tsx` — live countdown to wedding date
  - Scroll flow: countdown → close → Redemptorist typewriter → photo+map → Beverly typewriter (cursor stays) → photo+map
  - Same file: `components/wedding-page.tsx` — `ScrollTypewriter` helper, new scroll ranges (0–1 across 1000vh)

### v2.0.0 (major)

- **Event details**: Replaced static date/venues with scroll-driven flow.
  - Date + countdown centered first (DD:HH:MM:SS); venues hidden.
  - Countdown closes on scroll; Redemptorist Church types in with scroll.
  - Photo + map open/close per venue; Beverly typewriter keeps cursor at end.
  - New: `components/event-countdown.tsx`
  - Updated: `components/wedding-page.tsx` event details section

### v1.0.0 (major)

- **Hero video**: Replaced simple video background with CinematicFilmVideo (8mm/A24-style effects).
  - New: `components/cinematic-film-video.tsx` — grain, flicker, gate weave, vignette
  - Config: `config/hero-video-styling.ts` — HERO_VIDEO_SRC, HERO_GRAIN_OPACITY, HERO_YELLOW_TINT
  - No prior component kept (FilmGrainVideo was never committed)
