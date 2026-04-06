import React, { createContext, useContext, useState, useEffect } from 'react';

interface Parent {
  id: number;
  username: string;
  email: string;
}

interface ParentContextType {
  parent: Parent | null;
  login: (parent: Parent, token: string) => void;
  logout: () => void;
  updateParent: (updates: Partial<Parent>) => void;
}

const ParentContext = createContext<ParentContextType | undefined>(undefined);

export const ParentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parent, setParent] = useState<Parent | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // 从localStorage加载家长信息和token
    const savedParent = localStorage.getItem('parentInfo');
    const savedToken = localStorage.getItem('parentToken');
    
    if (savedParent && savedToken) {
      setParent(JSON.parse(savedParent));
      setToken(savedToken);
    }
  }, []);

  const login = (parent: Parent, token: string) => {
    setParent(parent);
    setToken(token);
    localStorage.setItem('parentInfo', JSON.stringify(parent));
    localStorage.setItem('parentToken', token);
  };

  const logout = () => {
    setParent(null);
    setToken(null);
    localStorage.removeItem('parentInfo');
    localStorage.removeItem('parentToken');
  };

  const updateParent = (updates: Partial<Parent>) => {
    if (parent) {
      const updatedParent = { ...parent, ...updates };
      setParent(updatedParent);
      localStorage.setItem('parentInfo', JSON.stringify(updatedParent));
    }
  };

  return (
    <ParentContext.Provider value={{ parent, login, logout, updateParent }}>
      {children}
    </ParentContext.Provider>
  );
};

export const useParent = (): ParentContextType => {
  const context = useContext(ParentContext);
  if (context === undefined) {
    throw new Error('useParent must be used within a ParentProvider');
  }
  return context;
};
