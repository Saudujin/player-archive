import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Admin {
  id: number;
  username: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Load admin from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("admin");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // This will be called from a component that has access to trpc
    // For now, just store the admin info
    const adminInfo = { id: 1, username };
    setAdmin(adminInfo);
    localStorage.setItem("admin", JSON.stringify(adminInfo));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("admin");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAdmin: admin !== null,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
