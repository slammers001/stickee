import { Paintbrush } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const themes = [
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
  { name: "System", value: "system" },
];

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(() => {
    return localStorage.getItem("stickee-terms-agreed") === "true";
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleThemeClick = (e: React.MouseEvent) => {
    if (!termsAgreed) {
      e.preventDefault();
      e.stopPropagation();
      toast.error("You must agree to Terms of Service to change themes");
      return false;
    }
    return true;
  };

  const handleThemeSelect = (themeValue: string) => {
    if (!termsAgreed) {
      toast.error("You must agree to Terms of Service to change themes");
      return;
    }
    setTheme(themeValue);
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <Paintbrush className="h-5 w-5" />
        <span className="sr-only">Theme selector</span>
      </Button>
    );
  }

  return (
    <Popover>
      {!termsAgreed ? (
        <Button 
          variant="outline" 
          size="icon"
          className="relative"
          title="Themes"
          onClick={handleThemeClick}
        >
          <Paintbrush className="h-5 w-5" />
          <span className="sr-only">Theme selector</span>
        </Button>
      ) : (
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="relative"
            title="Themes"
          >
            <Paintbrush className="h-5 w-5" />
            <span className="sr-only">Theme selector</span>
          </Button>
        </PopoverTrigger>
      )}
      {termsAgreed && (
        <PopoverContent className="w-40 p-2" align="start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground mb-2">Themes</p>
            {themes.map((themeOption) => (
              <Button
                key={themeOption.value}
                variant={theme === themeOption.value ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => handleThemeSelect(themeOption.value)}
              >
                {themeOption.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};
