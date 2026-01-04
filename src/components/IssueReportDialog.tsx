import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IssueType, createIssue } from "@/services/issueService";
import { cn } from "@/lib/utils";
import { soundEffects } from "@/utils/soundEffects";
import { AlertCircle, Bug, Lightbulb, PlusCircle, HelpCircle, MessageSquare } from "lucide-react";

interface IssueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const issueTypes: { type: IssueType; label: string; icon: React.ReactNode; color: string }[] = [
  { 
    type: 'bug', 
    label: 'Bug', 
    icon: <Bug className="h-4 w-4" />,
    color: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
  },
  { 
    type: 'feature', 
    label: 'Feature', 
    icon: <PlusCircle className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
  },
  { 
    type: 'enhancement', 
    label: 'Enhancement', 
    icon: <Lightbulb className="h-4 w-4" />,
    color: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
  },
  { 
    type: 'question', 
    label: 'Question', 
    icon: <HelpCircle className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
  },
  { 
    type: 'other', 
    label: 'Other', 
    icon: <MessageSquare className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
  },
];

export const IssueReportDialog = ({ open, onOpenChange }: IssueReportDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<IssueType>('bug');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit to 100 characters
    if (value.length <= 100) {
      setTitle(value);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit to 2000 characters
    if (value.length <= 2000) {
      setDescription(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl+Enter to submit
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createIssue({
        title: title.trim(),
        description: description.trim(),
        type: issueType,
      });
      
      soundEffects.playIssueSubmitSound();
      
      // Reset form
      setTitle("");
      setDescription("");
      setIssueType('bug');
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting issue:', error);
      // You could add a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle("");
      setDescription("");
      setIssueType('bug');
      onOpenChange(false);
    }
  };

  const isValid = title.trim() !== "" && description.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Found an Issue?
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-1 overflow-y-auto">
          <div className="order-1 ml-2 mr-4">
            <label className="text-sm font-medium mb-2 block">Issue Type</label>
            <div className="flex gap-2 flex-wrap">
              {issueTypes.map((issue) => (
                <Badge
                  key={issue.type}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    issueType === issue.type ? issue.color : "hover:bg-gray-100"
                  )}
                  onClick={() => setIssueType(issue.type)}
                >
                  <span className="flex items-center gap-1">
                    {issue.icon}
                    {issue.label}
                  </span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="order-2 ml-2 mr-4">
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              placeholder="Brief description of the issue"
              value={title}
              onChange={handleTitleChange}
              maxLength={100}
              className="font-title text-lg dark:text-white dark:placeholder:text-gray-400 max-w-md"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/100 characters
            </p>
          </div>

          <div className="order-3 ml-2 mr-4">
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              placeholder="Detailed description of the issue, steps to reproduce, etc."
              value={description}
              onChange={handleDescriptionChange}
              onKeyDown={handleKeyDown}
              rows={5}
              maxLength={2000}
              className="min-h-[150px] resize-none font-handwriting text-lg dark:text-white dark:placeholder:text-gray-400 w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press Ctrl+Enter to save quickly • Maximum 2000 characters
            </p>
            <div className="text-xs text-muted-foreground mt-1">
              {description.length}/2000 characters
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
