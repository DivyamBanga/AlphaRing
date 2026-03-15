"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center">
            <span className="text-accent font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-lg tracking-tight">
            Alpha<span className="text-accent">Ring</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/arena"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Arena
          </Link>
          <Link
            href="/create?mode=advanced"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Create
          </Link>
          <button className="text-sm px-4 py-1.5 rounded-md border border-surface-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
            Sign In
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-gray-400 transition-transform ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-400 transition-opacity ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-400 transition-transform ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-surface-border bg-surface overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-3">
              <Link
                href="/arena"
                className="text-sm text-gray-400 hover:text-white py-2"
                onClick={() => setMobileOpen(false)}
              >
                Arena
              </Link>
              <Link
                href="/create?mode=advanced"
                className="text-sm text-gray-400 hover:text-white py-2"
                onClick={() => setMobileOpen(false)}
              >
                Create
              </Link>
              <button className="text-sm px-4 py-2 rounded-md border border-surface-border text-gray-400 hover:text-white text-left">
                Sign In
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
