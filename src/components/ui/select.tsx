import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ className, children, ...props }, ref) => <SelectPrimitive.Trigger ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring", className)} {...props}>{children}<SelectPrimitive.Icon><ChevronDown className="h-4 w-4 opacity-60" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(({ className, children, position = "popper", ...props }, ref) => <SelectPrimitive.Portal><SelectPrimitive.Content ref={ref} position={position} className={cn("relative z-50 max-h-60 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md", className)} {...props}><SelectPrimitive.ScrollUpButton><ChevronUp className="mx-auto h-4 w-4" /></SelectPrimitive.ScrollUpButton><SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport><SelectPrimitive.ScrollDownButton><ChevronDown className="mx-auto h-4 w-4" /></SelectPrimitive.ScrollDownButton></SelectPrimitive.Content></SelectPrimitive.Portal>);
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(({ className, children, ...props }, ref) => <SelectPrimitive.Item ref={ref} className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none focus:bg-accent", className)} {...props}><span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="h-4 w-4" /></SelectPrimitive.ItemIndicator></span><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText></SelectPrimitive.Item>);
SelectItem.displayName = SelectPrimitive.Item.displayName;
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem };
