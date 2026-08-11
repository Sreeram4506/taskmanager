import { useState } from "react";
import { LayoutGrid, LogOut, Plus, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import RoleBadge from "./RoleBadge";

export default function Navbar({ search, onSearch, onNewTask }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-lg text-indigo-600 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <LayoutGrid size={18} />
          </div>
          <span className="hidden sm:inline">TaskFlow</span>
        </div>

        <div className="flex-1 max-w-md relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 border border-transparent focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm transition"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition shadow-sm shadow-indigo-600/30"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2"
          >
            <Avatar user={user} size={36} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl card-shadow border border-slate-100 py-2 z-20 animate-fade-in">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <RoleBadge role={user.role} className="mt-1.5" />
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
