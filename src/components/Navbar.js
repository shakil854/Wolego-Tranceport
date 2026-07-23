import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Truck, Users, FileText, Menu, X, Phone, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "L/R Entry", path: "/lr-entry", icon: Truck },
    { name: "Party Master", path: "/party-master", icon: Users },
    { name: "LR Records", path: "/lr-list", icon: FileText },
  ];

  const isActive = (path) => {
    if (path === "/lr-entry" && (location.pathname === "/" || location.pathname === "/lr-entry")) return true;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-amber-500/40">
      {/* Top Info Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-4 py-1 text-xs font-semibold flex justify-between items-center text-white">
        <div className="flex items-center space-x-3 overflow-hidden text-ellipsis whitespace-nowrap">
          <span>📍 8-A NATIONAL HIGHWAY, CHOTILA ROAD, WANKANER-363621 (GUJ.)</span>
          <span className="hidden md:inline">| GSTIN: 24DLTPS8567M1ZT</span>
        </div>
        <div className="flex items-center space-x-3 text-amber-100 shrink-0">
          <span className="flex items-center gap-1"><Phone size={12}/> +91 9979111555</span>
          <span className="hidden sm:inline-flex items-center gap-1"><ShieldCheck size={12}/> Goods Consignment Note</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-amber-500 p-2 rounded-lg text-slate-950 font-black shadow-lg transform group-hover:scale-105 transition-transform flex items-center justify-center">
              <Truck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-wider text-amber-400 font-serif leading-none flex items-center gap-2">
                WOLEGO TRANSPORT
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                Transport Contractor & Commission Agent
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                      : "text-slate-200 hover:bg-slate-800 hover:text-amber-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium ${
                  active
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-amber-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
