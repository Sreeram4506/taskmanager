import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { File, Loader2, Paperclip, X } from "lucide-react";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { formatBytes } from "../lib/utils";

const MAX_FILES = 5;

export default function CreateTaskModal({ users, onClose, onCreated }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  function handleFilesPicked(e) {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setFiles((prev) => {
      const combined = [...prev, ...picked];
      if (combined.length > MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} files`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
    e.target.value = "";
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.assignedTo) {
      toast.error("Please choose an assignee");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      files.forEach((file) => fd.append("documents", file));

      const { data } = await api.post("/tasks", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Task created");
      onCreated(data.task);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Create a new task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Title</label>
          <input
            required
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Prepare Q3 budget report"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Add details about this task..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
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
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
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
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition text-sm bg-white"
          >
            <option value="" disabled>
              Select a team member
            </option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} {u._id === user.id ? "(you)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Paperclip size={14} /> Documents
            </label>
            {files.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
              >
                Add files
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFilesPicked}
            />
          </div>

          {files.length > 0 ? (
            <ul className="space-y-2">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                >
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <File size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 text-sm text-slate-400 text-center border border-dashed border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-500 transition"
            >
              Push documents to this task (optional)
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Create task
        </button>
      </form>
    </Modal>
  );
}
