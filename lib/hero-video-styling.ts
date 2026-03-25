/** Hero video styling — tweak values here or use ?debug=hero for live sliders */

export const HERO_VIDEO_SRC = "/videos/intro_vid.mp4";

/** Grain opacity (0–1). Slightly higher for dust/speckle like aged film. */
export const HERO_GRAIN_OPACITY = 0.12;

/** Video blur in pixels — softens for a dreamy, aged-film look. */
export const HERO_VIDEO_BLUR = 1.5;

/** Film-strip frame: video smaller in center with repeated frames above/below (cut off). */
export const HERO_FILM_STRIP_FRAME = true;

/** When film-strip frame is on: center frame height as ratio of viewport (0.6–1). 0.7 = 70% center, 15% cut-off top, 15% bottom. */
export const HERO_FILM_FRAME_RATIO = 0.7;

/** Center frame height as fraction of viewport (0–1). 0.7 = 70%, so 15% repeat visible top/bottom. */
export const HERO_FILM_FRAME_HEIGHT = 0.7;

/** Background color — grey to resemble film (visible in gaps between video frames). */
export const HERO_BACKGROUND_COLOR = "#2e2e2e";

/** Warm yellow tint overlay */
export const HERO_YELLOW_TINT = {
  color: "rgba(255, 240, 200, 0.12)",
  blendMode: "overlay" as const,
};

/** Hero text legibility: 'background' = subtle black bg behind text, 'shadow' = black text-shadow */
export const HERO_TEXT_LEGIBILITY: "background" | "shadow" = "shadow";
