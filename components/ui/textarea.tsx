import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-[120px] w-full rounded-xl border border-[#D4A574]/25 bg-[#02120e]/75 px-3 py-2 text-sm text-[#f5f5f0] placeholder:text-[#6e7d78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/55",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
