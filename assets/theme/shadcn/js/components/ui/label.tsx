import * as React from "react"

import { cn } from "@shadcnComponents/lib/utils"

/**
 * Plain semantic <label>, not Radix's react-label — this project doesn't have that
 * dependency installed, and a real <label for=/htmlFor> gives the same behavior for a
 * simple form field without adding one.
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
