"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/60 backdrop-blur-xl">
      {/* Gradient bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:border-accent/50 transition-colors">
            <span className="text-accent font-display font-bold text-sm tracking-tight">
              &alpha;
            </span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Alpha<span className="text-accent">Ring</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/arena"
            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
          >
            Arena
          </Link>
          <Link
            href="/create?mode=advanced"
            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
          >
            Create
          </Link>
          <div className="w-px h-5 bg-surface-border mx-2" />
          <button className="text-sm px-4 py-1.5 rounded-lg border border-accent/25 text-accent hover:bg-accent/10 hover:border-accent/40 transition-all">
            Sign In
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-gray-400 transition-all duration-300 ${
              mobileOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-400 transition-all duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-400 transition-all duration-300 ${
              mobileOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
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
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-surface-border/50 bg-surface/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              <Link
                href="/arena"
                className="text-sm text-gray-400 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all"
                onClick={() => setMobileOpen(false)}
              >
                Arena
              </Link>
              <Link
                href="/create?mode=advanced"
                className="text-sm text-gray-400 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all"
                onClick={() => setMobileOpen(false)}
              >
                Create
              </Link>
              <button className="text-sm mt-2 px-4 py-2.5 rounded-lg border border-accent/25 text-accent hover:bg-accent/10 text-left transition-all">
                Sign In
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
