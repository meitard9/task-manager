// hooks/useUserSession.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useApi } from "../context/AuthSessionProvider";

interface UserProfile {
  email: string;
  userId: string;
}

interface UserSession {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

/**
 * useUserSession
 *
 * Custom hook that handles user session and authentication related tasks.
 *
 * The hook returns an object with the following properties:
 * - user: The currently logged in user's profile if available.
 * - isLoading: Whether the authentication check is in progress.
 * - error: Any error message if the authentication check fails.
 * - logout: A function to log out the current user and clear the authentication cookie.
 *
 * Usage:
 * const { user, isLoading, error, logout } = useUserSession();
 * */
export function useUserSession(): UserSession {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { accessToken, setAccessToken, isLoading: isAuthLoading } = useAuth();
  const api = useApi();

  useEffect(() => {
    if (accessToken) {
      const fetchProfile = async () => {
        try {
          const response = await api.post("/auth/profile");
          setUser(response.data);
          setError(null); // Clear any previous errors on successful fetch
        } catch (err) {
          setError("Failed to fetch user profile.");
          console.error("Profile fetch failed:", err);
        }
      };
      fetchProfile();
    }
  }, [accessToken, api]);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Log the error but don't prevent logout, as the cookie might already be cleared.
      console.error("Logout failed on the backend:", err);
    } finally {
      setAccessToken(null);
      router.push("/login");
    }
  };

  return { user, isLoading: isAuthLoading, error, logout };
  //how to use : const { user, isLoading, error, logout } = useUserSession();
}
