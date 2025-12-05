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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [fontFamily, setFontFamily] = useState<FontFamily>("handwriting");

  useEffect(() => {
    const savedFont = localStorage.getItem("stickee-font-family") as FontFamily;
    if (savedFont) {
      setFontFamily(savedFont);
      applyFontFamily(savedFont);
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
