import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, className = "", ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-slate-500">{label}</label>
      )}
      <input
        className={`
          px-3.5 py-2.5 rounded-md text-sm outline-none
          border ${error ? "border-danger" : "border-slate-200"}
          focus:border-primary transition-colors duration-150
          ${className}
        `}
        {...rest}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}