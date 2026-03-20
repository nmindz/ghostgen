import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SaveButton from "@/components/SaveButton";

interface PageProps {
  title: string;
  children: ReactNode;
}

export default function Page({ title, children }: PageProps) {
  const navigate = useNavigate();

  return (
    <div className="page-view">
      <div className="page-header" data-tauri-drag-region>
        <div className="page-nav">
          <button className="nav-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button className="nav-btn" onClick={() => navigate(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
        <h1 className="page-title">{title}</h1>
        <div style={{ marginLeft: "auto" }}>
          <SaveButton />
        </div>
      </div>
      <div className="page-content">
        {children}
      </div>
    </div>
  );
}
