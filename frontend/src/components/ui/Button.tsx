import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg",
  secondary: "bg-white text-slate-900 border border-slate-200 hover:border-slate-300",
  danger: "bg-danger text-white hover:bg-red-700 shadow-md",
  ghost: "bg-transparent text-primary hover:bg-primary-light",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        rounded-full font-semibold tracking-tight
        transition-all duration-200 ease-out
        hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}