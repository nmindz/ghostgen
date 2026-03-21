import { useLocation, useNavigate } from "react-router-dom";
import {
  AppWindow, Clipboard, PanelTop, Palette, Type, PenTool, Keyboard, Mouse,
  Monitor, Laptop, Apple, Github, ExternalLink, Ghost, ArrowLeftRight, Archive, Star, Paintbrush
} from "lucide-react";
import logoSrc from "../../assets/logo.png";
import type { ReactNode } from "react";

interface TabProps {
  route: string;
  icon: ReactNode;
  children: ReactNode;
  external?: boolean;
}

function Tab({ route, icon, children, external }: TabProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === route;

  if (external) {
    return (
      <a
        href={route}
        target="_blank"
        rel="noopener noreferrer"
        className="tab"
      >
        <span className="tab-icon">{icon}</span>
        <span className="tab-label">{children}</span>
        <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />
      </a>
    );
  }

  return (
    <button
      className={`tab ${isActive ? "active" : ""}`}
      onClick={() => navigate(route)}
    >
      <span className="tab-icon">{icon}</span>
      <span className="tab-label">{children}</span>
    </button>
  );
}

function Gap({ expand }: { expand?: boolean }) {
  return <div className={`sidebar-gap ${expand ? "expand" : ""}`} />;
}

export default function Sidebar() {
  return (
    <div id="sidebar">
      <div className="sidebar-header" data-tauri-drag-region>
        <div className="window-traffic-spacer" />
      </div>
      <div className="sidebar-brand" onClick={() => window.location.hash = "/"}>
        <img src={logoSrc} alt="Ghostgen" width={28} height={28} style={{ borderRadius: 6 }} />
        <div className="brand-text">
          <span className="brand-name">Ghostgen</span>
          <span className="brand-sub">Unofficial Tool</span>
        </div>
      </div>
      <nav id="categories">
        <Tab route="/settings/application" icon={<AppWindow size={18} />}>Application</Tab>
        <Tab route="/settings/clipboard" icon={<Clipboard size={18} />}>Clipboard</Tab>
        <Tab route="/settings/window" icon={<PanelTop size={18} />}>Window</Tab>
        <Gap />
        <Tab route="/settings/colors" icon={<Palette size={18} />}>Colors</Tab>
        <Tab route="/theme-studio" icon={<Paintbrush size={18} />}>Theme Studio</Tab>
        <Tab route="/settings/fonts" icon={<Type size={18} />}>Fonts</Tab>
        <Tab route="/font-playground" icon={<PenTool size={18} />}>Font Playground</Tab>
        <Gap />
        <Tab route="/settings/keybinds" icon={<Keyboard size={18} />}>Keybinds</Tab>
        <Tab route="/settings/mouse" icon={<Mouse size={18} />}>Mouse</Tab>
        <Gap />
        <Tab route="/settings/gtk" icon={<Monitor size={18} />}>GTK</Tab>
        <Tab route="/settings/linux" icon={<Laptop size={18} />}>Linux</Tab>
        <Tab route="/settings/macos" icon={<Apple size={18} />}>macOS</Tab>
        <Gap />
        <Tab route="/import-export" icon={<ArrowLeftRight size={18} />}>Import / Export</Tab>
        <Tab route="/backups" icon={<Archive size={18} />}>Backups</Tab>
        <Gap expand />
        <Tab route="https://github.com/zerebos/ghostty-config" icon={<Star size={18} />} external>Thanks</Tab>
        <Tab route="https://github.com/nmindz/ghostgen" icon={<Github size={18} />} external>GitHub</Tab>
        <Tab route="https://ghostty.org/" icon={<Ghost size={18} />} external>Ghostty</Tab>
      </nav>
    </div>
  );
}
