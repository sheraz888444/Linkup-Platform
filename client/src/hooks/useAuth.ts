import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  title?: string;
  role?: 'user' | 'admin';
  followersCount?: number;
  followingCount?: number;
}

export function useAuth(): {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
} {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Only run the query if there's a token
    enabled: !!localStorage.getItem('token'),
  });

  const logout = () => {
    // Remove the token from localStorage
    localStorage.removeItem('token');
    // Clear the user data from the query cache
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
    // Hard redirect to login (default "/") to ensure clean state
    window.location.href = "/";
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
