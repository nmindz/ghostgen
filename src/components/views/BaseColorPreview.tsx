import { useConfigStore } from "@/stores/config";

export default function BaseColorPreview() {
  const config = useConfigStore((s) => s.config);
  const bg = config.background as string;
  const fg = config.foreground as string;
  const selBg = (config.selectionBackground as string) || fg;
  const selFg = (config.selectionForeground as string) || bg;
  const palette = config.palette as string[];

  return (
    <div
      className="terminal-preview"
      style={{
        backgroundColor: bg,
        color: fg,
        fontFamily: (config.fontFamily as string) || "JetBrainsMono Nerd Font, monospace",
        fontSize: `${config.fontSize as number}px`,
      }}
    >
      <div>
        <span style={{ color: palette[2] }}>ghostty</span>
        <span style={{ color: fg }}>@</span>
        <span style={{ color: palette[4] }}>macos</span>
        <span style={{ color: fg }}>:~$ </span>
        <span style={{ color: palette[6] }}>eza -la --color=always --icons</span>
      </div>
      <div>
        <span style={{ color: palette[4] }}>drwx------</span>
        {"    - "}
        <span>ghostty</span>
        {" 22 Aug 13:42 "}
        <span style={{ color: palette[3] }}></span>
        {" .cache"}
      </div>
      <div style={{ backgroundColor: selBg, color: selFg }}>
        <span style={{ color: palette[4] }}>drwx------</span>
        {"    - "}
        <span>ghostty</span>
        {" 22 Aug 13:42 "}
        <span style={{ color: palette[3] }}></span>
        {" .config"}
      </div>
      <div>
        <span style={{ color: palette[4] }}>.rw-r--r--</span>
        {"   0 "}
        <span>ghostty</span>
        {"  7 May 11:11 "}
        <span style={{ color: palette[3] }}></span>
        {" .hushlogin"}
      </div>
      <div>
        <span style={{ color: palette[4] }}>.rw-------</span>
        {" 2.5k "}
        <span>ghostty</span>
        {"  2 Mar 02:49 "}
        <span style={{ color: palette[3] }}></span>
        {" .viminfo"}
      </div>
      <div>
        <span style={{ color: palette[6] }}>lrwxrwxrwx</span>
        {"    - "}
        <span>ghostty</span>
        {"  9 Feb 20:32 "}
        <span style={{ color: palette[3] }}></span>
        <span style={{ color: palette[6] }}>{" etc -> /etc"}</span>
      </div>
    </div>
  );
}
