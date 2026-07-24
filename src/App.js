import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LREntryForm from "./pages/LREntryForm";
import PartyMaster from "./pages/PartyMaster";
import LRList from "./pages/LRList";
import FreightReceipt from "./pages/FreightReceipt";
import PartyStatement from "./pages/PartyStatement";
import CAExcelExport from "./pages/CAExcelExport";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 font-sans">
          <Routes>
            <Route path="/" element={<Navigate to="/lr-entry" replace />} />
            <Route path="/lr-entry" element={<LREntryForm />} />
            <Route path="/party-master" element={<PartyMaster />} />
            <Route path="/lr-list" element={<LRList />} />
            <Route path="/freight-receipt" element={<FreightReceipt />} />
            <Route path="/party-statement" element={<PartyStatement />} />
            <Route path="/ca-excel" element={<CAExcelExport />} />
            <Route path="*" element={<Navigate to="/lr-entry" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;