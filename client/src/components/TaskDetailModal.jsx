import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  Download,
  File,
  Loader2,
  Lock,
  Paperclip,
  Trash2,
  Upload,
  UserCircle2,
} from "lucide-react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import RoleBadge from "./RoleBadge";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { formatBytes, PRIORITY_STYLES } from "../lib/utils";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: Circle },
  { value: "in-progress", label: "In Progress", icon: Clock },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
];

export default function TaskDetailModal({ task, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const assigneeId = task.assignedTo?._id || task.assignedTo?.id;
  const ownerId = task.assignedBy?._id || task.assignedBy?.id;
  const isAssignee = assigneeId === user.id;
  const isOwner = ownerId === user.id;
  const isAdmin = user.role === "admin";
  const canChangeStatus = isAssignee || isAdmin;
  const canUpload = isAssignee || isOwner || isAdmin;
  const canDeleteTask = isOwner || isAdmin;

  async function changeStatus(status) {
    if (status === task.status) return;
    setStatusLoading(true);
    try {
      const { data } = await api.patch(`/tasks/${task._id}/status`, { status });
      onUpdated(data.task);
      toast.success(
        status === "completed" ? "Task marked complete " : `Status set to ${status}`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("documents", f));
    setUploading(true);
    try {
      const { data } = await api.post(`/tasks/${task._id}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdated(data.task);
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(doc) {
    try {
      const res = await api.get(`/tasks/${task._id}/documents/${doc._id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file");
    }
  }

  async function handleDeleteDoc(doc) {
    try {
      const { data } = await api.delete(`/tasks/${task._id}/documents/${doc._id}`);
      onUpdated(data.task);
      toast.success("Document removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove document");
    }
  }

  async function handleDeleteTask() {
    if (!confirm("Delete this task permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success("Task deleted");
      onDeleted(task._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
      setDeleting(false);
    }
  }

  return (
    <Modal title="Task details" onClose={onClose} width="max-w-2xl">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority} priority
        </span>
        {canDeleteTask && (
          <button
            onClick={handleDeleteTask}
            disabled={deleting}
            className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50"
            title="Delete task"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        )}
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">{task.title}</h2>
      {task.description && (
        <p className="text-slate-600 text-sm mb-5 whitespace-pre-wrap">{task.description}</p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-5">
        <PersonBlock label="Assigned to" personObj={task.assignedTo} />
        <PersonBlock label="Assigned by" personObj={task.assignedBy} />
      </div>

      {task.dueDate && (
        <p className="text-sm text-slate-500 mb-5 flex items-center gap-1.5">
          <Clock size={14} /> Due {format(new Date(task.dueDate), "MMMM d, yyyy")}
        </p>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Status</label>
          {!canChangeStatus && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Lock size={12} /> Only {task.assignedTo?.name} can update this
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = task.status === opt.value;
            const disabled = !canChangeStatus || statusLoading;
            return (
              <button
                key={opt.value}
                disabled={disabled}
                onClick={() => changeStatus(opt.value)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition ${
                  active
                    ? opt.value === "completed"
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : opt.value === "in-progress"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-amber-500 border-amber-500 text-white"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                } ${disabled && !active ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Icon size={14} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Paperclip size={14} /> Documents
          </label>
          {canUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition"
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              Push document
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFiles}
          />
        </div>

        {task.documents?.length ? (
          <ul className="space-y-2">
            {task.documents.map((doc) => (
              <li
                key={doc._id}
                className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
              >
                <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <File size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {doc.originalName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(doc.size)} · {doc.uploadedBy?.name} ·{" "}
                    {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                  title="Download"
                >
                  <Download size={15} />
                </button>
                {(doc.uploadedBy?._id === user.id || isAdmin) && (
                  <button
                    onClick={() => handleDeleteDoc(doc)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
            No documents yet
          </p>
        )}
      </div>
    </Modal>
  );
}

function PersonBlock({ label, personObj }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      {personObj ? (
        <div className="flex items-center gap-2">
          <Avatar user={personObj} size={28} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{personObj.name}</p>
            <RoleBadge role={personObj.role} />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <UserCircle2 size={20} /> Unknown
        </div>
      )}
    </div>
  );
}
