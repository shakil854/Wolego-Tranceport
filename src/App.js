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
import TruckMaster from "./pages/TruckMaster";
import DailyReport from "./pages/DailyReport";

import DashboardPage from "./pages/DashboardPage";

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
      <Route path="/login" element={user ? <Navigate to={user.role === "PARTY" ? "/accounting" : "/dashboard"} replace /> : <LoginPage />} />

      {/* Main Home Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.role === "PARTY" ? <Navigate to="/accounting" replace /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        }
      />

      {/* Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <DashboardPage />
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
        path="/truck-master"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <TruckMaster />
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

      {/* Owner Only Records & Statements */}
      <Route
        path="/lr-list"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <LRList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/party-statement"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <PartyStatement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/daily-report"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <DailyReport />
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
        <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
          <Navbar />
          <main className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto">
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;