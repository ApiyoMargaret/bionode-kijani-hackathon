import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

// Utility function for cleanly merging Tailwind classes
import { cn } from "@/lib/utils";

/**
 * Defines the base styling and variants for the Alert component.
 */
const alertVariants = cva(
  // Base styles applied to ALL alerts. 
  // The complex [&>svg...] selectors handle icon alignment automatically:
  // - positions the SVG icon absolutely on the top-left
  // - [&>svg~*]:pl-7 adds left-padding to all siblings so text doesn't overlap the icon
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        // Standard informational alert
        default: "bg-background text-foreground",
        // Error/Warning alert with red styling (destructive theme)
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Main Alert Wrapper
 * Accepts standard div attributes plus the `variant` prop from cva.
 */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div 
    ref={ref} 
    role="alert" // Accessibility: Tells screen readers to announce this message immediately
    className={cn(alertVariants({ variant }), className)} 
    {...props} 
  />
));
// Sets the name for React DevTools debugging
Alert.displayName = "Alert";

/**
 * Alert Title Component
 * Renders as an <h5> element for semantic heading structure inside the alert.
 */
const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

/**
 * Alert Description Component
 * Wraps the body content of the alert.
 */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    // [&_p]:leading-relaxed ensures any nested <p> tags have a readable line height
    className={cn("text-sm [&_p]:leading-relaxed", className)} 
    {...props} 
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
