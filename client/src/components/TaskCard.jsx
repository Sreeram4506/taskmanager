import { Calendar, Paperclip, Lock } from "lucide-react";
import { format, isPast } from "date-fns";
import Avatar from "./Avatar";
import { PRIORITY_STYLES } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

export default function TaskCard({ task, onOpen }) {
  const { user } = useAuth();
  const isAssignee = task.assignedTo?.id === user.id || task.assignedTo?._id === user.id;
  const overdue =
    task.dueDate && task.status !== "completed" && isPast(new Date(task.dueDate));

  return (
    <button
      onClick={() => onOpen(task)}
      className="w-full text-left bg-white border border-slate-100 rounded-xl p-4 card-shadow hover:border-indigo-200 hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>
        {!isAssignee && (
          <Lock size={13} className="text-slate-300 shrink-0" title="Only the assignee can update status" />
        )}
      </div>

      <h3 className="font-semibold text-slate-900 text-[15px] leading-snug mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
        {task.title}
      </h3>
      {task.description && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar user={task.assignedTo} size={24} />
          <span className="text-xs text-slate-500 truncate">{task.assignedTo?.name}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 shrink-0">
          {task.documents?.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs">
              <Paperclip size={12} />
              {task.documents.length}
            </span>
          )}
          {task.dueDate && (
            <span
              className={`flex items-center gap-0.5 text-xs ${overdue ? "text-rose-500 font-medium" : ""}`}
            >
              <Calendar size={12} />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
