import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface IssueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IssueReportDialog = ({ open, onOpenChange }: IssueReportDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Report an Issue
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Please submit an issue at{" "}
            <a
              href="https://github.com/slammers001/stickee/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline hover:text-primary/80 transition-colors"
            >
              github.com/slammers001/stickee/issues
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
