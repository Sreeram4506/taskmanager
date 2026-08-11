import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Circle, Clock, ListChecks, Users2 } from "lucide-react";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import TaskCard from "../components/TaskCard";
import CreateTaskModal from "../components/CreateTaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const COLUMNS = [
  { key: "pending", title: "Pending", icon: Circle, dot: "bg-amber-400" },
  { key: "in-progress", title: "In Progress", icon: Clock, dot: "bg-blue-400" },
  { key: "completed", title: "Completed", icon: CheckCircle2, dot: "bg-emerald-400" },
];

const FILTERS = [
  { key: "all", label: "All tasks" },
  { key: "mine", label: "Assigned to me" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/tasks"), api.get("/users")])
      .then(([tRes, uRes]) => {
        setTasks(tRes.data.tasks);
        setUsers(uRes.data.users);
      })
      .catch(() => toast.error("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (filter === "mine") {
      list = list.filter((t) => (t.assignedTo?._id || t.assignedTo?.id) === user.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.assignedTo?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, filter, search, user.id]);

  const stats = useMemo(() => {
    const mine = tasks.filter((t) => (t.assignedTo?._id || t.assignedTo?.id) === user.id);
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      mine: mine.length,
    };
  }, [tasks, user.id]);

  function upsertTask(task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t._id === task._id);
      return exists ? prev.map((t) => (t._id === task._id ? task : t)) : [task, ...prev];
    });
    setActiveTask((prev) => (prev && prev._id === task._id ? task : prev));
  }

  function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    setActiveTask(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar search={search} onSearch={setSearch} onNewTask={() => setCreateOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Here's what the team is working on today.
            </p>
          </div>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 self-start">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  filter === f.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={<ListChecks size={18} className="text-indigo-600" />}
            tint="bg-indigo-50"
            label="Total tasks"
            value={stats.total}
          />
          <StatCard
            icon={<Circle size={18} className="text-amber-600" />}
            tint="bg-amber-50"
            label="Pending"
            value={stats.pending}
          />
          <StatCard
            icon={<Clock size={18} className="text-blue-600" />}
            tint="bg-blue-50"
            label="In progress"
            value={stats.inProgress}
          />
          <StatCard
            icon={<CheckCircle2 size={18} className="text-emerald-600" />}
            tint="bg-emerald-50"
            label="Completed"
            value={stats.completed}
          />
          <StatCard
            icon={<Users2 size={18} className="text-fuchsia-600" />}
            tint="bg-fuchsia-50"
            label="Assigned to me"
            value={stats.mine}
          />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.key);
              const Icon = col.icon;
              return (
                <div key={col.key} className="min-w-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h2 className="font-semibold text-slate-700 text-sm">{col.title}</h2>
                    <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 ml-auto">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[120px]">
                    {colTasks.map((task) => (
                      <TaskCard key={task._id} task={task} onOpen={setActiveTask} />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-slate-200 text-slate-300">
                        <Icon size={20} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {createOpen && (
        <CreateTaskModal
          users={users}
          onClose={() => setCreateOpen(false)}
          onCreated={(task) => {
            upsertTask(task);
            setCreateOpen(false);
          }}
        />
      )}

      {activeTask && (
        <TaskDetailModal
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onUpdated={upsertTask}
          onDeleted={removeTask}
        />
      )}
    </div>
  );
}
