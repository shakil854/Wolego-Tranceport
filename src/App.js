import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import PartyLRRecordsPage from "./pages/PartyLRRecordsPage";
import PartyOrdersPage from "./pages/PartyOrdersPage";
import TruckOrdersPage from "./pages/TruckOrdersPage";

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
    if (user.role === "OFFICE") return <Navigate to="/lr-entry" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  const getHomeRedirect = (role) => {
    if (role === "TRUCK") return "/truck-accounting";
    if (role === "PARTY") return "/accounting";
    if (role === "OFFICE") return "/lr-entry";
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

      {/* Truck Orders Page (Accessible by Owner and Truck role) */}
      <Route
        path="/truck-orders"
        element={
          <ProtectedRoute allowedRoles={["OWNER", "TRUCK"]}>
            <TruckOrdersPage />
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

      {/* Party LR Records Page (Accessible by Owner and Party) */}
      <Route
        path="/party-lr-records"
        element={
          <ProtectedRoute allowedRoles={["OWNER", "PARTY"]}>
            <PartyLRRecordsPage />
          </ProtectedRoute>
        }
      />

      {/* Party Orders Page (Accessible by Owner and Party) */}
      <Route
        path="/party-orders"
        element={
          <ProtectedRoute allowedRoles={["OWNER", "PARTY"]}>
            <PartyOrdersPage />
          </ProtectedRoute>
        }
      />

      {/* Routes Accessible by Owner & Office */}
      <Route
        path="/lr-entry"
        element={
          <ProtectedRoute allowedRoles={["OWNER", "OFFICE"]}>
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
          <ProtectedRoute allowedRoles={["OWNER", "OFFICE"]}>
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

      {/* Records & Statements */}
      <Route
        path="/lr-list"
        element={
          <ProtectedRoute allowedRoles={["OWNER", "OFFICE"]}>
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
        element={
          <Navigate
            to={
              user
                ? user.role === "PARTY"
                  ? "/accounting"
                  : user.role === "TRUCK"
                  ? "/truck-accounting"
                  : user.role === "OFFICE"
                  ? "/lr-entry"
                  : "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  );
}

// Global Escape key shortcut handler component
function GlobalEscapeHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        if (!user) return;
        const targetRoute =
          user.role === "TRUCK"
            ? "/truck-accounting"
            : user.role === "PARTY"
            ? "/accounting"
            : user.role === "OFFICE"
            ? "/lr-entry"
            : "/dashboard";

        if (location.pathname !== targetRoute) {
          navigate(targetRoute);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, location.pathname, user]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalEscapeHandler />
        <div className="h-screen w-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
          <Navbar />
          <main className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto md:overflow-hidden">
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;