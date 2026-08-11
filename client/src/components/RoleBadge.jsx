import { ROLE_LABEL } from "../lib/utils";

const STYLES = {
  admin: "bg-fuchsia-100 text-fuchsia-700",
  manager: "bg-blue-100 text-blue-700",
  employee: "bg-slate-100 text-slate-600",
};

export default function RoleBadge({ role, className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[role]} ${className}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
