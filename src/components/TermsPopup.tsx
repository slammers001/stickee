import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "lucide-react";

interface TermsPopupProps {
  onAgree: () => void;
}

export function TermsPopup({ onAgree }: TermsPopupProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [termsContent, setTermsContent] = useState("");

  const handleShowTerms = async () => {
    try {
      const response = await fetch("/terms.md");
      const text = await response.text();
      setTermsContent(text);
      setShowTerms(true);
    } catch (error) {
      console.error("Failed to load terms:", error);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 bg-background border shadow-lg rounded-lg p-4 max-w-sm z-50">
        <div className="space-y-3">
          <p className="text-sm font-medium">Agree To Terms of Service</p>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleShowTerms}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Link className="h-3 w-3" />
              <span>Terms of Service</span>
            </Button>
            <Button onClick={onAgree} size="sm">
              Agree
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
              {termsContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
