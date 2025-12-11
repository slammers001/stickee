import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ensureUserExists, saveTermsAgreement } from "@/services/userService";

interface TermsPopupProps {
  onAgree: () => void;
  showTerms?: boolean;
  onShowTermsChange?: (show: boolean) => void;
}

export function TermsPopup({ onAgree, showTerms = false, onShowTermsChange }: TermsPopupProps) {
  const [termsContent, setTermsContent] = useState("");

  // Handle terms agreement with Supabase save
  const handleTermsAgree = async () => {
    try {
      // Save to localStorage first
      localStorage.setItem("stickee-terms-agreed", "true");
      
      // Ensure user exists and save terms agreement to Supabase
      const userExists = await ensureUserExists();
      if (userExists) {
        const saved = await saveTermsAgreement();
        if (saved) {
          console.log("Terms agreement saved to Supabase");
        } else {
          console.error("Failed to save terms agreement to Supabase");
        }
      }
      
      // Call parent callback
      onAgree();
    } catch (error) {
      console.error("Error handling terms agreement:", error);
      // Still allow the user to proceed even if Supabase save fails
      localStorage.setItem("stickee-terms-agreed", "true");
      onAgree();
    }
  };

  const handleShowTerms = async () => {
    if (onShowTermsChange) {
      onShowTermsChange(true);
      return;
    }
    
    try {
      // Handle different environments
      let response;
      if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
        // In Electron, try different possible paths
        const possiblePaths = [
          "./TERMS_OF_SERVICE.md",
          "/TERMS_OF_SERVICE.md",
          "TERMS_OF_SERVICE.md"
        ];
        
        let loaded = false;
        for (const path of possiblePaths) {
          try {
            const testResponse = await fetch(path);
            if (testResponse.ok) {
              response = testResponse;
              loaded = true;
              break;
            }
          } catch (e) {
            // Try next path
            continue;
          }
        }
        
        if (!loaded) {
          throw new Error("Could not find TERMS_OF_SERVICE.md in Electron environment");
        }
      } else {
        // Web environment
        response = await fetch("/TERMS_OF_SERVICE.md");
      }
      
      if (!response) {
        throw new Error("Could not fetch TERMS_OF_SERVICE.md");
      }
      
      const text = await response.text();
      setTermsContent(text);
    } catch (error) {
      console.error("Failed to load terms:", error);
      setTermsContent("Failed to load terms. Please try again.");
    }
  };

  // Load terms content when showTerms becomes true
  useEffect(() => {
    if (showTerms && !termsContent) {
      const loadTerms = async () => {
        try {
          // Handle different environments
          let response;
          if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
            // In Electron, try different possible paths
            const possiblePaths = [
              "./TERMS_OF_SERVICE.md",
              "/TERMS_OF_SERVICE.md",
              "TERMS_OF_SERVICE.md"
            ];
            
            let loaded = false;
            for (const path of possiblePaths) {
              try {
                const testResponse = await fetch(path);
                if (testResponse.ok) {
                  response = testResponse;
                  loaded = true;
                  break;
                }
              } catch (e) {
                // Try next path
                continue;
              }
            }
            
            if (!loaded) {
              throw new Error("Could not find TERMS_OF_SERVICE.md in Electron environment");
            }
          } else {
            // Web environment
            response = await fetch("/TERMS_OF_SERVICE.md");
          }
          
          if (!response) {
            throw new Error("Could not fetch TERMS_OF_SERVICE.md");
          }
          
          const text = await response.text();
          setTermsContent(text);
        } catch (error) {
          console.error("Failed to load terms:", error);
          setTermsContent("Failed to load terms. Please try again.");
        }
      };
      loadTerms();
    }
  }, [showTerms, termsContent]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        {/* Modal */}
        <div className="bg-background border shadow-2xl rounded-xl p-6 max-w-md mx-4 transform animate-in fade-in zoom-in duration-200">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Welcome to Stickee!</h2>
              <p className="text-sm text-muted-foreground">
                Please review and agree to our Terms of Service to continue using the application.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleShowTerms}
                variant="outline"
                className="flex items-center justify-center space-x-2 w-full"
              >
                <Link className="h-4 w-4" />
                <span>View Terms of Service</span>
              </Button>
              
              <Button onClick={handleTermsAgree} className="w-full">
                I Agree to Terms of Service
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              You must agree to the terms to use Stickee. You can review the terms anytime in settings.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Dialog */}
      {showTerms && (
        <Dialog open={showTerms} onOpenChange={onShowTermsChange || (() => {})}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Terms of Service</DialogTitle>
            </DialogHeader>
            <div className="mt-4 prose prose-sm max-w-none dark:prose-invert max-h-[60vh] overflow-y-auto">
              <ReactMarkdown>{termsContent || "Loading terms..."}</ReactMarkdown>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => onShowTermsChange?.(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
