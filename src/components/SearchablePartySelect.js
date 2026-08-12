import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export default function SearchablePartySelect({
  parties = [],
  value = "",
  onSelectParty,
  placeholder = "-- Select Party --",
  onSearchButtonClick,
  partyType = "Party"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const containerRef = useRef(null);

  // Sync internal filter query when value prop changes
  useEffect(() => {
    setFilterQuery(value || "");
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredParties = parties.filter(
    (p) =>
      p.partyName.toLowerCase().includes((filterQuery || "").toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes((filterQuery || "").toLowerCase())) ||
      (p.district && p.district.toLowerCase().includes((filterQuery || "").toLowerCase())) ||
      (p.state && p.state.toLowerCase().includes((filterQuery || "").toLowerCase())) ||
      (p.gstNo && p.gstNo.toLowerCase().includes((filterQuery || "").toLowerCase()))
  );

  const handleSelect = (partyName) => {
    setFilterQuery(partyName);
    setIsOpen(false);
    if (onSelectParty) {
      onSelectParty(partyName);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex gap-1.5">
        
        {/* Searchable Combobox Input Field */}
        <div className="relative flex-1">
          <div className="relative">
            <input
              type="text"
              value={filterQuery}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setFilterQuery(e.target.value.toUpperCase());
                setIsOpen(true);
                if (onSelectParty) {
                  onSelectParty(e.target.value.toUpperCase());
                }
              }}
              placeholder={placeholder}
              className="w-full bg-white text-slate-900 font-bold pl-3 pr-8 py-2 border-2 border-sky-400 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm uppercase placeholder:normal-case placeholder:font-normal"
            />
            {filterQuery ? (
              <X
                size={16}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterQuery("");
                  if (onSelectParty) onSelectParty("");
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-rose-600 cursor-pointer"
              />
            ) : (
              <ChevronDown
                size={18}
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-2.5 top-2.5 text-slate-500 cursor-pointer hover:text-slate-900"
              />
            )}
          </div>

          {/* Live Search Dropdown Popup List */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border-2 border-yellow-400 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-700">
              {filteredParties.map((p) => {
                const isSelected = value && value.toUpperCase() === p.partyName.toUpperCase();
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p.partyName)}
                    className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition-colors ${
                      isSelected
                        ? "bg-sky-900 text-yellow-300 font-extrabold border-l-4 border-yellow-400"
                        : "text-slate-100 hover:bg-slate-800 hover:text-yellow-300"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm uppercase">{p.partyName}</div>
                      <div className="text-[11px] text-slate-400">
                        {[p.city, p.district, p.state].filter(Boolean).join(", ") || "-"} {p.gstNo ? `| GST: ${p.gstNo}` : ""}
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-yellow-400" />}
                  </div>
                );
              })}

              {filteredParties.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-400 italic">
                  No matching {partyType} found. Type custom name or click Search button.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dedicated Search Button */}
        {onSearchButtonClick && (
          <button
            type="button"
            onClick={onSearchButtonClick}
            className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded text-xs uppercase flex items-center gap-1 shadow shrink-0"
          >
            <Search size={14} /> Search
          </button>
        )}

      </div>
    </div>
  );
}
