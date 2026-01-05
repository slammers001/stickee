import { createContext, useContext, useEffect } from "react";

// Grid-only mode - list view deprecated
interface ViewModeContextType {
  viewMode: "grid";
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  // Always grid view - list view deprecated
  const viewMode = "grid";

  useEffect(() => {
    // Ensure localStorage is set to grid view for backward compatibility
    localStorage.setItem("stickee-default-view", "grid");
  }, []);

  return (
    <ViewModeContext.Provider value={{ viewMode }}>
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
