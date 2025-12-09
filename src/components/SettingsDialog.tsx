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

type FontFamily = "serif" | "sans-serif" | "monospace" | "give-you-glory" | 
  "annie-use-your-telescope" | "nothing-you-could-do" | "oooh-baby" | "over-the-rainbow" | 
  "pangolin" | "autour-one" | "permanent-marker" | "reenie-beanie" | "rock-salt" | 
  "schoolbell" | "sedgwick-ave" | "shadows-into-light" | "short-stack" | "shantell-sans" | 
  "solitreo" | "sue-ellen-francisco" | "sunshiney" | "swanky-and-moo-moo" | "the-girl-next-door" | 
  "tillana" | "unkempt" | "waiting-for-the-sunrise" | "beth-ellen" | "homemade-apple" | 
  "zeyada" | "cedarville-cursive" | "coming-soon" | "covered-by-your-grace" | "crafty-girls" | 
  "comforter" | "indie-flower";

type FontMode = "basic" | "handwriting";
type ViewMode = "grid" | "list";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [fontMode, setFontMode] = useState<FontMode>("basic");
  const [fontFamily, setFontFamily] = useState<FontFamily>("indie-flower");
  const [defaultView, setDefaultView] = useState<ViewMode>("grid");

  // Preload common Google Fonts
  const preloadGoogleFonts = () => {
    const allFonts = [
      'Indie+Flower',
      'Give+You+Glory',
      'Permanent+Marker',
      'Rock+Salt',
      'Shadows+Into+Light',
      'Sue+Ellen+Francisco',
      'Annie+Use+Your+Telescope',
      'Nothing+You+Could+Do',
      'Oooh+Baby',
      'Over+the+Rainbow',
      'Pangolin',
      'Autour+One',
      'Reenie+Beanie',
      'Schoolbell',
      'Sedgwick+Ave',
      'Short+Stack',
      'Shantell+Sans',
      'Solitreo',
      'Sunshiney',
      'Swanky+and+Moo+Moo',
      'The+Girl+Next+Door',
      'Tillana',
      'Unkempt',
      'Waiting+for+the+Sunrise',
      'Beth+Ellen',
      'Homemade+Apple',
      'Zeyada',
      'Cedarville+Cursive',
      'Coming+Soon',
      'Covered+By+Your+Grace',
      'Crafty+Girls',
      'Comforter'
    ];
    
    allFonts.forEach(fontName => {
      const existingLink = document.querySelector(`link[href*="${fontName}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    });
  };

  useEffect(() => {
    preloadGoogleFonts();
    
    const savedFont = localStorage.getItem("stickee-font-family") as FontFamily;
    const savedFontMode = localStorage.getItem("stickee-font-mode") as FontMode;
    
    if (savedFontMode) {
      setFontMode(savedFontMode);
    }
    
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
    let fontValue = '';
    
    switch (font) {
      case "serif":
        fontValue = 'Georgia, serif';
        break;
      case "sans-serif":
        fontValue = 'Arial, sans-serif';
        break;
      case "monospace":
        fontValue = 'Courier New, monospace';
        break;
      case "give-you-glory":
        fontValue = '"Give You Glory", cursive';
        break;
      case "annie-use-your-telescope":
        fontValue = '"Annie Use Your Telescope", cursive';
        break;
      case "nothing-you-could-do":
        fontValue = '"Nothing You Could Do", cursive';
        break;
      case "oooh-baby":
        fontValue = '"Oooh Baby", cursive';
        break;
      case "over-the-rainbow":
        fontValue = '"Over the Rainbow", cursive';
        break;
      case "pangolin":
        fontValue = 'Pangolin, cursive';
        break;
      case "autour-one":
        fontValue = '"Autour One", cursive';
        break;
      case "permanent-marker":
        fontValue = '"Permanent Marker", cursive';
        break;
      case "reenie-beanie":
        fontValue = '"Reenie Beanie", cursive';
        break;
      case "rock-salt":
        fontValue = '"Rock Salt", cursive';
        break;
      case "schoolbell":
        fontValue = '"Schoolbell", cursive';
        break;
      case "sedgwick-ave":
        fontValue = '"Sedgwick Ave", cursive';
        break;
      case "shadows-into-light":
        fontValue = '"Shadows Into Light", cursive';
        break;
      case "short-stack":
        fontValue = '"Short Stack", cursive';
        break;
      case "shantell-sans":
        fontValue = '"Shantell Sans", cursive';
        break;
      case "solitreo":
        fontValue = 'Solitreo, cursive';
        break;
      case "sue-ellen-francisco":
        fontValue = '"Sue Ellen Francisco", cursive';
        break;
      case "sunshiney":
        fontValue = 'Sunshiney, cursive';
        break;
      case "swanky-and-moo-moo":
        fontValue = '"Swanky and Moo Moo", cursive';
        break;
      case "the-girl-next-door":
        fontValue = '"The Girl Next Door", cursive';
        break;
      case "tillana":
        fontValue = 'Tillana, cursive';
        break;
      case "unkempt":
        fontValue = 'Unkempt, cursive';
        break;
      case "waiting-for-the-sunrise":
        fontValue = '"Waiting for the Sunrise", cursive';
        break;
      case "beth-ellen":
        fontValue = '"Beth Ellen", cursive';
        break;
      case "homemade-apple":
        fontValue = '"Homemade Apple", cursive';
        break;
      case "zeyada":
        fontValue = 'Zeyada, cursive';
        break;
      case "cedarville-cursive":
        fontValue = '"Cedarville Cursive", cursive';
        break;
      case "coming-soon":
        fontValue = '"Coming Soon", cursive';
        break;
      case "covered-by-your-grace":
        fontValue = '"Covered By Your Grace", cursive';
        break;
      case "crafty-girls":
        fontValue = '"Crafty Girls", cursive';
        break;
      case "comforter":
        fontValue = 'Comforter, cursive';
        break;
      default: // indie-flower
        fontValue = 'Indie Flower, cursive';
    }
    
    // Load Google Font if needed
    if (font !== "serif" && font !== "sans-serif" && font !== "monospace") {
      // Check if font is already loaded
      const fontName = font.replace(/-/g, '+');
      const existingLink = document.querySelector(`link[href*="${fontName}"]`);
      
      if (!existingLink) {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    }
    
    root.style.setProperty('--font-family-base', fontValue);
    root.style.setProperty('--font-family-handwriting', fontValue);
  };

  const handleFontChange = (value: FontFamily) => {
    setFontFamily(value);
    localStorage.setItem("stickee-font-family", value);
    applyFontFamily(value);
  };

  const handleFontModeChange = (mode: FontMode) => {
    setFontMode(mode);
    localStorage.setItem("stickee-font-mode", mode);
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
            <RadioGroup value={fontMode} onValueChange={handleFontModeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic" className="text-lg">
                  Basic Fonts
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="handwriting" id="handwriting" />
                <Label htmlFor="handwriting" className="text-lg" style={{ fontFamily: "'Indie Flower', cursive" }}>
                  Handwriting Fonts
                </Label>
              </div>
            </RadioGroup>
            
            {fontMode === "basic" && (
              <div className="ml-6 space-y-2">
                <RadioGroup value={fontFamily} onValueChange={handleFontChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="serif" id="serif" />
                    <Label htmlFor="serif" className="font-serif text-lg">
                      Serif (Better readability)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sans-serif" id="sans-serif" />
                    <Label htmlFor="sans-serif" className="text-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
                      Sans-serif (Clean modern)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monospace" id="monospace" />
                    <Label htmlFor="monospace" className="text-lg" style={{ fontFamily: 'Courier New, monospace' }}>
                      Monospace (Code style)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="give-you-glory" id="give-you-glory" />
                    <Label htmlFor="give-you-glory" className="text-lg" style={{ fontFamily: '"Give You Glory", cursive' }}>
                      Give You Glory (Decorative)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {fontMode === "handwriting" && (
              <div className="ml-6 space-y-2 max-h-60 overflow-y-auto">
                <RadioGroup value={fontFamily} onValueChange={handleFontChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indie-flower" id="indie-flower" />
                    <Label htmlFor="indie-flower" className="text-lg" style={{ fontFamily: "'Indie Flower', cursive" }}>
                      Indie Flower (Default)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="annie-use-your-telescope" id="annie-use-your-telescope" />
                    <Label htmlFor="annie-use-your-telescope" className="text-lg" style={{ fontFamily: '"Annie Use Your Telescope", cursive' }}>
                      Annie Use Your Telescope
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nothing-you-could-do" id="nothing-you-could-do" />
                    <Label htmlFor="nothing-you-could-do" className="text-lg" style={{ fontFamily: '"Nothing You Could Do", cursive' }}>
                      Nothing You Could Do
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oooh-baby" id="oooh-baby" />
                    <Label htmlFor="oooh-baby" className="text-lg" style={{ fontFamily: '"Oooh Baby", cursive' }}>
                      Oooh Baby
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="over-the-rainbow" id="over-the-rainbow" />
                    <Label htmlFor="over-the-rainbow" className="text-lg" style={{ fontFamily: '"Over the Rainbow", cursive' }}>
                      Over the Rainbow
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pangolin" id="pangolin" />
                    <Label htmlFor="pangolin" className="text-lg" style={{ fontFamily: 'Pangolin, cursive' }}>
                      Pangolin
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="autour-one" id="autour-one" />
                    <Label htmlFor="autour-one" className="text-lg" style={{ fontFamily: '"Autour One", cursive' }}>
                      Autour One
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="permanent-marker" id="permanent-marker" />
                    <Label htmlFor="permanent-marker" className="text-lg" style={{ fontFamily: '"Permanent Marker", cursive' }}>
                      Permanent Marker
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reenie-beanie" id="reenie-beanie" />
                    <Label htmlFor="reenie-beanie" className="text-lg" style={{ fontFamily: '"Reenie Beanie", cursive' }}>
                      Reenie Beanie
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rock-salt" id="rock-salt" />
                    <Label htmlFor="rock-salt" className="text-lg" style={{ fontFamily: '"Rock Salt", cursive' }}>
                      Rock Salt
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="schoolbell" id="schoolbell" />
                    <Label htmlFor="schoolbell" className="text-lg" style={{ fontFamily: '"Schoolbell", cursive' }}>
                      Schoolbell
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sedgwick-ave" id="sedgwick-ave" />
                    <Label htmlFor="sedgwick-ave" className="text-lg" style={{ fontFamily: '"Sedgwick Ave", cursive' }}>
                      Sedgwick Ave
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shadows-into-light" id="shadows-into-light" />
                    <Label htmlFor="shadows-into-light" className="text-lg" style={{ fontFamily: '"Shadows Into Light", cursive' }}>
                      Shadows Into Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short-stack" id="short-stack" />
                    <Label htmlFor="short-stack" className="text-lg" style={{ fontFamily: '"Short Stack", cursive' }}>
                      Short Stack
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shantell-sans" id="shantell-sans" />
                    <Label htmlFor="shantell-sans" className="text-lg" style={{ fontFamily: '"Shantell Sans", cursive' }}>
                      Shantell Sans
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solitreo" id="solitreo" />
                    <Label htmlFor="solitreo" className="text-lg" style={{ fontFamily: 'Solitreo, cursive' }}>
                      Solitreo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sue-ellen-francisco" id="sue-ellen-francisco" />
                    <Label htmlFor="sue-ellen-francisco" className="text-lg" style={{ fontFamily: '"Sue Ellen Francisco", cursive' }}>
                      Sue Ellen Francisco
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sunshiney" id="sunshiney" />
                    <Label htmlFor="sunshiney" className="text-lg" style={{ fontFamily: 'Sunshiney, cursive' }}>
                      Sunshiney
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="swanky-and-moo-moo" id="swanky-and-moo-moo" />
                    <Label htmlFor="swanky-and-moo-moo" className="text-lg" style={{ fontFamily: '"Swanky and Moo Moo", cursive' }}>
                      Swanky and Moo Moo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="the-girl-next-door" id="the-girl-next-door" />
                    <Label htmlFor="the-girl-next-door" className="text-lg" style={{ fontFamily: '"The Girl Next Door", cursive' }}>
                      The Girl Next Door
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tillana" id="tillana" />
                    <Label htmlFor="tillana" className="text-lg" style={{ fontFamily: 'Tillana, cursive' }}>
                      Tillana
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unkempt" id="unkempt" />
                    <Label htmlFor="unkempt" className="text-lg" style={{ fontFamily: 'Unkempt, cursive' }}>
                      Unkempt
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="waiting-for-the-sunrise" id="waiting-for-the-sunrise" />
                    <Label htmlFor="waiting-for-the-sunrise" className="text-lg" style={{ fontFamily: '"Waiting for the Sunrise", cursive' }}>
                      Waiting for the Sunrise
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beth-ellen" id="beth-ellen" />
                    <Label htmlFor="beth-ellen" className="text-lg" style={{ fontFamily: '"Beth Ellen", cursive' }}>
                      Beth Ellen
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="homemade-apple" id="homemade-apple" />
                    <Label htmlFor="homemade-apple" className="text-lg" style={{ fontFamily: '"Homemade Apple", cursive' }}>
                      Homemade Apple
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zeyada" id="zeyada" />
                    <Label htmlFor="zeyada" className="text-lg" style={{ fontFamily: 'Zeyada, cursive' }}>
                      Zeyada
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cedarville-cursive" id="cedarville-cursive" />
                    <Label htmlFor="cedarville-cursive" className="text-lg" style={{ fontFamily: '"Cedarville Cursive", cursive' }}>
                      Cedarville Cursive
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="coming-soon" id="coming-soon" />
                    <Label htmlFor="coming-soon" className="text-lg" style={{ fontFamily: '"Coming Soon", cursive' }}>
                      Coming Soon
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="covered-by-your-grace" id="covered-by-your-grace" />
                    <Label htmlFor="covered-by-your-grace" className="text-lg" style={{ fontFamily: '"Covered By Your Grace", cursive' }}>
                      Covered By Your Grace
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="crafty-girls" id="crafty-girls" />
                    <Label htmlFor="crafty-girls" className="text-lg" style={{ fontFamily: '"Crafty Girls", cursive' }}>
                      Crafty Girls
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comforter" id="comforter" />
                    <Label htmlFor="comforter" className="text-lg" style={{ fontFamily: 'Comforter, cursive' }}>
                      Comforter
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
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
