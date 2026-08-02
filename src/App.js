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
import LetterPadPage from "./pages/LetterPadPage";
import TruckPaymentPage from "./pages/TruckPaymentPage";
import PaymentAlertsPage from "./pages/PaymentAlertsPage";
import TruckAccountingPage from "./pages/TruckAccountingPage";
import TruckComingPage from "./pages/TruckComingPage";

import DashboardPage from "./pages/DashboardPage";

// Protected Route for authenticated users
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "TRUCK") return <Navigate to="/truck-accounting" replace />;
    if (user.role === "PARTY") return <Navigate to="/accounting" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  const getHomeRedirect = (role) => {
    if (role === "TRUCK") return "/truck-accounting";
    if (role === "PARTY") return "/accounting";
    return "/dashboard";
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getHomeRedirect(user.role)} replace /> : <LoginPage />} />

      {/* Main Home Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to={getHomeRedirect(user?.role)} replace />
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

      {/* Truck Accounting Page (Accessible by Owner and Truck role) */}
      <Route
        path="/truck-accounting"
        element={
          <ProtectedRoute allowedRoles={["OWNER", "TRUCK"]}>
            <TruckAccountingPage />
          </ProtectedRoute>
        }
      />

      {/* Accounting Page (Accessible by Owner and Party) */}
      <Route
        path="/accounting"
        element={
          <ProtectedRoute allowedRoles={["OWNER", "PARTY"]}>
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
      <Route
        path="/letter-pad"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <LetterPadPage />
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
      <Route
        path="/truck-payments"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <TruckPaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-alerts"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <PaymentAlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/truck-coming"
        element={
          <ProtectedRoute allowedRoles={["OWNER"]}>
            <TruckComingPage />
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