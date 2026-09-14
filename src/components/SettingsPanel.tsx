import { useState, useEffect } from "react";
import { Heart, Download } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getFontSettings, saveFontSettings, updateCurrentFont, updateFavoriteFonts } from "@/services/fontSettingsService";
import { ensureUserExists } from "@/services/userService";
import { exportUserData, downloadExportFile, importUserData, validateImportFile } from "@/services/exportService";
import { TermsOfService } from "@/components/TermsOfService";
import { applyAppFont, getCssFontFamily, getFontDisplayName as getSharedFontDisplayName } from "@/utils/fonts";

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

interface SettingsPanelProps {
  onFontChange?: (font: string) => void;
}

export const SettingsPanel = ({ onFontChange }: SettingsPanelProps) => {
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

  const getVisibleFonts = () => {
    let fonts: FontFamily[] = [];
    if (fontMode === "basic") {
      fonts = basicFonts;
    } else if (fontMode === "handwriting") {
      fonts = handwritingFonts;
    }
    const sortedFonts = [...fonts].sort((a, b) => {
      const nameA = getFontDisplayName(a).toLowerCase();
      const nameB = getFontDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return sortedFonts;
  };

  const preloadGoogleFonts = () => {
    const allFonts = [
      'Indie+Flower', 'Give+You+Glory', 'Permanent+Marker', 'Rock+Salt',
      'Shadows+Into+Light', 'Sue+Ellen+Francisco', 'Annie+Use+Your+Telescope',
      'Nothing+You+Could+Do', 'Oooh+Baby', 'Over+the+Rainbow', 'Pangolin',
      'Autour+One', 'Reenie+Beanie', 'Schoolbell', 'Sedgwick+Ave', 'Short+Stack',
      'Shantell+Sans', 'Solitreo', 'Sunshiney', 'Swanky+and+Moo+Moo',
      'The+Girl+Next+Door', 'Tillana', 'Unkempt', 'Waiting+for+the+Sunrise',
      'Beth+Ellen', 'Homemade+Apple', 'Zeyada', 'Cedarville+Cursive', 'Coming+Soon',
      'Covered+By+Your+Grace', 'Crafty+Girls', 'Comforter',
      'ABeeZee', 'Aclonica', 'Advent+Pro', 'Anonymous+Pro', 'Tenali+Ramakrishna',
      'Truculenta', 'Ubuntu+Sans+Mono', 'Unbounded', 'Nova+Mono', 'Orbitron',
      'Bahianita', 'Syne+Mono', 'VT323', 'Xanh+Mono', 'Cutive+Mono', 'Arbutus+Slab',
      'Nixie+One', 'Noticia+Text', 'Arvo', 'Oi', 'Oldenburg', 'Orelega+One',
      'Nova+Oval', 'Atma', 'Butcherman', 'Cherry+Bomb+One', 'Oregano',
      'Protest+Revolution', 'Protest+Riot', 'Rancho', 'Sarina', 'Single+Day',
      'Architects+Daughter', 'Dawning+of+a+New+Day', 'Satisfy', 'Josefin+Sans',
      'Lato', 'Open+Sans', 'Raleway', 'Montserrat', 'Ubuntu', 'Gloock'
    ];
    allFonts.forEach(fontName => {
      const existingLink = document.querySelector(`link[href*="${fontName}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
        link.rel = 'stylesheet';
        link.onerror = () => { console.warn(`Failed to load font: ${fontName}`); };
        document.head.appendChild(link);
      }
    });
  };

  useEffect(() => {
    preloadGoogleFonts();
    const syncWithSupabase = async () => {
      const userExists = await ensureUserExists();
      if (!userExists) return;
      const currentFont = localStorage.getItem("stickee-font-family") as FontFamily || "onest";
      const currentFavorites = JSON.parse(localStorage.getItem("stickee-favorite-fonts") || "[]");
      const settings = await getFontSettings();
      if (!settings) {
        try { await saveFontSettings(currentFont, currentFavorites); } catch (error) { console.error('Failed to sync:', error); }
      }
    };
    syncWithSupabase();
  }, []);

  const handleDisagreeTerms = () => {
    localStorage.removeItem("stickee-terms-agreed");
    toast.error("You have disagreed to the Terms of Service. App functionality is restricted.");
  };

  const applyFontFamily = (font: FontFamily) => {
    applyAppFont(font);
  };

  const handleFontChange = async (value: FontFamily) => {
    setFontFamily(value);
    localStorage.setItem("stickee-font-family", value);
    applyFontFamily(value);
    onFontChange?.(value);
    try { await updateCurrentFont(value); } catch (error) { console.error('Failed to save font:', error); }
  };

  const handleFontModeChange = (mode: FontMode) => {
    setFontMode(mode);
    localStorage.setItem("stickee-font-mode", mode);
  };

  const toggleFavoriteFont = async (font: FontFamily) => {
    const newFavorites = favoriteFonts.includes(font) 
      ? favoriteFonts.filter(f => f !== font)
      : favoriteFonts.length >= 10 ? favoriteFonts : [...favoriteFonts, font];
    setFavoriteFonts(newFavorites);
    try { await updateFavoriteFonts(newFavorites); } catch (error) { console.error('Failed to save favorites:', error); }
  };

  const isFavorite = (font: FontFamily) => favoriteFonts.includes(font);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await validateImportFile(file);
      await importUserData(file);
      toast.success("Data imported successfully! Refresh the page to see your imported notes.");
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to import data.");
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const getFontLabelClasses = (font: string) => {
    return `text-lg ${fontFamily === font ? "bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold" : ""}`;
  };

  const getFontDisplayValue = (font: FontFamily): string => getCssFontFamily(font);
  const getFontDisplayName = (font: FontFamily): string => getSharedFontDisplayName(font);

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground mb-2 font-handwriting">Settings</h1>
      <p className="text-muted-foreground mb-6">Customize your Stickee experience</p>

      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-muted rounded-lg mb-6">
        <Button variant={activeTab === "ui" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("ui")} className="flex-1">UI</Button>
        <Button variant={activeTab === "fonts" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("fonts")} className="flex-1">Fonts</Button>
        <Button variant={activeTab === "bookmarks" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("bookmarks")} className="flex-1">Bookmarks ({favoriteFonts.length}/10)</Button>
        <Button variant={activeTab === "terms" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("terms")} className="flex-1">Terms</Button>
        <Button variant={activeTab === "data" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("data")} className="flex-1">Data</Button>
      </div>

      <div className="space-y-6">
        {activeTab === "ui" && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Theme</h3>
            <RadioGroup value={theme} onValueChange={setTheme}>
              <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="light" /><Label htmlFor="light">Light</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="dark" id="dark" /><Label htmlFor="dark">Dark</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="system" id="system" /><Label htmlFor="system">System</Label></div>
            </RadioGroup>
          </div>
        )}

        {activeTab === "fonts" && (
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Currently Using:</p>
              <p className="text-lg" style={{ fontFamily: getFontDisplayValue(fontFamily) }}>{getFontDisplayName(fontFamily)}</p>
            </div>
            <h3 className="text-sm font-medium">Font Family</h3>
            <RadioGroup value={fontMode} onValueChange={handleFontModeChange}>
              <div className="flex items-center space-x-2"><RadioGroupItem value="basic" id="basic" /><Label htmlFor="basic" className="text-lg">Basic Fonts</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="handwriting" id="handwriting" /><Label htmlFor="handwriting" className="text-lg" style={{ fontFamily: '"Indie Flower", cursive' }}>Handwriting</Label></div>
            </RadioGroup>
            <div className="ml-6 space-y-2 max-h-96 overflow-y-auto">
              <RadioGroup value={fontFamily} onValueChange={handleFontChange}>
                {getVisibleFonts().map((font) => (
                  <div key={font} className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={font} id={font} />
                      <Label htmlFor={font} className={getFontLabelClasses(font)} style={{ fontFamily: getFontDisplayValue(font) }}>
                        {getFontDisplayName(font)}
                        {(font === "onest" || font === "josefin-sans" || font === "lato" || font === "open-sans" || font === "raleway" || font === "montserrat" || font === "ubuntu" || font === "gloock" || font === "architects-daughter" || font === "dawning-of-a-new-day" || font === "satisfy") && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">NEW</span>
                        )}
                      </Label>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleFavoriteFont(font)} className={isFavorite(font) ? "text-red-500" : ""}>
                      <Heart className={`h-4 w-4 ${isFavorite(font) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {activeTab === "bookmarks" && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Favorite Fonts ({favoriteFonts.length}/10)</h3>
            {favoriteFonts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No favorite fonts yet. Click heart icon on any font to add it to your bookmarks.</p>
            ) : (
              <div className="space-y-2">
                {favoriteFonts.map((font) => (
                  <div key={font} className="flex items-center justify-between p-2 border rounded">
                    <span style={{ fontFamily: getFontDisplayValue(font) }}>{getFontDisplayName(font)}</span>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleFontChange(font)}>Apply</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleFavoriteFont(font)} className="text-red-500"><Heart className="h-4 w-4 fill-current" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "terms" && (
          <div className="space-y-4">
            <div className="text-center space-y-4 p-6 border rounded-lg bg-muted/50">
              <h2 className="text-xl font-semibold text-foreground">Welcome to Stickee!</h2>
              <p className="text-sm text-muted-foreground">Please review and agree to our Terms of Service to continue using the application.</p>
              <div className="flex flex-col space-y-3 max-w-sm mx-auto">
                <Button onClick={() => toast.success("Terms already agreed!")} className="w-full" disabled>I Agree to Terms of Service</Button>
                <Button onClick={handleDisagreeTerms} variant="destructive" className="w-full">Disagree to Terms of Service</Button>
                <Button onClick={() => setShowTermsModal(true)} variant="outline" className="w-full">View Terms</Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">You have already agreed to the terms to use Stickee. You can review the terms anytime.</p>
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Data Management</h3>
            <p className="text-sm text-muted-foreground">Export your data to keep a backup or import data from a previous export.</p>
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Export All Data</h4>
                <p className="text-sm text-muted-foreground mb-4">Download all your notes, checklist items, and reactions as a JSON file.</p>
                <Button onClick={async () => { try { const data = await exportUserData(); downloadExportFile(data); toast.success("Data exported successfully!"); } catch (error) { toast.error("Failed to export data."); } }} className="w-full">
                  <Download className="h-4 w-4 mr-2" />Export Data to JSON
                </Button>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Import Data</h4>
                <p className="text-sm text-muted-foreground mb-4">Import notes and checklist items from a previously exported JSON file.</p>
                <div className="relative">
                  <input type="file" accept=".json" onChange={handleImport} disabled={importing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" id="file-upload-panel" />
                  <label htmlFor="file-upload-panel" className={`block w-full p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="space-y-2">
                      <Download className="h-6 w-6 mx-auto text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium text-primary">{importing ? 'Importing...' : 'Click to upload or drag and drop'}</span>
                        <p className="text-muted-foreground">JSON files only</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="mb-2"><strong>What's included in your export/import:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>All your notes (content, colors, status, pins)</li>
                <li>Your checklist items and completion status</li>
                <li>Emoji reactions on notes (export only)</li>
                <li>User information and timestamp</li>
              </ul>
              <p className="mt-2"><strong>Note:</strong> Importing will add new notes to your existing data.</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 mt-6 border-t">
        <p className="text-xs text-muted-foreground text-center">
          By using this app you agree to{" "}
          <button onClick={() => setActiveTab("terms")} className="text-xs underline hover:text-foreground transition-colors">Terms of Service</button>
        </p>
      </div>

      <TermsOfService isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </main>
  );
};
