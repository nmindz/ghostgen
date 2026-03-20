import type { ReactNode } from "react";

interface GroupProps {
  name: string;
  note?: string;
  children: ReactNode;
}

export default function Group({ name, note, children }: GroupProps) {
  return (
    <div className="settings-group">
      {name && <h2 className="group-name">{name}</h2>}
      {note && <p className="group-note">{note}</p>}
      <div className="group-items">{children}</div>
    </div>
  );
}
