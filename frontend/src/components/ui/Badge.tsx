type Variant = "success" | "danger" | "warning" | "neutral";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  success: "bg-success-light text-success",
  danger: "bg-danger-light text-danger",
  warning: "bg-warning-light text-warning",
  neutral: "bg-slate-100 text-slate-500",
};

export default function Badge({ children, variant = "neutral" }: Props) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}