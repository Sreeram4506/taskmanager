import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutGrid } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
          <LayoutGrid size={22} />
          <span className="font-semibold">TaskFlow</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
