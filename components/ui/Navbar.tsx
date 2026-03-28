"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";

function UserDisplay() {
  const { user, setUsername, clearUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowInput(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  function handleNameSubmit() {
    if (nameInput.trim().length >= 2) {
      setUsername(nameInput.trim());
      setShowInput(false);
      setNameInput("");
    }
  }

  // No user yet — show "Enter Name" button
  if (!user) {
    return (
      <div ref={menuRef} className="relative">
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border border-accent/40 text-accent hover:bg-accent hover:text-[#080808] transition-all font-bold"
          >
            Enter Name
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleNameSubmit(); }}
              placeholder="Your name"
              maxLength={20}
              className="w-28 px-2.5 py-1.5 bg-[#0D0D0D] border border-[#2A2A2A] text-[11px] font-mono text-[#C0C0BE] placeholder-[#333] focus:outline-none focus:border-accent/40"
            />
            <button
              onClick={handleNameSubmit}
              disabled={nameInput.trim().length < 2}
              className="px-2.5 py-1.5 bg-accent text-[#080808] text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-accent-light transition-colors"
            >
              Go
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // Has user — show name + dropdown
  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-[#666] hover:text-[#F0F0EE] transition-colors px-2 py-1"
      >
        <div className="w-5 h-5 rounded-sm bg-accent/20 border border-accent/30 flex items-center justify-center">
          <span className="text-accent text-[9px] font-bold font-display">
            {user.username[0]?.toUpperCase()}
          </span>
        </div>
        <span className="hidden sm:inline max-w-[80px] truncate uppercase tracking-wider text-[10px]">
          {user.username}
        </span>
        <span className="text-[#444]">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 w-44 border border-[#2a2a2a] bg-[#0D0D0D] shadow-2xl z-50 overflow-hidden"
          >
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-xs text-[#888] hover:text-[#F0F0EE] hover:bg-[#131313] transition-colors uppercase tracking-wider"
            >
              My Strategies
            </Link>
            <div className="border-t border-[#1E1E1E]" />
            <button
              onClick={() => { setOpen(false); clearUser(); }}
              className="w-full text-left px-4 py-2.5 text-xs text-[#555] hover:text-loss hover:bg-[#131313] transition-colors uppercase tracking-wider"
            >
              Change Name
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080808]/90 backdrop-blur-md border-b border-[#1A1A1A]">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-6 h-6 bg-accent flex items-center justify-center">
            <span className="font-display font-black text-[#080808] text-xs leading-none">α</span>
          </div>
          <span className="font-display font-black text-base tracking-[0.05em] uppercase">
            Alpha<span className="text-accent">Ring</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/arena"
            className="text-[10px] uppercase tracking-[0.2em] text-[#666] hover:text-[#F0F0EE] transition-colors"
          >
            Arena
          </Link>
          <Link
            href="/create?mode=guided"
            className="text-[10px] uppercase tracking-[0.2em] text-[#666] hover:text-[#F0F0EE] transition-colors"
          >
            Create
          </Link>
          <div className="w-px h-4 bg-[#222]" />
          {!loading && <UserDisplay />}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[#555]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 space-y-1.5">
            <span className={`block h-px bg-current transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-2.5" : ""}`} />
            <span className={`block h-px bg-current transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px bg-current transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-2.5" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-[#1A1A1A] bg-[#080808] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              <Link
                href="/arena"
                className="block text-[10px] uppercase tracking-[0.2em] text-[#666] hover:text-[#F0F0EE] py-2 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Arena
              </Link>
              <Link
                href="/create?mode=guided"
                className="block text-[10px] uppercase tracking-[0.2em] text-[#666] hover:text-[#F0F0EE] py-2 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Create
              </Link>
              <Link
                href="/profile"
                className="block text-[10px] uppercase tracking-[0.2em] text-[#666] hover:text-[#F0F0EE] py-2 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                My Strategies
              </Link>
              <div className="pt-2">
                {!loading && <UserDisplay />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
