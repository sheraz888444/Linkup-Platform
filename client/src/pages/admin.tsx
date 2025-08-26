import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Users, 
  FileText, 
  Video, 
  MessageSquare, 
  Ban, 
  Trash2, 
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  postsCount: number;
  followersCount: number;
}

interface AdminPost {
  id: string;
  content: string;
  userId: string;
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  status: 'active' | 'flagged' | 'removed';
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Mock data for admin dashboard (in real app, these would come from API)
  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
    queryFn: () => ({
      totalUsers: 1247,
      activeUsers: 892,
      suspendedUsers: 23,
      totalPosts: 5634,
      flaggedPosts: 12,
      totalGroups: 89,
      totalStories: 234
    })
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === 'admin',
    queryFn: (): AdminUser[] => [
      {
        id: "1",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        status: "active",
        createdAt: "2024-01-15",
        postsCount: 45,
        followersCount: 123
      },
      {
        id: "2",
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
        status: "suspended",
        createdAt: "2024-02-20",
        postsCount: 12,
        followersCount: 67
      }
    ]
  });

  const { data: posts } = useQuery({
    queryKey: ["/api/admin/posts"],
    enabled: isAuthenticated && user?.role === 'admin',
    queryFn: (): AdminPost[] => [
      {
        id: "1",
        content: "This is a sample post content that might need moderation...",
        userId: "1",
        user: { firstName: "John", lastName: "Doe", email: "john@example.com" },
        status: "flagged",
        createdAt: "2024-03-15",
        likesCount: 23,
        commentsCount: 5
      }
    ]
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/admin/users/${userId}/suspend`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User suspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to suspend user", variant: "destructive" });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest('DELETE', `/api/admin/posts/${postId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Post deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Manage users, posts, and platform content
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {adminStats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Posts
                  </CardTitle>
                  <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {adminStats?.totalPosts || 0}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Flagged Content
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {adminStats?.flaggedPosts || 0}
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Needs attention
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Active Users
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {adminStats?.activeUsers || 0}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Online now
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 dark:text-white">User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`}
                          alt="User avatar"
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-slate-500">
                              {user.postsCount} posts
                            </span>
                            <span className="text-xs text-slate-500">
                              {user.followersCount} followers
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                        {user.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => suspendUserMutation.mutate(user.id)}
                            disabled={suspendUserMutation.isPending}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => suspendUserMutation.mutate(user.id)}
                            disabled={suspendUserMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Content Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts?.map((post) => (
                    <div key={post.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {post.user.firstName} {post.user.lastName}
                            </span>
                            <Badge variant={post.status === 'flagged' ? 'destructive' : 'default'}>
                              {post.status}
                            </Badge>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 mb-2">{post.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span>{post.likesCount} likes</span>
                            <span>{post.commentsCount} comments</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePostMutation.mutate(post.id)}
                            disabled={deletePostMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">User Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No Reports
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    All reports have been resolved or there are no pending reports.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
