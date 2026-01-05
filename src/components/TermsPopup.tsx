import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, X } from "lucide-react";
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
                <span style={{ fontFamily: 'arbutus, serif' }}>Terms of Service for Stickee</span>
                <Button variant="ghost" size="sm" onClick={() => onShowTermsChange?.(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none" style={{ fontFamily: 'Onest, sans-serif' }}>
                <p className="text-sm text-muted-foreground mb-6">
                  <strong>Last Updated:</strong> December 10, 2025<br />
                  <strong>Application:</strong> Stickee v0.1.0-present version<br />
                  <strong>Developer:</strong> <a href="https://github.com/slammers001" target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-primary transition-colors">slammers001</a>
                </p>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>1. Acceptance of Terms</h3>
                  <p className="text-sm">
                    By downloading, installing, or using Stickee ("the Application"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not install or use the Application.
                  </p>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>2. Description of Service</h3>
                  <p className="text-sm">
                    Stickee is a desktop application for creating, organizing, and managing digital sticky notes and tasks. The Application is provided "as is" for personal and non-commercial use.
                  </p>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>3. License and Use</h3>
                  <p className="text-sm mb-3">
                    <a href="https://github.com/slammers001" target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-primary transition-colors">slammers001</a> grants you a limited, non-exclusive, non-transferable, revocable license to use Stickee for personal purposes only. You may not:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Copy, modify, or distribute the Application</li>
                    <li>Reverse engineer, decompile, or attempt to extract source code</li>
                    <li>Use the Application for any illegal or unauthorized purpose</li>
                    <li>Resell, rent, or lease the Application to third parties</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>4. System Requirements and Compatibility</h3>
                  <p className="text-sm">
                    Stickee v0.1.0 is currently available only for Windows operating systems. You are responsible for ensuring your system meets the minimum requirements for installation and operation.
                  </p>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>5. Data and Privacy</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm" style={{ fontFamily: 'arbutus, serif' }}>5.1 Local Storage</h4>
                      <p className="text-sm">
                        Stickee stores all note data locally on your device. No data is transmitted to external servers unless explicitly configured by you for backup purposes.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm" style={{ fontFamily: 'arbutus, serif' }}>5.2 Data Responsibility</h4>
                      <p className="text-sm">
                        You are solely responsible for:
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Backing up your note data</li>
                        <li>Protecting your device from data loss</li>
                        <li>Maintaining the security of your system</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>6. Intellectual Property</h3>
                  <p className="text-sm mb-3">
                    All rights, title, and interest in Stickee, including all intellectual property rights, remain the exclusive property of <a href="https://github.com/slammers001" target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-primary transition-colors">slammers001</a>. This includes but is not limited to:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Application code and design</li>
                    <li>User interface elements</li>
                    <li>Documentation</li>
                    <li>Trademarks and logos</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>7. Disclaimer of Warranties</h3>
                  <p className="text-sm font-bold">
                    STICKEE IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>MERCHANTABILITY</li>
                    <li>FITNESS FOR A PARTICULAR PURPOSE</li>
                    <li>NON-INFRINGEMENT</li>
                    <li>ERROR-FREE OPERATION</li>
                    <li>CONTINUOUS AVAILABILITY</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>8. Limitation of Liability</h3>
                  <p className="text-sm font-bold">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, <a href="https://github.com/slammers001" target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-primary transition-colors">SLAMMERS001</a> SHALL NOT BE LIABLE FOR:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>ANY DIRECT, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
                    <li>DATA LOSS OR CORRUPTION</li>
                    <li>LOSS OF PROFITS OR BUSINESS OPPORTUNITIES</li>
                    <li>ANY CLAIMS ARISING FROM YOUR USE OF THE APPLICATION</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>9. Updates and Modifications</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm" style={{ fontFamily: 'arbutus, serif' }}>9.1 Application Updates</h4>
                      <p className="text-sm">
                        <a href="https://github.com/slammers001" target="_blank" rel="noopener noreferrer" className="text-black underline hover:text-primary transition-colors">Slammers001</a> may release updates, patches, or new versions of Stickee. These Terms will apply to all updates unless superseded by new terms.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm" style={{ fontFamily: 'arbutus, serif' }}>9.2 Terms Updates</h4>
                      <p className="text-sm">
                        These Terms may be updated periodically. Continued use of Stickee after changes constitutes acceptance of the modified Terms.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>10. Termination</h3>
                  <p className="text-sm">
                    Your license to use Stickee terminates automatically if you:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Fail to comply with these Terms</li>
                    <li>Destroy all copies of the Application</li>
                    <li>Request removal from your system</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>11. Third-Party Components</h3>
                  <p className="text-sm mb-3">
                    Stickee uses the following open-source technologies:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Tauri</li>
                    <li>React</li>
                    <li>TypeScript</li>
                    <li>Tailwind CSS</li>
                    <li>shadcn/ui components</li>
                    <li>TanStack Query</li>
                    <li>Vite</li>
                  </ul>
                  <p className="text-sm">
                    Their respective licenses apply to their components.
                  </p>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>12. User Responsibilities</h3>
                  <p className="text-sm">
                    You agree to:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Use Stickee only for lawful purposes</li>
                    <li>Not use the Application to store sensitive or regulated data without appropriate safeguards</li>
                    <li>Maintain reasonable security for your device</li>
                    <li>Acknowledge that this release has potential limitations</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>13. Severability</h3>
                  <p className="text-sm">
                    If any provision of these Terms is found invalid or unenforceable, the remaining provisions will remain in full effect.
                  </p>
                </section>

                <section className="mb-8">
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'arbutus, serif' }}>14. Contact Information</h3>
                  <p className="text-sm">
                    For questions about these Terms, email: <a href="mailto:hi@simicodes.xyz" className="text-black underline hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">hi@simicodes.xyz</a> or contact: <a href="https://github.com/slammers001" className="text-black underline hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">github.com/slammers001</a>
                  </p>
                </section>

                <div className="border-t-2 border-foreground pt-6 mt-8">
                  <p className="text-sm font-bold mb-2" style={{ fontFamily: 'arbutus, serif' }}>Acknowledgement:</p>
                  <p className="text-sm">
                    By using Stickee, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Version:</strong> Terms v2.0 for Stickee v0.1.0-present
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
