import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';

import { authApi, usersApi } from '../services/apiService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithProvider: (provider: 'google' | 'facebook') => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  adminUpdateUser: (user: User) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load logged-in user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setIsLoading(false);
  }, []);

  // Save logged-in user to localStorage
  const saveUser = (user: User) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  /* -----------------------------------------
     AUTH ACTIONS
  ------------------------------------------*/
  
  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    // The apiService now handles token storage internally
    saveUser(response.user);
    return response.user;
  };

  const loginWithProvider = async (provider: 'google' | 'facebook'): Promise<User> => {
    // OAuth flow placeholder - redirect to backend OAuth endpoint
    // In production, this would:
    // 1. Redirect to /auth/google or /auth/facebook
    // 2. Backend handles OAuth with provider
    // 3. Backend redirects back with JWT token
    // 4. Frontend extracts token and user from URL params
    
    console.warn(`Social login with ${provider} not yet implemented on backend`);
    throw new Error(`Social login with ${provider} requires backend OAuth configuration. Please use email/password login for now.`);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ name, email, password });
    // Update state immediately after registration
    saveUser(response.user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  /* -----------------------------------------
     ADMIN / USER MANAGEMENT
  ------------------------------------------*/

  const fetchUsers = async () => {
    const userList = await usersApi.getUsers();
    setUsers(userList);
  };

  const addUser = async (data: Omit<User, 'id' | 'createdAt'>) => {
    await usersApi.createUser(data);
    await fetchUsers();
  };

  const updateUser = async (updated: User) => {
    await usersApi.updateUser(updated);
    
    // If updating the currently logged-in user, update the user state
    if (user && updated.id === user.id) {
      saveUser(updated);
    }
    
    await fetchUsers();
  };

  const deleteUser = async (id: number) => {
    await usersApi.deleteUser(id);
    
    // If deleting the currently logged-in user, log them out
    if (user && id === user.id) {
      logout();
      return; // Don't fetch users after logout
    }
    
    await fetchUsers();
  };

  // Alias for admin user updates
  const adminUpdateUser = updateUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isLoading,
        login,
        loginWithProvider,
        register,
        logout,
        fetchUsers,
        addUser,
        updateUser,
        adminUpdateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* -----------------------------------------
   HOOK
------------------------------------------*/
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

