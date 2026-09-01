import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none transition-[transform,background-color,opacity] duration-150 ease-out active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
  {
    variants: {
      variant: {
        primary: "bg-teal text-teal-ink shadow-soft",
        secondary: "bg-surface text-ink border border-line",
        ghost: "bg-transparent text-ink",
        good: "bg-good text-bg",
        star: "bg-star text-bg",
      },
      size: {
        sm: "h-10 px-3 text-sm rounded-[12px]",
        md: "h-12 px-5 text-base rounded-[14px]",
        lg: "h-14 px-6 text-lg rounded-[16px]",
        icon: "size-12 rounded-[14px]",
        key: "h-14 w-full min-w-0 rounded-[14px] text-xl font-semibold",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(button({ variant, size }), className)} {...props} />;
}
