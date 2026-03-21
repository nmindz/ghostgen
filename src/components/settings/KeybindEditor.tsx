import { useState } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

const MODIFIERS = ["super", "ctrl", "alt", "shift"] as const;

const COMMON_KEYS = [
  "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
  "0","1","2","3","4","5","6","7","8","9",
  "enter","space","tab","backspace","escape","delete",
  "arrow_up","arrow_down","arrow_left","arrow_right",
  "home","end","page_up","page_down",
  "f1","f2","f3","f4","f5","f6","f7","f8","f9","f10","f11","f12",
  "equal","minus","comma","period","slash","backslash","semicolon","quote",
  "bracket_left","bracket_right","backquote",
  "insert","pause","print_screen","caps_lock","scroll_lock",
];

const ACTIONS = [
  "copy_to_clipboard","paste_from_clipboard","paste_from_selection",
  "increase_font_size","decrease_font_size","reset_font_size","set_font_size",
  "scroll_page_up","scroll_page_down","scroll_to_top","scroll_to_bottom",
  "new_window","new_tab","previous_tab","next_tab","last_tab","goto_tab","close_surface","close_tab","close_window",
  "new_split:right","new_split:down","new_split:left","new_split:up","new_split:auto",
  "goto_split:right","goto_split:down","goto_split:left","goto_split:up","goto_split:previous","goto_split:next",
  "toggle_split_zoom","equalize_splits","resize_split",
  "toggle_fullscreen","toggle_maximize","toggle_window_decorations","toggle_window_float_on_top",
  "toggle_tab_overview","toggle_quick_terminal","toggle_visibility","toggle_background_opacity",
  "toggle_readonly","toggle_secure_input","toggle_mouse_reporting","toggle_command_palette",
  "open_config","reload_config",
  "select_all","search","start_search","end_search",
  "clear_screen","reset","quit",
  "jump_to_prompt","scroll_to_selection",
  "undo","redo",
  "csi","esc","text",
  "ignore","unbind",
];

function parseKeybind(kb: string): { trigger: string; action: string } {
  const eqIndex = kb.indexOf("=");
  if (eqIndex === -1) return { trigger: kb, action: "" };
  return { trigger: kb.substring(0, eqIndex), action: kb.substring(eqIndex + 1) };
}

function parseTrigger(trigger: string): { mods: string[]; key: string } {
  const parts = trigger.split("+");
  const key = parts.pop() || "";
  return { mods: parts, key };
}

interface KeybindRowProps {
  value: string;
  onSave: (newValue: string) => void;
  onDelete: () => void;
}

function KeybindRow({ value, onSave, onDelete }: KeybindRowProps) {
  const [editing, setEditing] = useState(false);
  const { trigger, action } = parseKeybind(value);
  const { mods, key } = parseTrigger(trigger);

  const [editMods, setEditMods] = useState<string[]>(mods);
  const [editKey, setEditKey] = useState(key);
  const [editAction, setEditAction] = useState(action);

  const startEdit = () => {
    const parsed = parseKeybind(value);
    const t = parseTrigger(parsed.trigger);
    setEditMods(t.mods);
    setEditKey(t.key);
    setEditAction(parsed.action);
    setEditing(true);
  };

  const save = () => {
    if (!editKey || !editAction) return;
    const trigger = [...editMods, editKey].join("+");
    onSave(`${trigger}=${editAction}`);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <div className="kb-row kb-row-editing">
        <div className="kb-edit-fields">
          <div className="kb-mods">
            {MODIFIERS.map((mod) => (
              <button
                key={mod}
                className={`kb-mod-btn ${editMods.includes(mod) ? "active" : ""}`}
                onClick={() => setEditMods((prev) =>
                  prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
                )}
              >
                {mod}
              </button>
            ))}
          </div>
          <select className="kb-select" value={editKey} onChange={(e) => setEditKey(e.target.value)}>
            <option value="">key…</option>
            {COMMON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <span className="kb-eq">=</span>
          <select className="kb-select kb-action-select" value={editAction} onChange={(e) => setEditAction(e.target.value)}>
            <option value="">action…</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="kb-edit-actions">
          <button className="kb-icon-btn kb-icon-confirm" onClick={save} title="Save"><Check size={14} /></button>
          <button className="kb-icon-btn" onClick={cancel} title="Cancel"><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="kb-row">
      <code className="kb-trigger">{trigger}</code>
      <span className="kb-eq">=</span>
      <code className="kb-action-text">{action}</code>
      <div className="kb-row-actions">
        <button className="kb-icon-btn" onClick={startEdit} title="Edit"><Pencil size={13} /></button>
        <button className="kb-icon-btn kb-icon-danger" onClick={onDelete} title="Delete"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

interface KeybindEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function KeybindEditor({ value, onChange }: KeybindEditorProps) {
  const [adding, setAdding] = useState(false);
  const [newMods, setNewMods] = useState<string[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newAction, setNewAction] = useState("");

  const handleAdd = () => {
    if (!newKey || !newAction) return;
    const trigger = [...newMods, newKey].join("+");
    onChange([...value, `${trigger}=${newAction}`]);
    setNewMods([]);
    setNewKey("");
    setNewAction("");
    setAdding(false);
  };

  const handleSave = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="kb-editor">
      {value.map((kb, i) => (
        <KeybindRow
          key={`${i}-${kb}`}
          value={kb}
          onSave={(v) => handleSave(i, v)}
          onDelete={() => handleDelete(i)}
        />
      ))}

      {adding ? (
        <div className="kb-row kb-row-editing">
          <div className="kb-edit-fields">
            <div className="kb-mods">
              {MODIFIERS.map((mod) => (
                <button
                  key={mod}
                  className={`kb-mod-btn ${newMods.includes(mod) ? "active" : ""}`}
                  onClick={() => setNewMods((prev) =>
                    prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
                  )}
                >
                  {mod}
                </button>
              ))}
            </div>
            <select className="kb-select" value={newKey} onChange={(e) => setNewKey(e.target.value)}>
              <option value="">key…</option>
              {COMMON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <span className="kb-eq">=</span>
            <select className="kb-select kb-action-select" value={newAction} onChange={(e) => setNewAction(e.target.value)}>
              <option value="">action…</option>
              {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="kb-edit-actions">
            <button className="kb-icon-btn kb-icon-confirm" onClick={handleAdd} title="Add"><Check size={14} /></button>
            <button className="kb-icon-btn" onClick={() => setAdding(false)} title="Cancel"><X size={14} /></button>
          </div>
        </div>
      ) : (
        <button className="kb-add-btn" onClick={() => setAdding(true)}>
          <Plus size={14} /> Add Keybind
        </button>
      )}
    </div>
  );
}
