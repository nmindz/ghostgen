import { useConfigStore } from "@/stores/config";
import { useState, useEffect } from "react";

export default function CursorPreview() {
  const config = useConfigStore((s) => s.config);
  const bg = config.background as string;
  const fg = config.foreground as string;
  const cursorColor = (config.cursorColor as string) || fg;
  const cursorStyle = config.cursorStyle as string;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  const cursorClass = `cursor-demo cursor-${cursorStyle} ${visible ? "visible" : "hidden"}`;

  return (
    <div
      className="terminal-preview cursor-preview"
      style={{ backgroundColor: bg, color: fg, fontFamily: "monospace" }}
    >
      <span>ghostty@macos:~$ echo "hello"</span>
      <div className="cursor-line">
        <span>ghostty@macos:~$ </span>
        <span className={cursorClass} style={{ backgroundColor: visible ? cursorColor : "transparent", borderColor: cursorColor }}>
          &nbsp;
        </span>
      </div>
    </div>
  );
}
