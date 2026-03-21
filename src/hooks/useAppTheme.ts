import { useEffect } from "react";
import { useConfigStore } from "@/stores/config";
import { hexToRgb, rgbToHex, isDark } from "@/utils/colors";
import type { HexColor } from "@/utils/colors";

function adjustBrightness(hex: HexColor, amount: number): HexColor {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: Math.max(0, Math.min(255, r + amount)),
    g: Math.max(0, Math.min(255, g + amount)),
    b: Math.max(0, Math.min(255, b + amount)),
  });
}

function withAlpha(hex: HexColor, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function blendToward(base: HexColor, target: HexColor, amount: number): HexColor {
  const b = hexToRgb(base);
  const t = hexToRgb(target);
  return rgbToHex({
    r: Math.round(b.r + (t.r - b.r) * amount),
    g: Math.round(b.g + (t.g - b.g) * amount),
    b: Math.round(b.b + (t.b - b.b) * amount),
  });
}

export function useAppTheme() {
  const background = useConfigStore((s) => s.config.background) as HexColor;
  const foreground = useConfigStore((s) => s.config.foreground) as HexColor;
  const palette = useConfigStore((s) => s.config.palette) as HexColor[];
  const hydrated = useConfigStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated || !background || !foreground) return;

    const dark = isDark(background);
    // For light themes, step is negative (darken for depth); for dark, positive (lighten)
    const step = dark ? 8 : -8;
    const accent = palette?.[4] || "#81a2be";
    const danger = palette?.[1] || "#f25f58";
    const success = palette?.[2] || "#58cb42";
    const warning = palette?.[3] || "#fbbe3c";
    // Overlay tint: white for dark themes, black for light
    const overlayColor = dark ? "255, 255, 255" : "0, 0, 0";

    // Sidebar: slightly offset from main background, with transparency for blur
    const sidebarBase = adjustBrightness(background, dark ? -10 : -15);
    const { r: sr, g: sg, b: sb } = hexToRgb(sidebarBase);

    const vars: Record<string, string> = {
      "--bg-level-1": background,
      "--bg-level-2": adjustBrightness(background, step),
      "--bg-level-3": adjustBrightness(background, step * 2),
      "--bg-level-4": adjustBrightness(background, step * 3),
      "--bg-separator": adjustBrightness(background, step * 2),
      "--bg-input-focus": adjustBrightness(background, dark ? -15 : 15),
      "--bg-modal": adjustBrightness(background, dark ? -10 : -5),
      "--bg-basic-button": adjustBrightness(background, step * 6),
      "--bg-stepper": adjustBrightness(background, step * 5),
      "--bg-handle": adjustBrightness(background, step * 4),

      "--sidebar-bg": `rgba(${sr}, ${sg}, ${sb}, 0.85)`,

      "--border-level-1": dark
        ? adjustBrightness(background, -20)
        : adjustBrightness(background, -30),
      "--border-level-2": adjustBrightness(background, step * 5),
      "--border-level-3": adjustBrightness(background, step * 4),
      "--border-level-4": adjustBrightness(background, step * 3),
      "--border-separator": adjustBrightness(background, step),
      "--border-input": adjustBrightness(background, step * 4),

      "--font-color": foreground,
      "--font-color-muted": blendToward(foreground, background, 0.4),
      "--input-icon-color": foreground,

      "--font-color-accent": accent,
      "--color-selected": withAlpha(accent, dark ? 0.3 : 0.2),
      "--color-input-accent": accent,
      "--switch-checked-color": accent,
      "--switch-body-color": adjustBrightness(background, step * 4),

      "--color-danger": danger,
      "--color-success": success,
      "--color-warning": warning,
      "--color-on-accent": dark ? "#ffffff" : "#ffffff",
      "--toast-success-bg": withAlpha(success, dark ? 0.15 : 0.1),
      "--toast-error-bg": withAlpha(danger, dark ? 0.15 : 0.1),
      "--overlay-rgb": overlayColor,

      "--scrollbar-bg": adjustBrightness(background, dark ? -30 : -20),
      "--scrollbar-thumb": blendToward(foreground, background, 0.6),
    };

    const root = document.documentElement;
    for (const [prop, val] of Object.entries(vars)) {
      root.style.setProperty(prop, val);
    }

    return () => {
      for (const prop of Object.keys(vars)) {
        root.style.removeProperty(prop);
      }
    };
  }, [background, foreground, palette, hydrated]);
}
