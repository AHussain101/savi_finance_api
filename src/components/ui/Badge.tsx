import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "accent";
}

function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-muted/20 text-muted",
    success: "bg-emerald-500/10 text-emerald-500",
    warning: "bg-amber-500/10 text-amber-500",
    error: "bg-red-500/10 text-red-500",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
