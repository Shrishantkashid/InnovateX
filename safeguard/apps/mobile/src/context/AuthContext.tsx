import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'woman' | 'child' | 'parent' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  uniqueId?: string; // CHILD-XXXXXX or PARENT-XXXXXX
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (userData: User) => Promise<void>;
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

  const signIn = async (userData: User) => {
    setUser(userData);
    setRoleState(userData.role);
    await AsyncStorage.setItem('@user_session', JSON.stringify(userData));
    await AsyncStorage.setItem('@user_role', userData.role || '');
  };

  const signOut = async () => {
    setUser(null);
    setRoleState(null);
    await AsyncStorage.removeItem('@user_session');
    await AsyncStorage.removeItem('@user_role');
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
