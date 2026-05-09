import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'woman' | 'child' | 'parent' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
  uniqueId?: string; // CHILD-XXXXXX or PARENT-XXXXXX
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (userData: User, token?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted session
    const loadSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@user_session');
        const storedRole = await AsyncStorage.getItem('@user_role');
        
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedRole) setRoleState(storedRole as UserRole);
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const signIn = async (userData: User, token?: string) => {
    const sessionUser = { ...userData, token };
    setUser(sessionUser);
    setRoleState(sessionUser.role);
    await AsyncStorage.setItem('@user_session', JSON.stringify(sessionUser));
    await AsyncStorage.setItem('@user_role', sessionUser.role || '');
    if (token) await AsyncStorage.setItem('@auth_token', token);
  };

  const signOut = async () => {
    setUser(null);
    setRoleState(null);
    await AsyncStorage.removeItem('@user_session');
    await AsyncStorage.removeItem('@user_role');
    await AsyncStorage.removeItem('@auth_token');
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      isAuthenticated: !!user, 
      isLoading, 
      signIn, 
      signOut, 
      setRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
