import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IssueReportDialog } from "./IssueReportDialog";
import { AlertCircle } from "lucide-react";

interface IssueReportButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const IssueReportButton = ({ 
  className = "",
  variant = "outline",
  size = "default"
}: IssueReportButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <AlertCircle className="h-4 w-4" />
        Found an Issue
      </Button>
      
      <IssueReportDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
};
