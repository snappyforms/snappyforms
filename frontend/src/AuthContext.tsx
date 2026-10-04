"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
const API_URL_BASE = `api/`;

interface RegisterData {
  email_address: string;
  password: string;
  [key: string]: any;
}

interface AuthResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface Job {
  id: number;
  user_id: number;
  properties: {
  module: number;
  question: number;
  answer: string | string[]}[];
  created_date?: Date
}

interface AuthContextType {
  currentUser: string;
  setCurrentUser: (value: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  currentUserData: any;
  setcurrentUserData: (value: any) => void;
  isAvatarMenuOpen: boolean;
  setIsAvatarMenuOpen: (value: boolean) => void;
  user: any;
  setUser: (value: any) => void;
  activePage: number;
  setActivePage: (value: number) => void;
  formID: number;
  setFormID: (value:number) => void;
  time: any;
  setTime: (value: any) => void;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  apiUrlBase?: string;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (data: any) => void;
  changePassword: () => Promise<AuthResponse>;
  globalContentCategories?: Array<{ name: string, color: string }>;

  // Testing

}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // --- State Initialization ---
  const [currentUser, setCurrentUser] = useState<string>(() => localStorage.getItem("currentUser") || "");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem("isLoggedIn") === "true");
  const [currentUserData, setcurrentUserData] = useState<any>(() => {
    const saved = localStorage.getItem("currentUserData");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activePage, setActivePageState] = useState<number>(0);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [globalContentCategories, setGlobalContentCategories] = useState<Array<{ name: string, color: string }>>([]);
  const [formID, setFormIDState] = useState<number>(0);

  const setActivePage = (value: number) => {
    setActivePageState(value);
    localStorage.setItem("activePage", String(value));
  };

  const setFormID = (value: number) => {
    setFormIDState(value);
    localStorage.setItem("formID", String(value));
  };

  // --- Token Verification on Mount ---
  useEffect(() => {
    const verifyToken = async () => {
      const storedActivePage = Number(localStorage.getItem("activePage"));
      if (Number.isFinite(storedActivePage) && storedActivePage >= 0) {
        setActivePageState(storedActivePage);
      }

      const storedFormID = Number(localStorage.getItem("formID"));
      if (Number.isFinite(storedFormID) && storedFormID >= 0) {
        setFormIDState(storedFormID);
      }

      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL_BASE}auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Synchronize all state versions
          const userData = data.user;
          setUser(userData);
          setcurrentUserData(data);
          setCurrentUser(userData.email_address || userData.email);
          setIsLoggedIn(true);
          setToken(storedToken);
        } else {
          handleLogoutLocal();
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        handleLogoutLocal();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // --- LocalStorage Sync ---
  // We only sync legacy data to keep your existing components working
  useEffect(() => {
    localStorage.setItem("currentUser", currentUser);
    localStorage.setItem("isLoggedIn", String(isLoggedIn));
    localStorage.setItem("currentUserData", JSON.stringify(currentUserData));
  }, [currentUser, isLoggedIn, currentUserData]);

  // --- Auth Helper Functions ---
  const handleLogoutLocal = () => {
    localStorage.clear(); 
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setCurrentUser("");
    setcurrentUserData(null);
    setIsAvatarMenuOpen(false);
  };

const login = async (email_address: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL_BASE}auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address, password })
    });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        setCurrentUser(data.user.email_address || data.user.email);
        setcurrentUserData(data);
        return { success: true, data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Server unreachable.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await fetch(`${API_URL_BASE}auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } finally {
      handleLogoutLocal();
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_URL_BASE}auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
        setCurrentUser(data.user.email_address || data.user.email);
        setcurrentUserData(data);
        return { success: true, data };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Network error.' };
    }
  };

  const value: AuthContextType = {
    currentUser, setCurrentUser,
    isLoggedIn, setIsLoggedIn,
    currentUserData, setcurrentUserData,
    isAvatarMenuOpen, setIsAvatarMenuOpen,
    user, setUser, 
    activePage,setActivePage,
    formID,setFormID,
    time, setTime,
    token, loading, apiUrlBase: API_URL_BASE, globalContentCategories,
    isAuthenticated: !!token,
    register, login, logout,
    updateUser: (data) => { setUser(data); setcurrentUserData(data); },
    changePassword: async () => ({ success: false }),

    // Testing
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}