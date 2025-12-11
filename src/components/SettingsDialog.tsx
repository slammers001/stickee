import { useState, useEffect } from "react";
import { Heart, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getFontSettings, saveFontSettings, updateCurrentFont, updateTitleFont, updateFavoriteFonts } from "@/services/fontSettingsService";
import { ensureUserExists } from "@/services/userService";

type FontFamily = "serif" | "sans-serif" | "monospace" | 
  "abeezee" | "aclonica" | "advent-pro" | "anonymous-pro" | "tenali-ramakrishna" | "truculenta" | "ubuntu-sans-mono" | "unbounded" | "nova-mono" | "orbitron" | "bahianita" | "syne-mono" | "vt323" | "xanh-mono" | "cutive-mono" | "arbutus-slab" | "nixie-one" | "noticia-text" | "arvo" | "oi" | "oldenburg" | "orelega-one" | "nova-oval" | "atma" | "butcherman" | "cherry-bomb-one" |
  "annie-use-your-telescope" | "nothing-you-could-do" | "oooh-baby" | "over-the-rainbow" | 
  "pangolin" | "autour-one" | "permanent-marker" | "reenie-beanie" | "rock-salt" | 
  "schoolbell" | "sedgwick-ave" | "shadows-into-light" | "short-stack" | "shantell-sans" | 
  "solitreo" | "sue-ellen-francisco" | "sunshiney" | "swanky-and-moo-moo" | "the-girl-next-door" | 
  "tillana" | "unkempt" | "waiting-for-the-sunrise" | "beth-ellen" | "homemade-apple" | 
  "zeyada" | "cedarville-cursive" | "coming-soon" | "covered-by-your-grace" | "crafty-girls" | 
  "comforter" | "indie-flower" | "give-you-glory" | "oregano" | "protest-revolution" | "protest-riot" | "rancho" | "sarina" | "single-day";

type TitleFontFamily = "arbutus" | "agbalumo" | "walter-turncoat" | "yatra-one";

type FontMode = "basic" | "handwriting";
type ActiveTab = "ui" | "fonts" | "bookmarks" | "titles" | "terms";
type ViewMode = "grid" | "list";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [fontMode, setFontMode] = useState<FontMode>("basic");
  const [fontFamily, setFontFamily] = useState<FontFamily>("indie-flower");
  const [titleFont, setTitleFont] = useState<TitleFontFamily>("arbutus");
  const [defaultView, setDefaultView] = useState<ViewMode>("grid");
  const [favoriteFonts, setFavoriteFonts] = useState<FontFamily[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ui");
  const [visibleFontCount, setVisibleFontCount] = useState(20); // Lazy loading state
  const [termsContent, setTermsContent] = useState("");

  // Organized font arrays for lazy loading
  const basicFonts: FontFamily[] = [
    "serif", "sans-serif", "monospace", "abeezee", "aclonica", "advent-pro", 
    "anonymous-pro", "tenali-ramakrishna", "truculenta", "ubuntu-sans-mono", 
    "unbounded", "nova-mono", "orbitron", "bahianita", "syne-mono", "vt323", 
    "xanh-mono", "cutive-mono", "arbutus-slab", "nixie-one", "noticia-text", 
    "arvo", "oi", "oldenburg", "orelega-one", "nova-oval", "atma", "butcherman", 
    "cherry-bomb-one"
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
    "protest-riot", "rancho", "sarina", "single-day"
  ];

  // Get visible fonts based on mode and lazy loading
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
    
    return sortedFonts.slice(0, visibleFontCount);
  };

  // Load more fonts on scroll
  const loadMoreFonts = () => {
    setVisibleFontCount(prev => prev + 20);
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
      // Title fonts
      'Arbutus',
      'Agbalumo',
      'Walter+Turncoat',
      'Yatra+One'
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
    
    // Load font settings from Supabase
    const loadFontSettings = async () => {
      const userExists = await ensureUserExists(); // Ensure user exists in Supabase
      
      if (!userExists) {
        console.error('Failed to create user in Supabase');
        // Fallback to localStorage
        const savedFont = localStorage.getItem("stickee-font-family") as FontFamily;
        const savedTitleFont = localStorage.getItem("stickee-title-font") as TitleFontFamily;
        const savedFontMode = localStorage.getItem("stickee-font-mode") as FontMode;
        const savedView = localStorage.getItem("stickee-default-view") as ViewMode;
        
        if (savedFontMode) setFontMode(savedFontMode);
        if (savedFont) {
          setFontFamily(savedFont);
          applyFontFamily(savedFont);
        }
        if (savedTitleFont) {
          setTitleFont(savedTitleFont);
          applyTitleFont(savedTitleFont);
        }
        if (savedView) setDefaultView(savedView);
        return;
      }
      
      // First try to get existing settings
      const settings = await getFontSettings();
      
      if (settings) {
        // Load from Supabase if settings exist
        if (settings.current_font) {
          setFontFamily(settings.current_font as FontFamily);
          applyFontFamily(settings.current_font as FontFamily);
          localStorage.setItem("stickee-font-family", settings.current_font);
        }
        if (settings.title_font) {
          setTitleFont(settings.title_font as TitleFontFamily);
          applyTitleFont(settings.title_font as TitleFontFamily);
          localStorage.setItem("stickee-title-font", settings.title_font);
        }
        if (settings.favorite_fonts && settings.favorite_fonts.length > 0) {
          setFavoriteFonts(settings.favorite_fonts as FontFamily[]);
        }
      } else {
        // Create default settings if none exist
        const defaultFont = localStorage.getItem("stickee-font-family") as FontFamily || "indie-flower";
        const defaultTitleFont = localStorage.getItem("stickee-title-font") as TitleFontFamily || "arbutus";
        const defaultFavorites = JSON.parse(localStorage.getItem("stickee-favorite-fonts") || "[]");
        
        // Save defaults to Supabase
        try {
          await saveFontSettings(defaultFont, defaultTitleFont, defaultFavorites);
        } catch (error) {
          console.error('Failed to create default font settings:', error);
        }
        
        // Apply defaults
        setFontFamily(defaultFont);
        applyFontFamily(defaultFont);
        setTitleFont(defaultTitleFont);
        applyTitleFont(defaultTitleFont);
        setFavoriteFonts(defaultFavorites);
      }
      
      // Load font mode from localStorage
      const savedFontMode = localStorage.getItem("stickee-font-mode") as FontMode;
      if (savedFontMode) {
        setFontMode(savedFontMode);
      }
      
      // Load view settings from localStorage (keep this local)
      const savedView = localStorage.getItem("stickee-default-view") as ViewMode;
      if (savedView) {
        setDefaultView(savedView);
      }
    };
    
    loadFontSettings();
  }, []);

  // Load terms content when component mounts
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const response = await fetch("/TERMS_OF_SERVICE.md");
        const text = await response.text();
        setTermsContent(text);
      } catch (error) {
        console.error("Failed to load terms:", error);
        setTermsContent("Failed to load terms. Please try again.");
      }
    };
    loadTerms();
  }, []);

  // Handle terms disagreement
  const handleDisagreeTerms = () => {
    localStorage.removeItem("stickee-terms-agreed");
    toast.error("You have disagreed to the Terms of Service. App functionality is restricted.");
    onOpenChange(false);
  };

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
      case "oregano":
        fontValue = 'Oregano, cursive';
        break;
      case "protest-revolution":
        fontValue = '"Protest Revolution", cursive';
        break;
      case "protest-riot":
        fontValue = '"Protest Riot", cursive';
        break;
      case "rancho":
        fontValue = 'Rancho, cursive';
        break;
      case "sarina":
        fontValue = 'Sarina, cursive';
        break;
      case "single-day":
        fontValue = '"Single Day", cursive';
        break;
      case "abeezee":
        fontValue = 'ABeeZee, sans-serif';
        break;
      case "aclonica":
        fontValue = 'Aclonica, sans-serif';
        break;
      case "advent-pro":
        fontValue = '"Advent Pro", sans-serif';
        break;
      case "anonymous-pro":
        fontValue = '"Anonymous Pro", monospace';
        break;
      case "tenali-ramakrishna":
        fontValue = '"Tenali Ramakrishna", sans-serif';
        break;
      case "truculenta":
        fontValue = 'Truculenta, sans-serif';
        break;
      case "ubuntu-sans-mono":
        fontValue = '"Ubuntu Sans Mono", monospace';
        break;
      case "unbounded":
        fontValue = 'Unbounded, sans-serif';
        break;
      case "nova-mono":
        fontValue = '"Nova Mono", monospace';
        break;
      case "orbitron":
        fontValue = 'Orbitron, sans-serif';
        break;
      case "bahianita":
        fontValue = 'Bahianita, cursive';
        break;
      case "syne-mono":
        fontValue = 'Syne Mono, monospace';
        break;
      case "vt323":
        fontValue = 'VT323, monospace';
        break;
      case "xanh-mono":
        fontValue = 'Xanh Mono, monospace';
        break;
      case "cutive-mono":
        fontValue = 'Cutive Mono, monospace';
        break;
      case "arbutus-slab":
        fontValue = 'Arbutus Slab, serif';
        break;
      case "nixie-one":
        fontValue = 'Nixie One, serif';
        break;
      case "noticia-text":
        fontValue = 'Noticia Text, serif';
        break;
      case "arvo":
        fontValue = 'Arvo, serif';
        break;
      case "oi":
        fontValue = 'Oi, serif';
        break;
      case "oldenburg":
        fontValue = 'Oldenburg, cursive';
        break;
      case "orelega-one":
        fontValue = 'Orelega One, cursive';
        break;
      case "nova-oval":
        fontValue = 'Nova Oval, cursive';
        break;
      case "atma":
        fontValue = 'Atma, cursive';
        break;
      case "butcherman":
        fontValue = 'Butcherman, cursive';
        break;
      case "cherry-bomb-one":
        fontValue = '"Cherry Bomb One", cursive';
        break;
      case "indie-flower":
        fontValue = '"Indie Flower", cursive';
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

  const applyTitleFont = (font: TitleFontFamily) => {
    const root = document.documentElement;
    let fontValue = '';
    
    switch (font) {
      case "arbutus":
        fontValue = 'Arbutus, serif';
        break;
      case "agbalumo":
        fontValue = 'Agbalumo, display';
        break;
      case "walter-turncoat":
        fontValue = '"Walter Turncoat", cursive';
        break;
      case "yatra-one":
        fontValue = '"Yatra One", cursive';
        break;
    }
    
    root.style.setProperty('--font-family-title', fontValue);
  };

  const handleFontChange = async (value: FontFamily) => {
    setFontFamily(value);
    localStorage.setItem("stickee-font-family", value);
    applyFontFamily(value);
    
    // Save to Supabase
    try {
      await updateCurrentFont(value);
    } catch (error) {
      console.error('Failed to save font to Supabase:', error);
    }
  };

  const handleTitleFontChange = async (value: TitleFontFamily) => {
    setTitleFont(value);
    localStorage.setItem("stickee-title-font", value);
    applyTitleFont(value);
    
    // Save to Supabase
    try {
      await updateTitleFont(value);
    } catch (error) {
      console.error('Failed to save title font to Supabase:', error);
    }
  };

  const handleFontModeChange = (mode: FontMode) => {
    setFontMode(mode);
    localStorage.setItem("stickee-font-mode", mode);
  };

  const handleViewChange = (value: ViewMode) => {
    setDefaultView(value);
    localStorage.setItem("stickee-default-view", value);
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

  const getFontLabelClasses = (font: string) => {
    return `text-lg ${fontFamily === font ? "bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold" : ""}`;
  };

  const getTitleFontLabelClasses = (font: string) => {
    return `text-lg ${titleFont === font ? "bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold" : ""}`;
  };

  // Helper functions to sort fonts alphabetically
  const sortFontsAlphabetically = (fonts: FontFamily[]) => {
    return [...fonts].sort((a, b) => {
      const nameA = getFontDisplayName(a).toLowerCase();
      const nameB = getFontDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const sortTitleFontsAlphabetically = (fonts: TitleFontFamily[]) => {
    return [...fonts].sort((a, b) => {
      const nameA = a === "arbutus" ? "Arbutus" : 
                   a === "agbalumo" ? "Agbalumo" :
                   a === "walter-turncoat" ? "Walter Turncoat" :
                   "Yatra One";
      const nameB = b === "arbutus" ? "Arbutus" : 
                   b === "agbalumo" ? "Agbalumo" :
                   b === "walter-turncoat" ? "Walter Turncoat" :
                   "Yatra One";
      return nameA.localeCompare(nameB);
    });
  };

  const getFontDisplayValue = (font: FontFamily): string => {
    switch (font) {
      case "serif":
        return 'Georgia, serif';
      case "sans-serif":
        return 'Arial, sans-serif';
      case "monospace":
        return 'Courier New, monospace';
      case "give-you-glory":
        return '"Give You Glory", cursive';
      case "indie-flower":
        return '"Indie Flower", cursive';
      default:
        // For Google Fonts, use the display name directly
        return getFontDisplayName(font);
    }
  };

  const getFontDisplayName = (font: FontFamily): string => {
    const displayNames: Record<FontFamily, string> = {
      "serif": "Serif",
      "sans-serif": "Sans-serif", 
      "monospace": "Monospace",
      "abeezee": "ABeeZee",
      "aclonica": "Aclonica",
      "advent-pro": "Advent Pro",
      "anonymous-pro": "Anonymous Pro",
      "tenali-ramakrishna": "Tenali Ramakrishna",
      "truculenta": "Truculenta",
      "ubuntu-sans-mono": "Ubuntu Sans Mono",
      "unbounded": "Unbounded",
      "nova-mono": "Nova Mono",
      "orbitron": "Orbitron",
      "bahianita": "Bahianita",
      "syne-mono": "Syne Mono",
      "vt323": "VT323",
      "xanh-mono": "Xanh Mono",
      "cutive-mono": "Cutive Mono",
      "arbutus-slab": "Arbutus Slab",
      "nixie-one": "Nixie One",
      "noticia-text": "Noticia Text",
      "arvo": "Arvo",
      "oi": "Oi",
      "oldenburg": "Oldenburg",
      "orelega-one": "Orelega One",
      "nova-oval": "Nova Oval",
      "atma": "Atma",
      "butcherman": "Butcherman",
      "cherry-bomb-one": "Cherry Bomb One",
      "annie-use-your-telescope": "Annie Use Your Telescope",
      "nothing-you-could-do": "Nothing You Could Do",
      "oooh-baby": "Oooh Baby",
      "over-the-rainbow": "Over the Rainbow",
      "pangolin": "Pangolin",
      "autour-one": "Autour One",
      "permanent-marker": "Permanent Marker",
      "reenie-beanie": "Reenie Beanie",
      "rock-salt": "Rock Salt",
      "schoolbell": "Schoolbell",
      "sedgwick-ave": "Sedgwick Ave",
      "shadows-into-light": "Shadows Into Light",
      "short-stack": "Short Stack",
      "shantell-sans": "Shantell Sans",
      "solitreo": "Solitreo",
      "sue-ellen-francisco": "Sue Ellen Francisco",
      "sunshiney": "Sunshiney",
      "swanky-and-moo-moo": "Swanky and Moo Moo",
      "the-girl-next-door": "The Girl Next Door",
      "tillana": "Tillana",
      "unkempt": "Unkempt",
      "waiting-for-the-sunrise": "Waiting for the Sunrise",
      "beth-ellen": "Beth Ellen",
      "homemade-apple": "Homemade Apple",
      "zeyada": "Zeyada",
      "cedarville-cursive": "Cedarville Cursive",
      "coming-soon": "Coming Soon",
      "covered-by-your-grace": "Covered By Your Grace",
      "crafty-girls": "Crafty Girls",
      "comforter": "Comforter",
      "indie-flower": "Indie Flower",
      "give-you-glory": "Give You Glory",
      "oregano": "Oregano",
      "protest-revolution": "Protest Revolution",
      "protest-riot": "Protest Riot",
      "rancho": "Rancho",
      "sarina": "Sarina",
      "single-day": "Single Day"
    };
    return displayNames[font] || font;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Stickee experience
          </DialogDescription>
        </DialogHeader>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-muted rounded-lg">
          <Button
            variant={activeTab === "ui" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("ui")}
            className="flex-1"
          >
            UI
          </Button>
          <Button
            variant={activeTab === "fonts" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("fonts")}
            className="flex-1"
          >
            Fonts
          </Button>
          <Button
            variant={activeTab === "titles" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("titles")}
            className="flex-1"
          >
            Titles
          </Button>
          <Button
            variant={activeTab === "bookmarks" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("bookmarks")}
            className="flex-1"
          >
            Bookmarks ({favoriteFonts.length}/10)
          </Button>
          <Button
            variant={activeTab === "terms" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("terms")}
            className="flex-1"
          >
            Terms
          </Button>
        </div>

        <div className="grid gap-6 py-4 max-h-[500px] overflow-y-auto">
          {activeTab === "ui" && (
            <>
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
            </>
          )}
          
          {activeTab === "fonts" && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Currently Using:</p>
                <p className="text-lg" style={{ fontFamily: getFontDisplayValue(fontFamily) }}>
                  {getFontDisplayName(fontFamily)}
                </p>
              </div>
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
                  <Label htmlFor="handwriting" className="text-lg" style={{ fontFamily: '"Indie Flower", cursive' }}>
                    Handwriting
                  </Label>
                </div>
              </RadioGroup>
              
              {fontMode === "basic" && (
                <div className="ml-6 space-y-2 max-h-60 overflow-y-auto">
                  <RadioGroup value={fontFamily} onValueChange={handleFontChange}>
                    {getVisibleFonts().map((font) => (
                      <div key={font} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={font} id={font} />
                          <Label 
                            htmlFor={font} 
                            className={`${font === "serif" ? "font-serif" : ""} ${getFontLabelClasses(font)}`}
                            style={{ fontFamily: getFontDisplayValue(font) }}
                          >
                            {getFontDisplayName(font)}
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavoriteFont(font)}
                          className={isFavorite(font) ? "text-red-500" : ""}
                        >
                          <Heart className={`h-4 w-4 ${isFavorite(font) ? "fill-current" : ""}`} />
                        </Button>
                      </div>
                    ))}
                    {getVisibleFonts().length < sortFontsAlphabetically(basicFonts).length && (
                      <div className="text-center py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMoreFonts}
                          className="w-full"
                        >
                          Load More Fonts
                        </Button>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              )}
              
              {fontMode === "handwriting" && (
                <div className="ml-6 space-y-2 max-h-60 overflow-y-auto">
                  <RadioGroup value={fontFamily} onValueChange={handleFontChange}>
                    {getVisibleFonts().map((font) => (
                      <div key={font} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={font} id={font} />
                          <Label 
                            htmlFor={font} 
                            className={getFontLabelClasses(font)}
                            style={{ fontFamily: getFontDisplayValue(font) }}
                          >
                            {getFontDisplayName(font)}
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavoriteFont(font)}
                          className={isFavorite(font) ? "text-red-500" : ""}
                        >
                          <Heart className={`h-4 w-4 ${isFavorite(font) ? "fill-current" : ""}`} />
                        </Button>
                      </div>
                    ))}
                    {getVisibleFonts().length < sortFontsAlphabetically(handwritingFonts).length && (
                      <div className="text-center py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMoreFonts}
                          className="w-full"
                        >
                          Load More Fonts
                        </Button>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "bookmarks" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Favorite Fonts ({favoriteFonts.length}/10)</h3>
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
          
          {activeTab === "titles" && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Currently Using:</p>
                <p className="text-lg" style={{ 
                  fontFamily: titleFont === "arbutus" ? 'Arbutus, serif' : 
                            titleFont === "agbalumo" ? 'Agbalumo, display' :
                            titleFont === "walter-turncoat" ? '"Walter Turncoat", cursive' :
                            '"Yatra One", cursive'
                }}>
                  {titleFont === "arbutus" ? "Arbutus" :
                   titleFont === "agbalumo" ? "Agbalumo" :
                   titleFont === "walter-turncoat" ? "Walter Turncoat" :
                   "Yatra One"}
                </p>
              </div>
              <h3 className="text-sm font-medium">Title Fonts</h3>
              <p className="text-sm text-muted-foreground">
                Choose a font for note titles. These fonts are designed to make headings stand out.
              </p>
              <div className="space-y-2">
                <RadioGroup value={titleFont} onValueChange={handleTitleFontChange}>
                  {sortTitleFontsAlphabetically(["arbutus", "agbalumo", "walter-turncoat", "yatra-one"]).map((font) => (
                    <div key={font} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={font} id={`title-${font}`} />
                        <Label htmlFor={`title-${font}`} className={getTitleFontLabelClasses(font)} style={{ 
                          fontFamily: font === "arbutus" ? 'Arbutus, serif' : 
                                    font === "agbalumo" ? 'Agbalumo, display' :
                                    font === "walter-turncoat" ? '"Walter Turncoat", cursive' :
                                    '"Yatra One", cursive'
                        }}>
                          {font === "arbutus" ? "Arbutus" :
                           font === "agbalumo" ? "Agbalumo" :
                           font === "walter-turncoat" ? "Walter Turncoat" :
                           "Yatra One"}
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}
          
          {activeTab === "terms" && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Terms of Service</h3>
                <div className="space-y-4">
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
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      You have already agreed to the terms to use Stickee. You can review the terms anytime.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Terms of Service</h4>
                    <div className="prose prose-sm max-w-none dark:prose-invert max-h-96 overflow-y-auto p-4 border rounded-lg bg-muted/30">
                      <ReactMarkdown>{termsContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            By using this app you agree to the{" "}
            <button
              onClick={() => {
                setActiveTab("terms");
              }}
              className="text-xs underline hover:text-foreground transition-colors"
            >
              Terms of Service
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
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
