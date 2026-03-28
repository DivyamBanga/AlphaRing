"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface UserIdentity {
  id: string;
  username: string;
}

interface AuthContextType {
  user: UserIdentity | null;
  loading: boolean;
  setUsername: (name: string) => void;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUsername: () => {},
  clearUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("alpharing_user");
      if (stored) {
        const parsed = JSON.parse(stored) as UserIdentity;
        if (parsed.id && parsed.username) {
          setUser(parsed);
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const setUsername = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check if we already have an id
    let id: string;
    try {
      const stored = localStorage.getItem("alpharing_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        id = parsed.id || generateId();
      } else {
        id = generateId();
      }
    } catch {
      id = generateId();
    }

    const identity: UserIdentity = { id, username: trimmed };
    localStorage.setItem("alpharing_user", JSON.stringify(identity));
    setUser(identity);
  }, []);

  const clearUser = useCallback(() => {
    localStorage.removeItem("alpharing_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUsername, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}
