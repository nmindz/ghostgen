import type { ReactNode } from "react";

interface ItemProps {
  name: string;
  note?: string;
  children: ReactNode;
}

export default function Item({ name, note, children }: ItemProps) {
  return (
    <div className="setting-item">
      <div className="setting-info">
        {name && <span className="setting-name">{name}</span>}
        {note && <span className="setting-note">{note}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}
