import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl border text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "border-[#D4A574]/35 bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-[#02120e] hover:brightness-105",
        secondary:
          "border-[#D4A574]/20 bg-[#1B4D3E]/45 text-[#f5f5f0] hover:border-[#D4A574]/35 hover:bg-[#1B4D3E]/65",
        ghost:
          "border-transparent bg-transparent text-[#D4A574] hover:border-[#D4A574]/25 hover:bg-[#1B4D3E]/30 hover:text-[#f5f5f0]",
        destructive: "border-rose-400/35 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
        outline:
          "border-[#D4A574]/25 bg-[#02120e]/40 text-[#f5f5f0] hover:border-[#D4A574]/40 hover:bg-[#1B4D3E]/30",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
