import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
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
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
