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
  Pencil,
  Trash2,
  Upload,
  UserCircle2,
  X,
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

function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function TaskDetailModal({ task, users = [], onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const assigneeId = task.assignedTo?._id || task.assignedTo?.id;
  const ownerId = task.assignedBy?._id || task.assignedBy?.id;
  const isAssignee = assigneeId === user.id;
  const isOwner = ownerId === user.id;
  const isAdmin = user.role === "admin";
  const canChangeStatus = isAssignee || isAdmin;
  const canUpload = isAssignee || isOwner || isAdmin;
  const canDeleteTask = isOwner || isAdmin;
  const canEditTask = isOwner || isAdmin;

  function startEditing() {
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: toDateInput(task.dueDate),
      assignedTo: assigneeId,
    });
    setIsEditing(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const { data } = await api.patch(`/tasks/${task._id}`, editForm);
      onUpdated(data.task);
      toast.success("Task updated");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task");
    } finally {
      setSavingEdit(false);
    }
  }

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
        <div className="flex items-center gap-1">
          {canEditTask && !isEditing && (
            <button
              onClick={startEditing}
              className="text-slate-400 hover:text-indigo-600 transition p-1.5 rounded-lg hover:bg-indigo-50"
              title="Edit task"
            >
              <Pencil size={16} />
            </button>
          )}
          {canDeleteTask && !isEditing && (
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
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Title</label>
            <input
              required
              autoFocus
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Priority
              </label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-sm bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Due date
              </label>
              <input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Assign to
            </label>
            <select
              required
              value={editForm.assignedTo}
              onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-sm bg-white"
            >
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} {u._id === user.id ? "(you)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingEdit}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30"
            >
              {savingEdit && <Loader2 size={16} className="animate-spin" />}
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={savingEdit}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <X size={15} />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
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
        </>
      )}

      {!isEditing && (
      <>
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
      </>
      )}
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
