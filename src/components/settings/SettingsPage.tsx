import { useParams } from "react-router-dom";
import settings from "@/data/settings";
import { useConfigStore } from "@/stores/config";
import Page from "@/components/views/Page";
import Group from "./Group";
import Item from "./Item";
import Switch from "./Switch";
import TextInput from "./TextInput";
import NumberInput from "./NumberInput";
import Dropdown from "./Dropdown";
import ColorInput from "./ColorInput";
import PaletteGrid from "./Palette";
import ThemeDropdown from "./ThemeDropdown";
import KeybindEditor from "./KeybindEditor";
import FontFamilyInput from "./FontFamilyInput";
import FontFeatureInput from "./FontFeatureInput";

const FONT_FAMILY_IDS = new Set([
  "fontFamily", "fontFamilyBold", "fontFamilyItalic", "fontFamilyBoldItalic",
  "windowTitleFontFamily",
]);

const FONT_FEATURE_IDS = new Set(["fontFeature"]);
import PalettePreview from "@/components/views/PalettePreview";
import BaseColorPreview from "@/components/views/BaseColorPreview";
import CursorPreview from "@/components/views/CursorPreview";
import type { HexColor } from "@/utils/colors";

export default function SettingsPage() {
  const { category } = useParams<{ category: string }>();
  const config = useConfigStore((s) => s.config);
  const set = useConfigStore((s) => s.set);

  const panel = settings.find((p) => p.id === category);
  if (!panel) return <Page title="Not Found"><p>Category not found.</p></Page>;

  return (
    <Page title={panel.name}>
      {panel.groups.map((group) => (
        <Group key={group.id} name={group.name} note={group.note}>
          {/* Show previews for specific groups */}
          {category === "colors" && group.id === "base" && <BaseColorPreview />}
          {category === "colors" && group.id === "cursor" && <CursorPreview />}
          {category === "colors" && group.id === "palette" && <PalettePreview />}

          {group.settings.map((setting) => {
            const value = config[setting.id];

            if (setting.type === "palette") {
              return (
                <PaletteGrid
                  key={setting.id}
                  value={value as HexColor[]}
                  onChange={(v) => set(setting.id, v)}
                />
              );
            }

            if (setting.type === "keybinds") {
              return (
                <KeybindEditor
                  key={setting.id}
                  value={value as string[]}
                  onChange={(v) => set(setting.id, v)}
                />
              );
            }

            return (
              <Item key={setting.id} name={setting.name} note={setting.note}>
                {setting.type === "switch" && (
                  <Switch
                    value={value as boolean}
                    onChange={(v) => set(setting.id, v)}
                  />
                )}
                {setting.type === "text" && FONT_FAMILY_IDS.has(setting.id) && (
                  <FontFamilyInput
                    value={value as string}
                    onChange={(v) => set(setting.id, v)}
                    placeholder={setting.placeholder}
                  />
                )}
                {setting.type === "text" && FONT_FEATURE_IDS.has(setting.id) && (
                  <FontFeatureInput
                    value={value as string}
                    onChange={(v) => set(setting.id, v)}
                    placeholder={setting.placeholder}
                  />
                )}
                {setting.type === "text" && !FONT_FAMILY_IDS.has(setting.id) && !FONT_FEATURE_IDS.has(setting.id) && (
                  <TextInput
                    value={value as string}
                    onChange={(v) => set(setting.id, v)}
                    placeholder={setting.placeholder}
                  />
                )}
                {setting.type === "number" && (
                  <NumberInput
                    value={value as number | undefined}
                    onChange={(v) => set(setting.id, v)}
                    min={setting.min}
                    max={setting.max}
                    step={setting.step}
                    size={setting.size}
                    range={setting.range}
                    placeholder={setting.placeholder}
                  />
                )}
                {setting.type === "dropdown" && (
                  <Dropdown
                    value={value as string}
                    onChange={(v) => set(setting.id, v)}
                    options={setting.options ?? []}
                    placeholder={setting.placeholder}
                  />
                )}
                {setting.type === "color" && (
                  <ColorInput
                    value={value as HexColor}
                    onChange={(v) => set(setting.id, v)}
                  />
                )}
                {setting.type === "theme" && (
                  <ThemeDropdown
                    value={value as string}
                    onChange={(v) => set(setting.id, v)}
                    options={setting.options ?? []}
                  />
                )}
              </Item>
            );
          })}
        </Group>
      ))}
    </Page>
  );
}
