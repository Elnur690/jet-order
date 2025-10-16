import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import api from '../services/api';

// --- Type Definitions ---
// Define the shape of the user object
interface User {
  id: string;
  phone: string;
  role: 'ADMIN' | 'STAFF';
}

// Define the shape of the context's value
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  logout: () => void;
}

// --- Context Creation ---
// Create the context with a default value of null
const AuthContext = createContext<AuthContextType | null>(null);

// --- Provider Component ---
// This component will wrap our app and provide the auth state
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial load

  // --- Functions ---
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  }, []);

  // Check for an existing token on initial component mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Validate the token by fetching the user profile
          const response = await api.get<User>('/auth/profile');
          setUser(response.data);
        } catch (error) {
          console.error('Session expired or token is invalid', error);
          logout(); // Clear invalid token
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [logout]);

  const login = async (phone: string) => {
    // Make a request to the backend's login endpoint
    const response = await api.post<{ access_token: string }>('/auth/login', {
      phone,
    });
    const { access_token } = response.data;

    // Store the token and update state
    localStorage.setItem('token', access_token);
    setToken(access_token);

    // Fetch user profile to store user details
    const profileResponse = await api.get<User>('/auth/profile');
    setUser(profileResponse.data);
  };

  const contextValue = {
    user,
    token,
    isAuthenticated: !!token, // True if token is not null
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// --- Custom Hook ---
// A helper hook to easily access the context's value
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};