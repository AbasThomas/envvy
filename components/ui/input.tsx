import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-[#D4A574]/25 bg-[#02120e]/75 px-3 text-sm text-[#f5f5f0] placeholder:text-[#6e7d78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574]/55",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
