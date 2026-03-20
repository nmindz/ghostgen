import type { HexColor } from "@/utils/colors";

export interface BaseSettingType {
  id: string;
  name: string;
  note?: string;
}

export interface Panel extends BaseSettingType {
  groups: Group[];
}

export interface Group extends BaseSettingType {
  settings: SettingItem[];
}

export type SettingType =
  | "switch"
  | "number"
  | "dropdown"
  | "text"
  | "color"
  | "palette"
  | "keybinds"
  | "theme";

export interface SettingItem extends BaseSettingType {
  type: SettingType;
  value?: unknown;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  range?: boolean;
  placeholder?: string;
  options?: Array<{ name: string; value: string } | string>;
  disabled?: boolean;
}

export type KeybindString = `${string}=${string}`;

export interface ColorScheme {
  palette: HexColor[];
  background?: HexColor;
  foreground?: HexColor;
  cursorColor?: HexColor;
  selectionBackground?: HexColor;
  selectionForeground?: HexColor;
}

export const fetchColorScheme = async (theme: string): Promise<string> => {
  const response = await fetch(
    `https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/ghostty/${theme}`
  );
  if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`);
  return await response.text();
};

const getOS = () => {
  const platform = navigator.userAgent?.toLowerCase();
  if (platform.includes("linux")) return "linux";
  if (platform.includes("mac")) return "macos";
  return "other";
};

const settings: Panel[] = [
  {
    id: "application",
    name: "Application",
    groups: [
      {
        id: "general",
        name: "",
        settings: [
          { id: "title", name: "Static title for all windows", type: "text", value: "" },
          { id: "desktopNotifications", name: "Allow desktop notifications", type: "switch", value: true },
          { id: "configFile", name: "Additional config file", type: "text", value: "" },
          { id: "configDefaultFiles", name: "Load default config file", type: "switch", value: true },
          { id: "linkUrl", name: "Automatically link URLs", type: "switch", value: true },
          { id: "linkPreviews", name: "Show link previews", type: "dropdown", value: "true", options: ["true", "false", "osc8"] },
          { id: "undoTimeout", name: "Undo timeout", note: "Format like `1h30m`, `5s`, `500ms`.", type: "text", value: "" },
        ],
      },
      {
        id: "startup",
        name: "Startup",
        settings: [
          { id: "command", name: "Command to run on launch", type: "text", value: "" },
          { id: "initialCommand", name: "Command to run on first launch", type: "text", value: "" },
          { id: "env", name: "Environment variables", type: "text", value: "" },
          { id: "maximize", name: "Launch as maximized window", type: "switch", value: false },
          { id: "fullscreen", name: "Launch in fullscreen mode", type: "switch", value: false },
          { id: "initialWindow", name: "Show a window on startup", type: "switch", value: true },
          { id: "workingDirectory", name: "Directory to use after startup", type: "text", value: "" },
        ],
      },
      {
        id: "shutdown",
        name: "Shutdown",
        settings: [
          { id: "waitAfterCommand", name: "Wait for input after command", type: "switch", value: false },
          { id: "abnormalCommandExitRuntime", name: "Abnormal command exit runtime", type: "number", value: 250, min: 0, size: 5 },
          { id: "confirmCloseSurface", name: "Confirm when closing a surface", type: "dropdown", value: "true", options: ["true", "false", "always"] },
          { id: "quitAfterLastWindowClosed", name: "Quit after closing last window", type: "switch", value: false },
        ],
      },
      {
        id: "shell",
        name: "Shell Integration",
        settings: [
          { id: "shellIntegration", name: "Shell integration style", type: "dropdown", value: "detect", options: ["none", "detect", "bash", "elvish", "fish", "nushell", "zsh"] },
          { id: "shellIntegrationFeatures", name: "Shell integration features", type: "text", value: "cursor,no-sudo,title,no-ssh-env,no-ssh-terminfo,path" },
          { id: "term", name: "TERM environment variable", type: "text", value: "xterm-ghostty" },
        ],
      },
      {
        id: "quick",
        name: "Quick Terminal",
        settings: [
          { id: "quickTerminalPosition", name: "Terminal position", type: "dropdown", value: "top", options: ["top", "right", "bottom", "left", "center"] },
          { id: "quickTerminalScreen", name: "Screen location", type: "dropdown", value: "main", options: ["main", "mouse", "macos-menu-bar"] },
          { id: "quickTerminalAnimationDuration", name: "Animation duration", type: "number", value: 0.2, min: 0, max: 10, step: 0.1, range: true },
          { id: "quickTerminalAutohide", name: "Autohide", type: "switch", value: true },
        ],
      },
      {
        id: "advanced",
        name: "Advanced",
        note: "You should only touch these settings if you know what you're doing!",
        settings: [
          { id: "scrollbackLimit", name: "Scrollback buffer size (bytes)", type: "number", value: 10000000, min: 0, size: 10 },
          { id: "customShader", name: "Custom shader", type: "text", value: "" },
          { id: "customShaderAnimation", name: "Allow shaders to animate", type: "dropdown", value: "true", options: ["false", "true", "always"] },
          { id: "oscColorReportFormat", name: "OSC color report format", type: "dropdown", value: "16-bit", options: ["none", "8-bit", "16-bit"] },
          { id: "imageStorageLimit", name: "Image buffer limit (bytes)", type: "number", value: 320000000, min: 0, max: 4294967295, size: 12 },
        ],
      },
    ],
  },
  {
    id: "clipboard",
    name: "Clipboard",
    groups: [
      {
        id: "main",
        name: "",
        settings: [
          { id: "clipboardRead", name: "Allow terminal to read clipboard", type: "dropdown", value: "ask", options: ["ask", "allow", "deny"] },
          { id: "clipboardWrite", name: "Allow terminal to write clipboard", type: "dropdown", value: "allow", options: ["ask", "allow", "deny"] },
          { id: "copyOnSelect", name: "Copy on select", type: "dropdown", value: getOS() === "linux" ? "true" : "false", options: ["true", "false", "clipboard"] },
          { id: "clipboardTrimTrailingSpaces", name: "Trim trailing space on copy", type: "switch", value: true },
          { id: "clipboardPasteProtection", name: "Confirm when pasting unsafely", type: "switch", value: true },
          { id: "clipboardPasteBracketedSafe", name: "Mark bracketed paste as safe", type: "switch", value: true },
        ],
      },
    ],
  },
  {
    id: "window",
    name: "Window",
    groups: [
      {
        id: "main",
        name: "",
        settings: [
          { id: "windowTitleFontFamily", name: "Window title font", type: "text", value: "" },
          { id: "windowSubtitle", name: "Window subtitle", type: "dropdown", value: "false", options: ["false", "working-directory"] },
          { id: "windowVsync", name: "Enable vsync", type: "switch", value: true },
          { id: "windowInheritWorkingDirectory", name: "Inherit working directory", type: "switch", value: true },
          { id: "windowInheritFontSize", name: "Inherit font size", type: "switch", value: true },
          { id: "windowColorspace", name: "Window colorspace", type: "dropdown", value: "srgb", options: ["srgb", "display-p3"] },
          { id: "windowSaveState", name: "Save window state", type: "dropdown", value: "default", options: ["default", "never", "always"] },
          { id: "windowShowTabBar", name: "Show tab bar", type: "dropdown", value: "auto", options: ["always", "auto", "never"] },
          { id: "windowNewTabPosition", name: "New tab position", type: "dropdown", value: "current", options: ["current", "end"] },
        ],
      },
      {
        id: "appearance",
        name: "Appearance",
        settings: [
          { id: "windowTheme", name: "Window theme", type: "dropdown", value: "auto", options: ["auto", "system", "light", "dark", "ghostty"] },
          { id: "windowDecoration", name: "Window decorations", type: "dropdown", value: "auto", options: ["auto", "none", "client", "server"] },
          { id: "windowPaddingX", name: "Horizontal window padding", type: "text", value: "2" },
          { id: "windowPaddingY", name: "Vertical window padding", type: "text", value: "2" },
          { id: "windowPaddingBalance", name: "Auto-balance window padding", type: "switch", value: false },
          { id: "backgroundOpacity", name: "Background opacity", type: "number", range: true, value: 1, min: 0, max: 1, step: 0.01 },
          { id: "backgroundBlur", name: "Background blur", type: "text", value: "false" },
          { id: "unfocusedSplitOpacity", name: "Unfocused split opacity", type: "number", range: true, value: 0.7, min: 0.15, max: 1, step: 0.01 },
        ],
      },
      {
        id: "resize",
        name: "Sizing & Resizing",
        settings: [
          { id: "windowHeight", name: "Initial window height", note: "In terminal grid cells", type: "number", min: 4, step: 1, size: 4, placeholder: "e.g. 24" },
          { id: "windowWidth", name: "Initial window width", note: "In terminal grid cells", type: "number", min: 10, step: 1, size: 4, placeholder: "e.g. 80" },
          { id: "windowStepResize", name: "Resize in grid cell increments", type: "switch", value: false },
          { id: "resizeOverlay", name: "Show resize overlays", type: "dropdown", value: "after-first", options: ["always", "never", "after-first"] },
        ],
      },
    ],
  },
  {
    id: "colors",
    name: "Colors",
    groups: [
      {
        id: "general",
        name: "",
        settings: [
          {
            id: "theme",
            name: "Color theme",
            note: "Any colors selected after setting this will overwrite the theme's colors.",
            type: "theme",
            value: "",
            options: [{ name: "Custom", value: "" }],
          },
          { id: "minimumContrast", name: "Minimum contrast", type: "number", value: 1, range: true, min: 1, max: 21, step: 0.1 },
        ],
      },
      {
        id: "base",
        name: "Base Colors",
        settings: [
          { id: "background", name: "Background color", type: "color", value: "#282c34" },
          { id: "foreground", name: "Foreground color", type: "color", value: "#ffffff" },
          { id: "selectionBackground", name: "Selection background color", type: "color", value: "" },
          { id: "selectionForeground", name: "Selection foreground color", type: "color", value: "" },
        ],
      },
      {
        id: "cursor",
        name: "Cursor",
        settings: [
          { id: "cursorColor", name: "Cursor color", type: "color", value: "" },
          { id: "cursorText", name: "Text color under cursor", type: "color", value: "" },
          { id: "cursorOpacity", name: "Cursor opacity", type: "number", value: 1, range: true, min: 0, max: 1, step: 0.05 },
          { id: "cursorStyle", name: "Cursor style", type: "dropdown", value: "block", options: ["block", "bar", "underline", { value: "block_hollow", name: "hollow block" }] },
          { id: "cursorStyleBlink", name: "Cursor blink style", type: "dropdown", value: "", options: ["true", "false", { value: "", name: "default" }] },
        ],
      },
      {
        id: "palette",
        name: "Color Palette",
        note: "The first 16 colors are the most commonly displayed colors in the terminal.\n\nColors 1-8 are typically black, red, green, yellow, blue, magenta, cyan, and white.\nColors 9-16 are typically \"brighter\" variants of these colors.",
        settings: [
          {
            id: "palette",
            name: "",
            type: "palette",
            value: [
              "#1d1f21", "#cc6666", "#b5bd68", "#f0c674", "#81a2be", "#b294bb", "#8abeb7", "#c5c8c6",
              "#666666", "#d54e53", "#b9ca4a", "#e7c547", "#7aa6da", "#c397d8", "#70c0b1", "#eaeaea",
              "#000000", "#00005f", "#000087", "#0000af", "#0000d7", "#0000ff", "#005f00", "#005f5f",
              "#005f87", "#005faf", "#005fd7", "#005fff", "#008700", "#00875f", "#008787", "#0087af",
              "#0087d7", "#0087ff", "#00af00", "#00af5f", "#00af87", "#00afaf", "#00afd7", "#00afff",
              "#00d700", "#00d75f", "#00d787", "#00d7af", "#00d7d7", "#00d7ff", "#00ff00", "#00ff5f",
              "#00ff87", "#00ffaf", "#00ffd7", "#00ffff", "#5f0000", "#5f005f", "#5f0087", "#5f00af",
              "#5f00d7", "#5f00ff", "#5f5f00", "#5f5f5f", "#5f5f87", "#5f5faf", "#5f5fd7", "#5f5fff",
              "#5f8700", "#5f875f", "#5f8787", "#5f87af", "#5f87d7", "#5f87ff", "#5faf00", "#5faf5f",
              "#5faf87", "#5fafaf", "#5fafd7", "#5fafff", "#5fd700", "#5fd75f", "#5fd787", "#5fd7af",
              "#5fd7d7", "#5fd7ff", "#5fff00", "#5fff5f", "#5fff87", "#5fffaf", "#5fffd7", "#5fffff",
              "#870000", "#87005f", "#870087", "#8700af", "#8700d7", "#8700ff", "#875f00", "#875f5f",
              "#875f87", "#875faf", "#875fd7", "#875fff", "#878700", "#87875f", "#878787", "#8787af",
              "#8787d7", "#8787ff", "#87af00", "#87af5f", "#87af87", "#87afaf", "#87afd7", "#87afff",
              "#87d700", "#87d75f", "#87d787", "#87d7af", "#87d7d7", "#87d7ff", "#87ff00", "#87ff5f",
              "#87ff87", "#87ffaf", "#87ffd7", "#87ffff", "#af0000", "#af005f", "#af0087", "#af00af",
              "#af00d7", "#af00ff", "#af5f00", "#af5f5f", "#af5f87", "#af5faf", "#af5fd7", "#af5fff",
              "#af8700", "#af875f", "#af8787", "#af87af", "#af87d7", "#af87ff", "#afaf00", "#afaf5f",
              "#afaf87", "#afafaf", "#afafd7", "#afafff", "#afd700", "#afd75f", "#afd787", "#afd7af",
              "#afd7d7", "#afd7ff", "#afff00", "#afff5f", "#afff87", "#afffaf", "#afffd7", "#afffff",
              "#d70000", "#d7005f", "#d70087", "#d700af", "#d700d7", "#d700ff", "#d75f00", "#d75f5f",
              "#d75f87", "#d75faf", "#d75fd7", "#d75fff", "#d78700", "#d7875f", "#d78787", "#d787af",
              "#d787d7", "#d787ff", "#d7af00", "#d7af5f", "#d7af87", "#d7afaf", "#d7afd7", "#d7afff",
              "#d7d700", "#d7d75f", "#d7d787", "#d7d7af", "#d7d7d7", "#d7d7ff", "#d7ff00", "#d7ff5f",
              "#d7ff87", "#d7ffaf", "#d7ffd7", "#d7ffff", "#ff0000", "#ff005f", "#ff0087", "#ff00af",
              "#ff00d7", "#ff00ff", "#ff5f00", "#ff5f5f", "#ff5f87", "#ff5faf", "#ff5fd7", "#ff5fff",
              "#ff8700", "#ff875f", "#ff8787", "#ff87af", "#ff87d7", "#ff87ff", "#ffaf00", "#ffaf5f",
              "#ffaf87", "#ffafaf", "#ffafd7", "#ffafff", "#ffd700", "#ffd75f", "#ffd787", "#ffd7af",
              "#ffd7d7", "#ffd7ff", "#ffff00", "#ffff5f", "#ffff87", "#ffffaf", "#ffffd7", "#ffffff",
              "#080808", "#121212", "#1c1c1c", "#262626", "#303030", "#3a3a3a", "#444444", "#4e4e4e",
              "#585858", "#626262", "#6c6c6c", "#767676", "#808080", "#8a8a8a", "#949494", "#9e9e9e",
              "#a8a8a8", "#b2b2b2", "#bcbcbc", "#c6c6c6", "#d0d0d0", "#dadada", "#e4e4e4", "#eeeeee",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "fonts",
    name: "Fonts",
    groups: [
      {
        id: "general",
        name: "General Font Settings",
        settings: [
          { id: "fontSize", name: "Base font size", type: "number", value: 13, min: 4, max: 60, step: 0.5, range: true },
          { id: "fontThicken", name: "Thicken fonts", type: "switch", value: false },
          { id: "fontFeature", name: "Font ligature settings", type: "text", value: "" },
          { id: "alphaBlending", name: "Alpha blending colorspace", type: "dropdown", value: "native", options: ["native", "linear", "linear-corrected"] },
        ],
      },
      {
        id: "family",
        name: "Font Families",
        note: "By default Ghostty embeds and uses JetBrainsMono Nerd Font.",
        settings: [
          { id: "fontFamily", name: "Main font family", type: "text", value: "", placeholder: "JetBrainsMono NF" },
          { id: "fontFamilyBold", name: "Font family for bold text", type: "text", value: "" },
          { id: "fontFamilyItalic", name: "Font family for italic text", type: "text", value: "" },
          { id: "fontFamilyBoldItalic", name: "Font family for bold italic text", type: "text", value: "" },
        ],
      },
      {
        id: "styles",
        name: "Font Styles",
        settings: [
          { id: "fontStyle", name: "Main font style", type: "text", value: "default" },
          { id: "fontStyleBold", name: "Font style for bold text", type: "text", value: "default" },
          { id: "fontStyleItalic", name: "Font style for italic text", type: "text", value: "default" },
          { id: "fontStyleBoldItalic", name: "Font style for bold italic text", type: "text", value: "default" },
        ],
      },
    ],
  },
  {
    id: "keybinds",
    name: "Keybinds",
    groups: [
      {
        id: "keybinds",
        name: "",
        settings: [
          {
            id: "keybind",
            name: "",
            type: "keybinds",
            value: [
              "super+page_up=scroll_page_up",
              "super+c=copy_to_clipboard",
              "super+v=paste_from_clipboard",
              "super+t=new_tab",
              "super+w=close_surface",
              "super+n=new_window",
              "super+q=quit",
              "super+enter=toggle_fullscreen",
              "super+equal=increase_font_size:1",
              "super+minus=decrease_font_size:1",
              "super+0=reset_font_size",
              "super+d=new_split:right",
              "super+shift+d=new_split:down",
              "super+comma=open_config",
              "super+shift+comma=reload_config",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mouse",
    name: "Mouse",
    groups: [
      {
        id: "main",
        name: "",
        settings: [
          { id: "cursorClickToMove", name: "Enable click to move cursor", type: "switch", value: true },
          { id: "mouseHideWhileTyping", name: "Hide mouse while typing", type: "switch", value: false },
          { id: "mouseReporting", name: "Allow mouse reporting", type: "switch", value: true },
          { id: "mouseScrollMultiplier", name: "Mouse scroll multiplier", type: "number", range: true, value: 3, min: 0.1, max: 10, step: 0.1 },
          { id: "rightClickAction", name: "Right-click action", type: "dropdown", value: "context-menu", options: ["context-menu", "copy-or-paste", "copy", "paste", "ignore"] },
          { id: "focusFollowsMouse", name: "Focus splits on mouse move", type: "switch", value: false },
        ],
      },
    ],
  },
  {
    id: "gtk",
    name: "GTK",
    groups: [
      {
        id: "main",
        name: "",
        settings: [
          { id: "class", name: "WM_CLASS class field", type: "text", value: "" },
          { id: "gtkSingleInstance", name: "Single-instance mode", type: "dropdown", value: "detect", options: ["detect", "true", "false"] },
          { id: "gtkCustomCss", name: "Custom css file", type: "text", value: "" },
        ],
      },
      {
        id: "tabs",
        name: "Titlebar & Tabs",
        settings: [
          { id: "gtkToolbarStyle", name: "Toolbar style", type: "dropdown", value: "raised", options: ["raised", "flat", "raised-border"] },
          { id: "gtkTitlebarStyle", name: "Titlebar style", type: "dropdown", value: "native", options: ["native", "tabs"] },
          { id: "gtkTabsLocation", name: "Tab location", type: "dropdown", value: "top", options: ["top", "bottom"] },
          { id: "gtkWideTabs", name: "Use wide tabs", type: "switch", value: true },
          { id: "gtkTitlebar", name: "Show titlebar", type: "switch", value: true },
        ],
      },
    ],
  },
  {
    id: "linux",
    name: "Linux",
    groups: [
      {
        id: "main",
        name: "",
        settings: [
          { id: "asyncBackend", name: "Async backend", type: "dropdown", value: "auto", options: ["auto", "epoll", "io_uring"] },
          { id: "linuxCgroup", name: "Use dedicated cgroups", type: "dropdown", value: "single-instance", options: ["single-instance", "always", "never"] },
          { id: "linuxCgroupHardFail", name: "Hard fail on startup", type: "switch", value: false },
        ],
      },
    ],
  },
  {
    id: "macos",
    name: "macOS",
    groups: [
      {
        id: "main",
        name: "",
        settings: [
          { id: "macosNonNativeFullscreen", name: "Use non-native fullscreen", type: "dropdown", value: "false", options: ["visible-menu", "true", "false", "padded-notch"] },
          { id: "macosTitlebarStyle", name: "Titlebar style", type: "dropdown", value: "transparent", options: ["transparent", "native", "tabs", "hidden"] },
          { id: "macosOptionAsAlt", name: "Use option key as alt key", type: "dropdown", value: "", options: ["", "true", "false", "left", "right"] },
          { id: "macosWindowShadow", name: "Show the window shadow", type: "switch", value: true },
          { id: "macosWindowButtons", name: "Window buttons (traffic lights)", type: "dropdown", value: "visible", options: ["visible", "hidden"] },
          { id: "macosAutoSecureInput", name: "Auto secure input", type: "switch", value: true },
          { id: "macosIcon", name: "Icon", type: "dropdown", value: "official", options: ["official", "blueprint", "chalkboard", "microchip", "glass", "holographic", "paper", "retro", "xray", "custom", "custom-style"] },
          { id: "autoUpdate", name: "Auto update", type: "dropdown", value: "", options: ["", "off", "check", "download"] },
          { id: "autoUpdateChannel", name: "Update channel", type: "dropdown", value: "", options: ["", "stable", "tip"] },
        ],
      },
    ],
  },
];

// Fetch theme list and inject into settings
void (async () => {
  try {
    const response = await fetch(
      "https://api.github.com/repos/mbadolato/iTerm2-Color-Schemes/contents/ghostty"
    );
    if (!response.ok) return;
    const themeFiles = (await response.json()) as Array<{ name: string }>;
    const themeNames = themeFiles
      .map((f) => f.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
    const themeSetting = settings
      .find((p) => p.id === "colors")
      ?.groups.find((g) => g.id === "general")
      ?.settings.find((s) => s.type === "theme");
    if (themeSetting?.options) {
      themeSetting.options.push(...themeNames);
    }
  } catch {
    // silently fail
  }
})();

export default settings;
