import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Bug, AlertTriangle, Lightbulb, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

const issueTypes = [
  { value: "bug", label: "Bug Report", icon: Bug, description: "Something isn't working as expected" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, description: "I have an idea for a new feature" },
  { value: "improvement", label: "Improvement", icon: AlertTriangle, description: "I have a suggestion to make things better" },
  { value: "feedback", label: "General Feedback", icon: MessageSquare, description: "I want to share my thoughts" },
];

export default function Report() {
  const navigate = useNavigate();
  const { isOpen: sidebarOpen, toggleSidebar, isCollapsed, toggleCollapse, activeView, setActiveView } = useSidebar();
  
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    email: "",
    steps: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Issue report submitted successfully! Thank you for your feedback.");
      
      // Reset form
      setFormData({
        type: "",
        title: "",
        description: "",
        email: "",
        steps: "",
      });
      
      // Navigate back to home
      navigate("/");
    } catch (error) {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 group p-2 bg-card border rounded-md shadow-md hover:bg-[hsl(var(--note-pink))] dark:hover:bg-[hsl(var(--note-pink)/0.8)] transition-colors"
      >
        <ArrowLeft className="h-5 w-5 text-black dark:text-white transition-colors" />
      </button>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        onToggleCollapse={toggleCollapse}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Header */}
      <header className={cn(
        "border-b bg-card shadow-sm transition-all duration-300",
        isCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="group hover:bg-[hsl(var(--note-pink))] dark:hover:bg-[hsl(var(--note-pink)/0.8)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-black dark:text-white transition-colors" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Report Issue</h1>
              <p className="text-sm text-muted-foreground">Help us improve Stickee</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "container mx-auto px-4 py-8 transition-all duration-300",
        isCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Submit an Issue Report
              </CardTitle>
              <CardDescription>
                Tell us what's on your mind. We read every report and take your feedback seriously.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Issue Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Issue Type *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-full p-3 border rounded-md bg-background text-foreground"
                    required
                  >
                    <option value="">Select an issue type</option>
                    {issueTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formData.type && (
                    <p className="text-sm text-muted-foreground">
                      {issueTypes.find(t => t.value === formData.type)?.description}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the issue or suggestion"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {/* Steps to Reproduce (for bugs) */}
                {formData.type === "bug" && (
                  <div className="space-y-2">
                    <Label htmlFor="steps">Steps to Reproduce</Label>
                    <Textarea
                      id="steps"
                      placeholder="1. Go to...\n2. Click on...\n3. See error..."
                      value={formData.steps}
                      onChange={(e) => handleInputChange("steps", e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    We may contact you for more information about your report
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="group hover:bg-[hsl(var(--note-pink))] dark:hover:bg-[hsl(var(--note-pink)/0.8)] transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[hsl(var(--note-pink))] hover:bg-[hsl(var(--note-pink)/0.9)] text-black"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
