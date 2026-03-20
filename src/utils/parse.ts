export function parseConfig(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const palette: (string | null)[] = new Array(256).fill(null);
  const keybinds: string[] = [];
  let hasPalette = false;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.substring(0, eqIndex).trim();
    const value = line.substring(eqIndex + 1).trim();

    if (key === "palette") {
      const pEq = value.indexOf("=");
      if (pEq !== -1) {
        const index = parseInt(value.substring(0, pEq));
        palette[index] = value.substring(pEq + 1);
        hasPalette = true;
      }
      continue;
    }

    if (key === "keybind") {
      keybinds.push(value);
      continue;
    }

    const camelKey = key.replace(/-([a-z])/g, (_, c: string) =>
      c.toUpperCase()
    );

    if (value === "true") result[camelKey] = true;
    else if (value === "false") result[camelKey] = false;
    else if (!isNaN(Number(value)) && value !== "") result[camelKey] = Number(value);
    else result[camelKey] = value;
  }

  if (hasPalette) result.palette = palette;
  if (keybinds.length) result.keybind = keybinds;

  return result;
}

export function keyToConfigKey(key: string): string {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase();
}
