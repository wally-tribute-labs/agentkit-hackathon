'use client';

import { createContext, useContext, useState } from 'react';

interface AuthState {
  verified: boolean;
  nullifierHash: string | null;
  setVerified: (nullifierHash: string) => void;
  clearVerified: () => void;
}

const AuthContext = createContext<AuthState>({
  verified: false,
  nullifierHash: null,
  setVerified: () => {},
  clearVerified: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Lazily restore from sessionStorage on first render
  const [nullifierHash, setNullifierHash] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('nullifier_hash');
    }
    return null;
  });

  function setVerified(hash: string) {
    sessionStorage.setItem('nullifier_hash', hash);
    setNullifierHash(hash);
  }

  function clearVerified() {
    sessionStorage.removeItem('nullifier_hash');
    setNullifierHash(null);
  }

  return (
    <AuthContext.Provider value={{ verified: !!nullifierHash, nullifierHash, setVerified, clearVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
