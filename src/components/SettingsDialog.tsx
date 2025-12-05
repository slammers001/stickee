import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";

type FontFamily = "handwriting" | "serif";
type ViewMode = "grid" | "list";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [fontFamily, setFontFamily] = useState<FontFamily>("handwriting");
  const [defaultView, setDefaultView] = useState<ViewMode>("grid");

  useEffect(() => {
    const savedFont = localStorage.getItem("stickee-font-family") as FontFamily;
    if (savedFont) {
      setFontFamily(savedFont);
      applyFontFamily(savedFont);
    }
    
    const savedView = localStorage.getItem("stickee-default-view") as ViewMode;
    if (savedView) {
      setDefaultView(savedView);
    }
  }, []);

  const applyFontFamily = (font: FontFamily) => {
    const root = document.documentElement;
    if (font === "serif") {
      root.style.setProperty('--font-family-base', 'Georgia, serif');
      root.style.setProperty('--font-family-handwriting', 'Georgia, serif');
    } else {
      root.style.setProperty('--font-family-base', 'Indie Flower, cursive');
      root.style.setProperty('--font-family-handwriting', 'Indie Flower, cursive');
    }
  };

  const handleFontChange = (value: FontFamily) => {
    setFontFamily(value);
    localStorage.setItem("stickee-font-family", value);
    applyFontFamily(value);
  };

  const handleViewChange = (value: ViewMode) => {
    setDefaultView(value);
    localStorage.setItem("stickee-default-view", value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Stickee experience
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Theme</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">Toggle between light and dark theme</span>
              <ThemeToggle />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Font Family</h3>
            <RadioGroup value={fontFamily} onValueChange={handleFontChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="handwriting" id="handwriting" />
                <Label htmlFor="handwriting" className="text-lg" style={{ fontFamily: "'Indie Flower', cursive" }}>
                  Handwriting (Default)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="serif" id="serif" />
                <Label htmlFor="serif" className="font-serif text-lg">
                  Serif (Better readability)
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Default View</h3>
            <RadioGroup value={defaultView} onValueChange={handleViewChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid" id="grid" />
                <Label htmlFor="grid">
                  Notes (Grid view)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="list" id="list" />
                <Label htmlFor="list">
                  List (Compact view)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            By using this app you agree to the Terms of Service
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SettingsButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </Dialog>
  );
};
