import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BrandProvider } from "@/context/BrandContext";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import RegisterOwner from "@/pages/RegisterOwner";
import RegisterMember from "@/pages/RegisterMember";
import MembershipCheck from "@/pages/MembershipCheck";
import AdminDashboard from "@/pages/AdminDashboard";
import OwnerDashboard from "@/pages/OwnerDashboard";
import MemberDashboard from "@/pages/MemberDashboard";
import GymPortal from "@/pages/GymPortal";

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-white/50" data-testid="loading">Cargando...</div>;
  if (!user || user === false) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <BrandProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/owner" element={<RegisterOwner />} />
              <Route path="/register/member" element={<RegisterMember />} />
              <Route path="/membership-check" element={<MembershipCheck />} />
              <Route path="/g/:slug" element={<GymPortal />} />
              <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
              <Route path="/owner" element={<Protected role="owner"><OwnerDashboard /></Protected>} />
              <Route path="/member" element={<Protected role="member"><MemberDashboard /></Protected>} />
            </Routes>
          </BrandProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
