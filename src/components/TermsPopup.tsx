import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { ensureUserExists, saveTermsAgreement } from "@/services/userService";
import { TermsOfService } from "@/components/TermsOfService";

interface TermsPopupProps {
  onAgree: () => void;
  showTerms: boolean;
  onShowTermsChange: (show: boolean) => void;
}

export function TermsPopup({ onAgree, showTerms, onShowTermsChange }: TermsPopupProps) {
  const saveAgreement = async () => {
    try {
      const userExists = await ensureUserExists();
      if (userExists) {
        const saved = await saveTermsAgreement();
        if (!saved) {
          console.error("Failed to save terms agreement to Supabase");
        }
      }
    } catch (error) {
      console.error("Failed to save terms agreement to Supabase:", error);
    }
  };

  const handleTermsAgree = () => {
    // Unlock the app immediately; remote persistence is best-effort and should
    // never leave the agreement button looking frozen.
    localStorage.setItem("stickee-terms-agreed", "true");
    onAgree();
    void saveAgreement();
  };

  // Only render one modal at a time. Previously, the welcome backdrop had a
  // higher z-index than the terms dialog and intercepted every click.
  if (showTerms) {
    return (
      <TermsOfService
        isOpen
        onClose={() => onShowTermsChange(false)}
        onAgree={handleTermsAgree}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
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
              onClick={() => onShowTermsChange(true)}
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
  );
}
