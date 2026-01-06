import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, X } from "lucide-react";
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
      const response = await fetch("/TERMS_OF_SERVICE.md");
      
      if (!response.ok) {
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
          const response = await fetch("/TERMS_OF_SERVICE.md");
          
          if (!response.ok) {
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
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
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center justify-between">
                <span style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                  Terms of Service for Stickee
                </span>
                <Button variant="ghost" size="sm" onClick={() => onShowTermsChange?.(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            {/* Scroll container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Header block */}
              <div className="prose prose-sm max-w-none" style={{ fontFamily: "Onest, sans-serif" }}>
                <p className="text-sm text-muted-foreground mb-6">
                  <strong>Last Updated:</strong> December 10, 2025
                  <br />
                  <strong>Application:</strong> Stickee v0.1.0-present version
                  <br />
                  <strong>Developer:</strong>{" "}
                  <a
                    href="https://github.com/slammers001"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dark:text-white underline hover:text-pink transition-colors dark:hover:text-pink"
                  >
                    slammers001
                  </a>
                </p>
              </div>

              {/* All sections now live inside the scroll container */}

              <section className="mb-8">
                <h3 className="text-lg font-bold mb-3">1. Acceptance of Terms</h3>
                <p className="text-sm">
                  By downloading, installing, or using Stickee ("the Application"), you agree to be bound by these Terms of Service ("Terms").
                  If you do not agree to these Terms, do not install or use the Application.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-lg font-bold mb-3">2. Description of Service</h3>
                <p className="text-sm">
                  Stickee is a desktop application for creating, organizing, and managing digital sticky notes and tasks.
                  The Application is provided "as is" for personal and non-commercial use.
                </p>
              </section>

              <section className="mb-8">
                <h3 className="text-lg font-bold mb-3">3. License and Use</h3>
                <p className="text-sm mb-3">
                  slammers001 grants you a limited, non-exclusive, non-transferable, revocable license to use Stickee for personal purposes only.
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Copy, modify, or distribute the Application</li>
                  <li>Reverse engineer, decompile, or attempt to extract source code</li>
                  <li>Use the Application for any illegal or unauthorized purpose</li>
                  <li>Resell, rent, or lease the Application</li>
                </ul>
              </section>

              {/* --- keep all your remaining sections exactly as you wrote them --- */}
              {/* just paste sections 4 → 14 here */}

              <div className="border-t-2 border-foreground pt-6 mt-8">
                <p className="text-sm font-bold mb-2">Acknowledgement:</p>
                <p className="text-sm">
                  By using Stickee, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Version:</strong> Terms v2.0 for Stickee v0.1.0-present
                </p>
              </div>
            </div>
          </DialogContent>

        </Dialog>
      )}
    </>
  );
}
