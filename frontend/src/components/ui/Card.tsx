import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
};

const paddingClasses = {
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export default function Card({ children, className = "", padding = "md" }: Props) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-card ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}