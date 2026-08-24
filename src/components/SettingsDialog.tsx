import { useState, useEffect } from "react";
import { Heart, Settings, Download, Sun, Moon, Monitor, Palette, Type, Bookmark, FileText, Database } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getFontSettings, saveFontSettings, updateCurrentFont, updateFavoriteFonts } from "@/services/fontSettingsService";
import { ensureUserExists } from "@/services/userService";
import { exportUserData, downloadExportFile, importUserData, validateImportFile } from "@/services/exportService";
import { TermsOfService } from "@/components/TermsOfService";
import { applyAppFont, getCssFontFamily, getFontDisplayName as getSharedFontDisplayName } from "@/utils/fonts";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

type FontFamily = "serif" | "sans-serif" | "monospace" | 
  "abeezee" | "aclonica" | "advent-pro" | "tenali-ramakrishna" | "truculenta" | "ubuntu-sans-mono" | "unbounded" | "nova-mono" | "orbitron" | "bahianita" | "syne-mono" | "vt323" | "xanh-mono" | "cutive-mono" | "arbutus-slab" | "nixie-one" | "noticia-text" | "arvo" | "oi" | "oldenburg" | "orelega-one" | "nova-oval" | "atma" | "butcherman" | "cherry-bomb-one" |
  "pangolin" | "autour-one" | "permanent-marker" | "reenie-beanie" | "rock-salt" | "shadows-into-light" | "short-stack" | "shantell-sans" | 
  "solitreo" | "sue-ellen-francisco" | "sunshiney" | "swanky-and-moo-moo" | "the-girl-next-door" | 
  "tillana" | "unkempt" | "waiting-for-the-sunrise" | "beth-ellen" | "homemade-apple" | 
  "zeyada" | "cedarville-cursive" | "coming-soon" | "covered-by-your-grace" | "crafty-girls" | "comforter" | "indie-flower" | "give-you-glory" | "oregano" | "protest-revolution" | "protest-riot" | "rancho" | "sarina" | "single-day" | "onest" |
  "anonymous-pro" | "annie-use-your-telescope" | "nothing-you-could-do" | "oooh-baby" | "over-the-rainbow" | "schoolbell" | "sedgwick-ave" |
  "architects-daughter" | "dawning-of-a-new-day" | "satisfy" | "josefin-sans" | "lato" | "open-sans" | "raleway" | "montserrat" | "ubuntu" | "gloock";

type FontMode = "basic" | "handwriting";

type ActiveTab = "ui" | "fonts" | "bookmarks" | "terms" | "data";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFontChange?: (font: string) => void;
}

export const SettingsDialog = ({ open, onOpenChange, onFontChange }: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();
  const [fontMode, setFontMode] = useState<FontMode>(() => 
    (localStorage.getItem("stickee-font-mode") as FontMode) || "basic"
  );
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => 
    (localStorage.getItem("stickee-font-family") as FontFamily) || "onest"
  );
  const [favoriteFonts, setFavoriteFonts] = useState<FontFamily[]>(() => 
    JSON.parse(localStorage.getItem("stickee-favorite-fonts") || "[]")
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("ui");
  const [importing, setImporting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Organized font arrays for lazy loading
  const basicFonts: FontFamily[] = [
    "serif", "sans-serif", "monospace", "onest", "abeezee", "aclonica", "advent-pro", 
    "anonymous-pro", "tenali-ramakrishna", "truculenta", "ubuntu-sans-mono", "unbounded", 
    "nova-mono", "orbitron", "bahianita", "syne-mono", "vt323", "xanh-mono", "cutive-mono", 
    "arbutus-slab", "nixie-one", "noticia-text", "arvo", "oi", "oldenburg", "orelega-one", 
    "nova-oval", "atma", "butcherman", "cherry-bomb-one", "josefin-sans", "lato", "open-sans", 
    "raleway", "montserrat", "ubuntu", "gloock"
  ];

  const handwritingFonts: FontFamily[] = [
    "indie-flower", "give-you-glory", "annie-use-your-telescope", 
    "nothing-you-could-do", "oooh-baby", "over-the-rainbow", "pangolin", 
    "autour-one", "permanent-marker", "reenie-beanie", "rock-salt", 
    "schoolbell", "sedgwick-ave", "shadows-into-light", "short-stack", 
    "shantell-sans", "solitreo", "sue-ellen-francisco", "sunshiney", 
    "swanky-and-moo-moo", "the-girl-next-door", "tillana", "unkempt", 
    "waiting-for-the-sunrise", "beth-ellen", "homemade-apple", "zeyada", 
    "cedarville-cursive", "coming-soon", "covered-by-your-grace", 
    "crafty-girls", "comforter", "oregano", "protest-revolution", 
    "protest-riot", "rancho", "sarina", "single-day", "architects-daughter", 
    "dawning-of-a-new-day", "satisfy"
  ];

  // Get visible fonts based on mode
  const getVisibleFonts = () => {
    let fonts: FontFamily[] = [];
    if (fontMode === "basic") {
      fonts = basicFonts;
    } else if (fontMode === "handwriting") {
      fonts = handwritingFonts;
    }
    
    // Sort alphabetically
    const sortedFonts = [...fonts].sort((a, b) => {
      const nameA = getFontDisplayName(a).toLowerCase();
      const nameB = getFontDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    return sortedFonts;
  };

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
      'Comforter',
      // New basic fonts
      'ABeeZee',
      'Aclonica',
      'Advent+Pro',
      'Anonymous+Pro',
      'Tenali+Ramakrishna',
      'Truculenta',
      'Ubuntu+Sans+Mono',
      'Unbounded',
      'Nova+Mono',
      'Orbitron',
      'Bahianita',
      'Syne+Mono',
      'VT323',
      'Xanh+Mono',
      'Cutive+Mono',
      'Arbutus+Slab',
      'Nixie+One',
      'Noticia+Text',
      'Arvo',
      'Oi',
      'Oldenburg',
      'Orelega+One',
      'Nova+Oval',
      'Atma',
      'Butcherman',
      'Cherry+Bomb+One',
      // New handwriting fonts
      'Oregano',
      'Protest+Revolution',
      'Protest+Riot',
      'Rancho',
      'Sarina',
      'Single+Day',
      // Additional new fonts
      'Architects+Daughter',
      'Dawning+of+a+New+Day',
      'Satisfy',
      'Josefin+Sans',
      'Lato',
      'Open+Sans',
      'Raleway',
      'Montserrat',
      'Ubuntu',
      'Gloock'
    ];
    
    allFonts.forEach(fontName => {
      const existingLink = document.querySelector(`link[href*="${fontName}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
        link.rel = 'stylesheet';
        
        // Add error handling for font loading
        link.onerror = () => {
          console.warn(`Failed to load font: ${fontName}`);
        };
        
        document.head.appendChild(link);
      }
    });
  };

  useEffect(() => {
    preloadGoogleFonts();
    
    // Sync with Supabase but don't override current localStorage values
    const syncWithSupabase = async () => {
      const userExists = await ensureUserExists();
      
      if (!userExists) {
        console.error('Failed to create user in Supabase');
        return;
      }
      
      // Get current localStorage values
      const currentFont = localStorage.getItem("stickee-font-family") as FontFamily || "onest";
      const currentFavorites = JSON.parse(localStorage.getItem("stickee-favorite-fonts") || "[]");
      
      // Check if settings exist in Supabase
      const settings = await getFontSettings();
      
      if (!settings) {
        // No settings in Supabase, create with current localStorage values
        try {
          await saveFontSettings(currentFont, currentFavorites);
        } catch (error) {
          console.error('Failed to sync font settings to Supabase:', error);
        }
      }
      // If settings exist, we keep current localStorage values as they're more recent
    };
    
    syncWithSupabase();
  }, []);

  // Handle terms disagreement
  const handleDisagreeTerms = () => {
    localStorage.removeItem("stickee-terms-agreed");
    toast.error("You have disagreed to the Terms of Service. App functionality is restricted.");
    onOpenChange(false);
    
    // Trigger a storage change event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'stickee-terms-agreed',
      oldValue: 'true',
      newValue: null,
      storageArea: localStorage
    }));
  };

  const applyFontFamily = (font: FontFamily) => {
    applyAppFont(font);
  };


  const handleFontChange = async (value: FontFamily) => {
    setFontFamily(value);
    localStorage.setItem("stickee-font-family", value);
    applyFontFamily(value);
    onFontChange?.(value);
    
    // Save to Supabase
    try {
      await updateCurrentFont(value);
    } catch (error) {
      console.error('Failed to save font to Supabase:', error);
    }
  };


  const handleFontModeChange = (mode: FontMode) => {
    setFontMode(mode);
    localStorage.setItem("stickee-font-mode", mode);
  };

  const toggleFavoriteFont = async (font: FontFamily) => {
    const newFavorites = favoriteFonts.includes(font) 
      ? favoriteFonts.filter(f => f !== font)
      : favoriteFonts.length >= 10 
        ? favoriteFonts 
        : [...favoriteFonts, font];
    
    setFavoriteFonts(newFavorites);
    
    // Save to Supabase
    try {
      await updateFavoriteFonts(newFavorites);
    } catch (error) {
      console.error('Failed to save favorite fonts to Supabase:', error);
    }
  };

  const isFavorite = (font: FontFamily) => favoriteFonts.includes(font);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    try {
      // Validate the file first
      await validateImportFile(file);
      
      // Import the data
      await importUserData(file);
      
      toast.success("Data imported successfully! Refresh the page to see your imported notes.");
      onOpenChange(false); // Close the dialog after successful import
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to import data. Please check the file format.");
    } finally {
      setImporting(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const getFontLabelClasses = (font: string) => {
    return `text-lg ${fontFamily === font ? "bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold" : ""}`;
  };


  // Helper functions to sort fonts alphabetically


  const getFontDisplayValue = (font: FontFamily): string => getCssFontFamily(font);

  const getFontDisplayName = (font: FontFamily): string => getSharedFontDisplayName(font);


  return (
    <>
      <Dialog open={open && !showTermsModal} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(680px,calc(100vh-2rem))] w-[calc(100vw-1rem)] max-w-[760px] flex-col overflow-hidden border-2 border-foreground/15 bg-white p-0 text-foreground shadow-2xl dark:bg-card backdrop-blur">
          <DialogHeader className="border-b border-border bg-card px-6 py-5 text-left">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 rotate-[-4deg] items-center justify-center rounded-lg bg-primary shadow-sm"><Settings className="h-5 w-5" /></span><div><DialogTitle className="font-title text-2xl">Settings</DialogTitle><DialogDescription className="mt-1">Tune your little corner of Stickee.</DialogDescription></div></div>
          </DialogHeader>
          
          <div className="min-h-0 flex-1 overflow-y-auto border-border px-4 py-4 sm:px-6 sm:py-5 space-y-4">
            {(
              <>
                <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent"><Palette className="h-4 w-4" /></span><div><h3 className="font-sans font-semibold">Appearance</h3><p className="text-xs text-muted-foreground">Choose how Stickee looks on this device.</p></div></div>
                  <RadioGroup value={theme || "light"} onValueChange={setTheme} className="grid gap-3 sm:grid-cols-3">
                    {[{ value: "light", label: "Light", detail: "Bright paper", icon: Sun }, { value: "dark", label: "Dark", detail: "Easy on the eyes", icon: Moon }, { value: "system", label: "System", detail: "Follow device", icon: Monitor }].map(({ value, label, detail, icon: Icon }) => <Label key={value} htmlFor={`theme-${value}`} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${theme === value ? "border-foreground bg-primary/20" : "border-border hover:bg-muted"}`}><RadioGroupItem value={value} id={`theme-${value}`} /><Icon className="h-4 w-4" /><span><span className="block font-sans text-sm font-semibold">{label}</span><span className="block font-sans text-xs text-muted-foreground">{detail}</span></span></Label>)}
                  </RadioGroup>
                </section>
              </>
            )}
            
            {(
              <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent"><Type className="h-4 w-4" /></span><div><h3 className="font-sans font-semibold">Font appearance</h3><p className="text-xs text-muted-foreground">Choose a style and font without scrolling through a long list.</p></div></div>
                <label className="block space-y-2 font-sans text-sm font-medium">Font style
                  <Select value={fontMode} onValueChange={(value) => handleFontModeChange(value as FontMode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="basic">Basic fonts</SelectItem><SelectItem value="handwriting">Handwriting fonts</SelectItem></SelectContent></Select>
                </label>
                <label className="block space-y-2 font-sans text-sm font-medium">Font family
                  <Select value={fontFamily} onValueChange={(value) => handleFontChange(value as FontFamily)}><SelectTrigger><SelectValue placeholder={getFontDisplayName(fontFamily)} /></SelectTrigger><SelectContent>{getVisibleFonts().map((font) => <SelectItem key={font} value={font}>{getFontDisplayName(font)}</SelectItem>)}</SelectContent></Select>
                </label>
                <p className="rounded-md bg-muted/50 p-3 text-lg" style={{ fontFamily: getFontDisplayValue(fontFamily) }}>Aa — {getFontDisplayName(fontFamily)}</p>
              </div>
            )}
            
            {(
              <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent"><Bookmark className="h-4 w-4" /></span><div><h3 className="font-sans font-semibold">Favorite Fonts ({favoriteFonts.length}/10)</h3><p className="text-xs text-muted-foreground">Quick access to your favorite fonts for easy switching.</p></div></div>
                {favoriteFonts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No favorite fonts yet. Click the heart icon on any font to add it to your bookmarks.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {favoriteFonts.map((font) => (
                      <div key={font} className="flex items-center justify-between p-2 border rounded">
                        <span style={{ fontFamily: getFontDisplayValue(font) }}>
                          {getFontDisplayName(font)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFontChange(font)}
                          >
                            Apply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavoriteFont(font)}
                            className="text-red-500"
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {(
              <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent"><FileText className="h-4 w-4" /></span><div><h3 className="font-sans font-semibold">Terms</h3><p className="text-xs text-muted-foreground">Review and manage your terms agreement.</p></div></div>
                <div className="text-center space-y-4 p-6 border rounded-lg bg-muted/50">
                  <h2 className="text-xl font-semibold text-foreground">Welcome to Stickee!</h2>
                  <p className="text-sm text-muted-foreground">
                    Please review and agree to our Terms of Service to continue using the application.
                  </p>
                  
                  <div className="flex flex-col space-y-3 max-w-sm mx-auto">
                    <Button 
                      onClick={() => {
                        toast.success("Terms already agreed!");
                      }}
                      className="w-full"
                      disabled
                    >
                      I Agree to Terms of Service
                    </Button>
                    
                    <Button 
                      onClick={handleDisagreeTerms}
                      variant="destructive"
                      className="w-full"
                    >
                      Disagree to Terms of Service
                    </Button>
                    
                    <Button 
                      onClick={() => setShowTermsModal(true)}
                      variant="outline"
                      className="w-full"
                    >
                      View Terms
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    You have already agreed to the terms to use Stickee. You can review the terms anytime.
                  </p>
                </div>
              </div>
            )}
            
            {(
              <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-1 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent"><Database className="h-4 w-4" /></span><div><h3 className="font-sans font-semibold">Data Management</h3><p className="text-xs text-muted-foreground">Export your data to keep a backup or import data from a previous export.</p></div></div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Export All Data</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download all your notes, checklist items, and reactions as a JSON file.
                      </p>
                      <Button
                        onClick={async () => {
                          try {
                            const data = await exportUserData();
                            downloadExportFile(data);
                            toast.success("Data exported successfully!");
                          } catch (error) {
                            console.error('Export failed:', error);
                            toast.error("Failed to export data. Please try again.");
                          }
                        }}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Data to JSON
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Import Data</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Import notes and checklist items from a previously exported JSON file.
                      </p>
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            disabled={importing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            id="file-upload"
                          />
                          <label 
                            htmlFor="file-upload"
                            className={`block w-full p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors ${
                              importing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              <Download className="h-6 w-6 mx-auto text-muted-foreground" />
                              <div className="text-sm">
                                <span className="font-medium text-primary">
                                  {importing ? 'Importing...' : 'Click to upload or drag and drop'}
                                </span>
                                <p className="text-muted-foreground">
                                  JSON files only
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p className="mb-2">
                      <strong>What's included in your export/import:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All your notes (content, colors, status, pins)</li>
                      <li>Your checklist items and completion status</li>
                      <li>Emoji reactions on notes (export only)</li>
                      <li>User information and timestamp</li>
                    </ul>
                    <p className="mt-2">
                      <strong>Note:</strong> Importing will add new notes to your existing data.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* TermsOfService Modal - Outside Settings Dialog */}
      <TermsOfService 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </>
  );
};

export const SettingsButton = () => {
  const [open, setOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(() => {
    return localStorage.getItem("stickee-terms-agreed") === "true";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setTermsAgreed(localStorage.getItem("stickee-terms-agreed") === "true");
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically as a fallback
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSettingsClick = (e: React.MouseEvent) => {
    if (!termsAgreed) {
      e.preventDefault();
      toast.error("You must agree to Terms of Service to access settings");
      return;
    }
  };

  return (
    <Dialog open={open} onOpenChange={termsAgreed ? setOpen : () => {}}>
      {!termsAgreed ? (
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleSettingsClick}
        >
          <Settings className="h-5 w-5" />
        </Button>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      )}
      {termsAgreed && <SettingsDialog open={open} onOpenChange={setOpen} />}
    </Dialog>
  );
};
