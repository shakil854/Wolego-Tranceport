import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LREntryForm from "./pages/LREntryForm";
import PartyMaster from "./pages/PartyMaster";
import LRList from "./pages/LRList";
import FreightReceipt from "./pages/FreightReceipt";
import PartyStatement from "./pages/PartyStatement";
import CAExcelExport from "./pages/CAExcelExport";
import BulkLRPrintPage from "./pages/BulkLRPrintPage";
import LoginPage from "./pages/LoginPage";
import AccountingPage from "./pages/AccountingPage";

// Protected Route for authenticated users
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If party tries to access owner pages, redirect to accounting
    return <Navigate to="/accounting" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === "PARTY" ? "/accounting" : "/lr-entry"} replace /> : <LoginPage />} />

      {/* Main Home Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.role === "PARTY" ? <Navigate to="/accounting" replace /> : <Navigate to="/lr-entry" replace />}
          </ProtectedRoute>
        }
      />

      {/* Accounting Page (Accessible by both Owner and Party) */}
      <Route
        path="/accounting"
        element={
          <ProtectedRoute>
            <AccountingPage />
          </ProtectedRoute>
        }
      />

      {/* Owner Only Routes */}
      <Route
        path="/lr-entry"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <LREntryForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/party-master"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <PartyMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/freight-receipt"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <FreightReceipt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ca-excel"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <CAExcelExport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/range-lr-print"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <BulkLRPrintPage />
          </ProtectedRoute>
        }
      />

      {/* Shared Records & Statement */}
      <Route
        path="/lr-list"
        element={
          <ProtectedRoute>
            <LRList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/party-statement"
        element={
          <ProtectedRoute>
            <PartyStatement />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? (user.role === "PARTY" ? "/accounting" : "/lr-entry") : "/login"} replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 font-sans">
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;