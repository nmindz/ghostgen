import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import settings, { fetchColorScheme } from "@/data/settings";
import { parseConfig, keyToConfigKey } from "@/utils/parse";
import type { HexColor } from "@/utils/colors";

type ConfigState = Record<string, unknown>;

// Build defaults from settings schema
const defaults: ConfigState = {};
for (const panel of settings) {
  for (const group of panel.groups) {
    for (const setting of group.settings) {
      defaults[setting.id] = setting.value;
    }
  }
}

function configsEqual(a: ConfigState, b: ConfigState): boolean {
  for (const k in a) {
    if (Array.isArray(a[k]) && Array.isArray(b[k])) {
      const aa = a[k] as unknown[];
      const bb = b[k] as unknown[];
      if (aa.length !== bb.length) return false;
      for (let i = 0; i < aa.length; i++) {
        if (aa[i] !== bb[i]) return false;
      }
    } else if (a[k] !== b[k]) {
      return false;
    }
  }
  return true;
}

interface ConfigStore {
  config: ConfigState;
  defaults: ConfigState;
  diskConfig: ConfigState;
  isDirty: boolean;
  saving: boolean;
  hydrated: boolean;
  set: (key: string, value: unknown) => void;
  setMany: (updates: Record<string, unknown>) => void;
  load: (conf: Partial<ConfigState>) => void;
  diff: () => Record<string, unknown>;
  stringify: () => string;
  reset: () => void;
  hydrate: () => Promise<void>;
  save: () => Promise<void>;
  setColorScheme: (name: string) => Promise<boolean>;
  resetColorScheme: () => void;
}

function deepCloneConfig(config: ConfigState): ConfigState {
  const clone: ConfigState = {};
  for (const k in config) {
    clone[k] = Array.isArray(config[k]) ? [...(config[k] as unknown[])] : config[k];
  }
  return clone;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: { ...defaults },
  defaults,
  diskConfig: { ...defaults },
  isDirty: false,
  saving: false,
  hydrated: false,

  set: (key, value) =>
    set((state) => {
      const newConfig = { ...state.config, [key]: value };
      return { config: newConfig, isDirty: !configsEqual(newConfig, state.diskConfig) };
    }),

  setMany: (updates) =>
    set((state) => {
      const newConfig = { ...state.config, ...updates };
      return { config: newConfig, isDirty: !configsEqual(newConfig, state.diskConfig) };
    }),

  load: (conf) =>
    set((state) => {
      const newConfig = { ...state.config };
      for (const key in conf) {
        if (!(key in newConfig)) continue;
        if (key === "keybind") {
          newConfig.keybind = [
            ...(newConfig.keybind as string[]),
            ...(conf.keybind as string[]),
          ];
        } else if (key === "palette") {
          const palette = [...(newConfig.palette as HexColor[])];
          const incoming = conf.palette as (HexColor | null)[];
          for (let i = 0; i < incoming.length; i++) {
            if (incoming[i]) palette[i] = incoming[i]!;
          }
          newConfig.palette = palette;
        } else {
          newConfig[key] = conf[key];
        }
      }
      return { config: newConfig, isDirty: !configsEqual(newConfig, state.diskConfig) };
    }),

  diff: () => {
    const { config, defaults } = get();
    const output: Record<string, unknown> = {};
    for (const k in config) {
      if (Array.isArray(config[k]) && k === "keybind") {
        const toAdd = (config[k] as string[]).filter(
          (c) => !(defaults[k] as string[]).includes(c)
        );
        if (toAdd.length) output[keyToConfigKey(k)] = toAdd;
      } else if (Array.isArray(config[k]) && k === "palette") {
        const toAdd: string[] = [];
        const current = config[k] as HexColor[];
        const def = defaults[k] as HexColor[];
        for (let i = 0; i < def.length; i++) {
          if (current[i] !== def[i]) toAdd.push(`${i}=${current[i]}`);
        }
        if (toAdd.length) output[keyToConfigKey(k)] = toAdd;
      } else if (config[k] !== defaults[k]) {
        output[keyToConfigKey(k)] = config[k];
      }
    }
    return output;
  },

  stringify: () => {
    const d = get().diff();
    const lines: string[] = [];
    for (const [key, value] of Object.entries(d)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          lines.push(`${key} = ${item}`);
        }
      } else {
        lines.push(`${key} = ${value}`);
      }
    }
    return lines.join("\n");
  },

  reset: () => set((state) => ({
    config: { ...defaults },
    isDirty: !configsEqual(defaults, state.diskConfig),
  })),

  hydrate: async () => {
    try {
      const text = await invoke<string>("read_ghostty_config");
      if (text) {
        const parsed = parseConfig(text);
        const newConfig = { ...defaults };
        for (const key in parsed) {
          if (!(key in newConfig)) continue;
          if (key === "keybind") {
            newConfig.keybind = [
              ...(newConfig.keybind as string[]),
              ...(parsed.keybind as string[]),
            ];
          } else if (key === "palette") {
            const palette = [...(newConfig.palette as HexColor[])];
            const incoming = parsed.palette as (HexColor | null)[];
            for (let i = 0; i < incoming.length; i++) {
              if (incoming[i]) palette[i] = incoming[i]!;
            }
            newConfig.palette = palette;
          } else {
            newConfig[key] = parsed[key];
          }
        }
        set({
          config: newConfig,
          diskConfig: deepCloneConfig(newConfig),
          isDirty: false,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch (err) {
      console.error("Failed to load config:", err);
      set({ hydrated: true });
    }
  },

  save: async () => {
    const { stringify, config } = get();
    set({ saving: true });
    try {
      const content = stringify();
      await invoke("write_ghostty_config", { content });
      set({
        diskConfig: deepCloneConfig(config),
        isDirty: false,
        saving: false,
      });
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  setColorScheme: async (name) => {
    if (name === "") {
      get().resetColorScheme();
      return true;
    }
    try {
      const text = await fetchColorScheme(name);
      const parsed = parseConfig(text);
      get().load(parsed);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  resetColorScheme: () => {
    const { defaults, diskConfig } = get();
    const updates: Record<string, unknown> = {};
    for (const key of ["background", "foreground", "cursorColor", "selectionBackground", "selectionForeground"]) {
      updates[key] = defaults[key];
    }
    const palette = [...(defaults.palette as HexColor[])];
    updates.palette = palette;
    set((state) => {
      const newConfig = { ...state.config, ...updates };
      return { config: newConfig, isDirty: !configsEqual(newConfig, diskConfig) };
    });
  },
}));
