"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";

function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = profile?.username || user.user_metadata?.name || "User";
  const avatarUrl =
    profile?.avatar_url || user.user_metadata?.avatar_url || null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-6 h-6 rounded-full border border-surface-border"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-accent text-xs font-bold">
              {displayName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <span className="hidden sm:inline max-w-[100px] truncate">
          {displayName}
        </span>
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-surface-border/50 bg-surface-card shadow-2xl overflow-hidden z-50"
          >
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-surface-elevated/50 hover:text-white transition-colors"
            >
              My Strategies
            </Link>
            <div className="border-t border-surface-border/30" />
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:bg-surface-elevated/50 hover:text-loss transition-colors"
            >
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SignInButton() {
  const { signInWithGitHub, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm px-4 py-1.5 rounded-lg border border-accent/25 text-accent hover:bg-accent/10 hover:border-accent/40 transition-all"
      >
        Sign In
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-surface-border/50 bg-surface-card shadow-2xl overflow-hidden z-50"
          >
            <button
              onClick={() => {
                setOpen(false);
                signInWithGitHub();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-surface-elevated/50 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
            <div className="border-t border-surface-border/30" />
            <button
              onClick={() => {
                setOpen(false);
                signInWithGoogle();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-surface-elevated/50 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();
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
          {!loading && (user ? <UserMenu /> : <SignInButton />)}
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
              {user && (
                <Link
                  href="/profile"
                  className="text-sm text-gray-400 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  My Strategies
                </Link>
              )}
              <div className="pt-2">
                {!loading &&
                  (user ? (
                    <MobileSignOut />
                  ) : (
                    <MobileSignIn />
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function MobileSignIn() {
  const { signInWithGitHub, signInWithGoogle } = useAuth();
  return (
    <div className="space-y-2">
      <button
        onClick={signInWithGitHub}
        className="w-full text-sm px-4 py-2.5 rounded-lg border border-accent/25 text-accent hover:bg-accent/10 text-left transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        Sign in with GitHub
      </button>
      <button
        onClick={signInWithGoogle}
        className="w-full text-sm px-4 py-2.5 rounded-lg border border-surface-border/50 text-gray-400 hover:bg-surface-elevated/50 text-left transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}

function MobileSignOut() {
  const { signOut, profile, user } = useAuth();
  const displayName = profile?.username || user?.user_metadata?.name || "User";
  return (
    <button
      onClick={signOut}
      className="w-full text-sm px-4 py-2.5 rounded-lg border border-surface-border/50 text-gray-500 hover:text-loss hover:border-loss/30 text-left transition-all"
    >
      Sign out ({displayName})
    </button>
  );
}
