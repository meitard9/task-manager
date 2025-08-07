// /context/AuthSessionProvider.tsx
"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import axios, { AxiosInstance } from "axios";

// 1. Define the Context's type
interface AuthContextType {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  isLoading: boolean;
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading to block rendering

  useEffect(() => {
    // This function attempts to restore the session from the refresh token cookie
    const restoreSession = async () => {
      try {
        // Attempt to get a new access token using the refresh token cookie
        const response = await axios.post(
          "http://localhost:4000/auth/refresh",
          {},
          { withCredentials: true }
        );
        setAccessToken(response.data.accessToken);
      } catch (error) {
        // If refresh fails, the session is invalid. Clear the token.
        setAccessToken(null);
      } finally {
        // We've finished checking, so we can stop loading.
        setIsLoading(false);
      }
    };

    // The middleware now handles all initial routing. This hook simply checks if a session exists
    // and stores the token in state. The isLoading state prevents children from rendering until this check is complete.
    restoreSession();
  }, []); // Empty dependency array means this effect only runs on mount

  // Block rendering of children until the authentication check is complete
  if (isLoading) {
    // You could return a loading spinner component here if you wish
    return null;
  }

  const value = {
    accessToken,
    setAccessToken,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 4. Custom Hook to use the Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthSessionProvider");
  }
  return context;
}

// 5. Custom Hook to get a pre-configured API instance
export function useApi(): AxiosInstance {
  const { accessToken, setAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: "http://localhost:4000",
      withCredentials: true,
    });

    // Add the request interceptor
    instance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add the response interceptor for token refresh
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const publicRoutes = ["/login", "/register"];

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshResponse = await axios.post(
              "http://localhost:4000/auth/refresh",
              {},
              { withCredentials: true }
            );
            setAccessToken(refreshResponse.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            setAccessToken(null);
            // Only redirect if not already on a public page to prevent infinite loops
            if (!publicRoutes.includes(pathname)) {
              router.push("/login");
            }
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [accessToken, setAccessToken, router, pathname]);

  return api;
}
