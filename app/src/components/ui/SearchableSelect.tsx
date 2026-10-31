"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface SearchOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: "blue" | "emerald" | "amber" | "violet" | "rose" | "slate";
  category?: string;
}

interface SearchableSelectProps {
  name: string;
  options: SearchOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function SearchableSelect({
  name,
  options = [],
  value,
  defaultValue = "",
  onChange,
  placeholder = "-- Pilih Data --",
  searchPlaceholder = "Ketik untuk mencari data master...",
  label,
  required = false,
  disabled = false,
  className = "",
  emptyMessage = "Data tidak ditemukan",
}: SearchableSelectProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue || (isControlled ? value : "")
  );
  const selectedValue = isControlled ? value : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if controlled value changes
  useEffect(() => {
    if (isControlled && value !== undefined) {
      setInternalValue(value);
    }
  }, [isControlled, value]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === selectedValue);
  }, [options, selectedValue]);

  // Filter options dynamically based on query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.sublabel?.toLowerCase().includes(q);
      const matchBadge = opt.badge?.toLowerCase().includes(q);
      const matchVal = opt.value.toLowerCase().includes(q);
      const matchCat = opt.category?.toLowerCase().includes(q);
      return matchLabel || matchSub || matchBadge || matchVal || matchCat;
    });
  }, [options, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    if (onChange) {
      onChange(val);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isControlled) {
      setInternalValue("");
    }
    if (onChange) {
      onChange("");
    }
  };

  const badgeColorClass = (color?: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50";
      case "rose":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/50";
      case "violet":
        return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-700/50";
      case "blue":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/50";
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden input to maintain 100% native HTML form compatibility */}
      <input
        type="hidden"
        name={name}
        value={selectedValue || ""}
      />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-2 text-xs text-left transition-all outline-none ${
          disabled
            ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-violet-500 ring-2 ring-violet-500/20 bg-white dark:bg-[#1a2130] shadow-sm"
            : "border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2130] hover:border-slate-400 dark:hover:border-white/20"
        }`}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              {selectedOption.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border uppercase tracking-wider shrink-0 ${badgeColorClass(
                    selectedOption.badgeColor
                  )}`}
                >
                  {selectedOption.badge}
                </span>
              )}
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate hidden sm:inline">
                  &bull; {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              title="Hapus pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-violet-500" : ""
            }`}
          />
        </div>
      </button>

      {/* Floating Search List Popover Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Live Search Input Bar */}
          <div className="p-2.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 mt-1.5 text-[10px] text-slate-400">
              <span>Hasil pencarian master:</span>
              <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                {filteredOptions.length} data
              </span>
            </div>
          </div>

          {/* Scrollable Results List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-100/50 dark:divide-white/[0.03]">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                <Search className="w-6 h-6 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                <p>{emptyMessage}</p>
                <p className="text-[11px] mt-0.5 text-slate-400">
                  Coba kata kunci kode, nama, atau kategori lain.
                </p>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                      isSelected
                        ? "bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-200 font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border uppercase shrink-0 ${badgeColorClass(
                            opt.badgeColor
                          )}`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      <div className="truncate">
                        <p className="truncate text-slate-900 dark:text-white font-medium">
                          {opt.label}
                        </p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {opt.category && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                          {opt.category}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
