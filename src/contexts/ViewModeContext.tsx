import { createContext, useContext, useEffect, useState } from "react";

// Grid-only mode - list view deprecated
type ViewMode = "grid";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("grid");

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem("stickee-default-view", mode);
  };

  useEffect(() => {
    const savedView = localStorage.getItem("stickee-default-view") as ViewMode;
    if (savedView && savedView === "grid") {
      setViewModeState(savedView);
    } else {
      // Default to grid view for all users
      setViewModeState("grid");
      localStorage.setItem("stickee-default-view", "grid");
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "stickee-default-view" && e.newValue === "grid") {
        setViewModeState(e.newValue as ViewMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
