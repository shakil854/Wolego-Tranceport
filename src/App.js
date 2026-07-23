import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LREntryForm from "./pages/LREntryForm";
import PartyMaster from "./pages/PartyMaster";
import LRList from "./pages/LRList";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/lr-entry" replace />} />
            <Route path="/lr-entry" element={<LREntryForm />} />
            <Route path="/party-master" element={<PartyMaster />} />
            <Route path="/lr-list" element={<LRList />} />
            <Route path="*" element={<Navigate to="/lr-entry" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;