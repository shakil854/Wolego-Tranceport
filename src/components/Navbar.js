import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ChangePasswordModal from "./ChangePasswordModal";
import ChangeActionPasswordModal from "./ChangeActionPasswordModal";
import {
  Truck,
  Users,
  FileText,
  Receipt,
  Menu,
  X,
  Phone,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  FolderKanban,
  Calculator,
  LogOut,
  LogIn,
  User,
  Key,
  LayoutDashboard,
  Bell,
  Lock,
  Palette,
} from "lucide-react";
import logoImg from "../assets/logo.png";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isOwner, isParty, isTruck } = useAuth();
  const { theme, setTheme, THEMES } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [desktopThemeOpen, setDesktopThemeOpen] = useState(false);
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChangeActionPasswordOpen, setIsChangeActionPasswordOpen] = useState(false);
  const dropdownRef = useRef(null);
  const desktopThemeRef = useRef(null);
  const mobileThemeRef = useRef(null);

  // Primary Navigation Items for Owner
  const ownerPrimaryItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "L/R Entry", path: "/lr-entry", icon: Truck },
    { name: "LR Records", path: "/lr-list", icon: FileText },
    { name: "Freight Receipt", path: "/freight-receipt", icon: Receipt },
  ];

  // Primary Navigation Items for Party
  const partyPrimaryItems = [
    { name: "My Accounting", path: "/accounting", icon: Calculator },
    { name: "My LR Records", path: "/party-lr-records", icon: FileText },
    { name: "Party Orders", path: "/party-orders", icon: FileText },
  ];

  // Primary Navigation Items for Truck Owner
  const truckPrimaryItems = [
    { name: "My Truck Accounting", path: "/truck-accounting", icon: Truck },
    { name: "Truck Orders", path: "/truck-orders", icon: Truck },
  ];

  const primaryItems = isTruck ? truckPrimaryItems : isParty ? partyPrimaryItems : ownerPrimaryItems;

  // Dropdown Items (Owner only)
  const dropdownItems = [
    { name: "Party Orders", path: "/party-orders", icon: FileText },
    { name: "Truck Orders", path: "/truck-orders", icon: Truck },
    { name: "Daily Report", path: "/daily-report", icon: FileText },
    { name: "Accounting", path: "/accounting", icon: Calculator },
    { name: "Range LR Print", path: "/range-lr-print", icon: Printer },
    { name: "Party Statement", path: "/party-statement", icon: FileSpreadsheet },
    { name: "CA Excel", path: "/ca-excel", icon: FileSpreadsheet },
    { name: "Party Master", path: "/party-master", icon: Users },
    { name: "Truck Master", path: "/truck-master", icon: Truck },
    { name: "Letter Pad", path: "/letter-pad", icon: FileText },
    { name: "Truck Debit", path: "/truck-payments", icon: Truck },
    { name: "Payment Alerts", path: "/payment-alerts", icon: Bell },
    { name: "Truck Coming", path: "/truck-coming", icon: Truck },
  ];

  const isActive = (path) => {
    if (path === "/dashboard" && (location.pathname === "/" || location.pathname === "/dashboard")) return true;
    return location.pathname.startsWith(path);
  };

  const isDropdownActive = dropdownItems.some((item) => isActive(item.path));

  // Close dropdowns when user clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (desktopThemeRef.current && !desktopThemeRef.current.contains(event.target)) {
        setDesktopThemeOpen(false);
      }
      if (mobileThemeRef.current && !mobileThemeRef.current.contains(event.target)) {
        setMobileThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Hide Navbar before login or on /login page
  if (!user || location.pathname === "/login") {
    return null;
  }

  return (
    <header className="bg-white text-slate-900 shadow-md sticky top-0 z-50 border-b border-slate-200 font-sans">

      {/* Main Navbar */}
      <div className="w-full max-w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-6">

          {/* Logo / Brand */}
          <Link to={isParty ? "/accounting" : isTruck ? "/truck-accounting" : "/"} className="flex items-center space-x-2.5 shrink-0 group mr-4 sm:mr-6 lg:mr-10">
            {/* Crown & W Logo (Enlarged & Bottom Text Cropped Out) */}
            <div className="h-9 sm:h-11 w-9 sm:w-11 overflow-hidden flex items-start justify-center shrink-0">
              <img
                src={logoImg}
                alt="Wolego Transport Logo"
                className="h-12 sm:h-14 w-auto object-cover object-top transform group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col justify-center items-center text-center">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#009a44] font-serif leading-none whitespace-nowrap">
                WOLEGO TRANSPORT
              </span>
              <span className="text-[9px] sm:text-[10px] font-black italic tracking-widest text-[#0072bc] uppercase leading-tight font-serif whitespace-nowrap mt-0.5 text-center w-full">
                EVERYTHING IS FAST
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
            {/* Primary Nav Items */}
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${active
                      ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}

            {/* Dropdown Menu for Owner Only */}
            {isOwner && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${isDropdownActive
                      ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                    }`}
                >
                  <FolderKanban className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Reports & Master</span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Card */}
                {dropdownOpen && (
                  <div
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-50 divide-y divide-slate-100 animate-fadeIn"
                  >
                    {dropdownItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-2.5 text-sm font-semibold transition-all ${active
                              ? "bg-amber-50 text-amber-800 font-extrabold border-l-4 border-amber-500"
                              : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                            }`}
                        >
                          <Icon className="w-4 h-4 text-amber-600" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Auth / User Status Badge & Change Password & Logout */}
            <div className="pl-3 border-l border-slate-200 flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 border border-slate-300 px-3 py-1 rounded-xl flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    <div className="text-xs">
                      <div className="font-extrabold text-amber-700 leading-none">
                        {isOwner ? "OWNER" : isTruck ? "TRUCK OWNER" : user.partyName || user.username}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium leading-tight">
                        {user.username}
                      </div>
                    </div>
                  </div>
                  {/* Theme Popover Button */}
                  <div className="relative" ref={desktopThemeRef}>
                    <button
                      type="button"
                      onClick={() => setDesktopThemeOpen(!desktopThemeOpen)}
                      title="Choose Theme (थीम बदलें)"
                      className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 rounded-xl transition cursor-pointer flex items-center justify-center"
                    >
                      <Palette className="w-4 h-4 text-purple-700" />
                    </button>
                    {desktopThemeOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
                        <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          Select Color Theme
                        </div>
                        {THEMES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setTheme(t.id);
                              setDesktopThemeOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                              theme === t.id
                                ? "bg-amber-50 text-amber-900 font-extrabold border-l-4 border-amber-500"
                                : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                            }`}
                          >
                            <span>{t.icon}</span>
                            <span>{t.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => setIsChangeActionPasswordOpen(true)}
                      title="Set / Change Action Security Password (LR Edit/Delete & Truck Debit Passcode)"
                      className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-extrabold"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    title="Change Login Password (लॉगिन पासवर्ड बदलें)"
                    className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile header controls */}
          <div className="md:hidden flex items-center gap-1.5 shrink-0 pr-1 sm:pr-0">
            {user && (
              <>
                {/* Compact Theme Popover Button for Mobile Header */}
                <div className="relative" ref={mobileThemeRef}>
                  <button
                    type="button"
                    onClick={() => setMobileThemeOpen(!mobileThemeOpen)}
                    className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-xl bg-purple-50 border border-purple-200 cursor-pointer"
                    title="Choose Theme"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                  {mobileThemeOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTheme(t.id);
                            setMobileThemeOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 transition-all ${
                            theme === t.id
                              ? "bg-amber-50 text-amber-900 font-extrabold border-l-4 border-amber-500"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{t.icon}</span>
                          <span>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Menu"
              className="p-2 rounded-xl text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 focus:outline-none transition shrink-0 ml-0.5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-2 pt-2 pb-6 space-y-1 sm:px-3 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">

          {/* Mobile Theme Selector Bar */}
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg mb-2 flex justify-between items-center">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1 uppercase">
              🎨 Color Theme:
            </span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-white text-slate-900 font-extrabold text-xs px-2 py-1 rounded border border-amber-300 focus:outline-none cursor-pointer"
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </div>

          {user && (
            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg mb-2 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-amber-700">
                  {isOwner ? "👑 OWNER ADMIN" : `🏢 ${user.partyName}`}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Mobile: {user.username}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {isOwner && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsChangeActionPasswordOpen(true);
                    }}
                    className="text-xs text-emerald-950 font-black bg-emerald-300 hover:bg-emerald-400 px-2 py-1 rounded flex items-center gap-1 border border-emerald-400"
                  >
                    <ShieldCheck size={13} /> Action PIN
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="text-xs text-amber-800 font-bold bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded flex items-center gap-1 border border-amber-300"
                >
                  <Key size={13} /> Login Pass
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-700 font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded border border-rose-200"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-bold ${active
                    ? "bg-amber-500 text-slate-950 font-extrabold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {isOwner && (
            <div className="pt-2 border-t border-slate-200">
              <div className="px-3 text-xs font-bold uppercase text-amber-700 tracking-wider mb-1">
                Reports & Party Master
              </div>
              {dropdownItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-semibold ${active
                        ? "bg-amber-50 text-amber-800 font-extrabold border-l-4 border-amber-500"
                        : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                      }`}
                  >
                    <Icon className="w-4 h-4 text-amber-600" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        user={user}
      />

      {/* Action Security Password Modal (LR Edit/Delete & Truck Debit) */}
      <ChangeActionPasswordModal
        isOpen={isChangeActionPasswordOpen}
        onClose={() => setIsChangeActionPasswordOpen(false)}
        user={user}
      />
    </header>
  );
}

