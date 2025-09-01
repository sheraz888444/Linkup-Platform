import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Calendar, Edit2, Save, X, Moon, Sun } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    title: "",
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || "",
        title: user.title || "",
      });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { bio: string; title: string }) => {
      await apiRequest("PUT", "/api/auth/user", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarChangeClick = () => {
    avatarInputRef.current?.click();
  };

  const onAvatarSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to upload image");
      }
      const url = data.url as string;
      await apiRequest("PUT", "/api/auth/user", { profileImageUrl: url });
      updateUser({ profileImageUrl: url });
      toast({
        title: "Profile photo updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.message || "Unable to update profile picture.",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        bio: user.bio || "",
        title: user.title || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200" data-testid="card-profile">
              <CardHeader className="text-center">
                <div className="relative text-center">
                  <img
                    src={user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName || 'User'} ${user.lastName || ''}`}
                    alt="Profile picture"
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
                    data-testid="img-avatar"
                  />
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAvatarSelected}
                    data-testid="input-avatar-file"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAvatarChangeClick}
                    disabled={avatarUploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 px-3 rounded-full"
                    data-testid="button-change-photo"
                  >
                    {avatarUploading ? "Uploading..." : "Change Photo"}
                  </Button>
                </div>
                <CardTitle className="text-slate-900" data-testid="text-username">
                  {user.firstName || user.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : 'User'
                  }
                </CardTitle>
                <p className="text-sm text-slate-500" data-testid="text-user-title">
                  {user.title || 'No title set'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span data-testid="text-user-email">{user.email || 'No email'}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span data-testid="text-join-date">
                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <User className="w-4 h-4" />
                  <span data-testid="text-followers-count">
                    {user.followersCount || 0} followers
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200" data-testid="card-profile-details">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-slate-900">Profile Details</CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-profile"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={updateProfileMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      data-testid="button-save-profile"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                        Professional Title
                      </Label>
                      {isEditing ? (
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g. Full Stack Developer, UI/UX Designer"
                          className="mt-1"
                          data-testid="input-title"
                        />
                      ) : (
                        <p className="mt-1 text-slate-900" data-testid="text-display-title">
                          {user.title || 'No title set'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="bio" className="text-sm font-medium text-slate-700">
                        Bio
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          className="mt-1"
                          data-testid="textarea-bio"
                        />
                      ) : (
                        <p className="mt-1 text-slate-900 whitespace-pre-wrap" data-testid="text-display-bio">
                          {user.bio || 'No bio set'}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card className="border-slate-200 mt-6" data-testid="card-theme-settings">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center">
                  {theme === 'dark' ? <Moon className="w-5 h-5 mr-2" /> : <Sun className="w-5 h-5 mr-2" />}
                  Theme Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">Dark Mode</span>
                    <Moon className="w-4 h-4 text-slate-600" />
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                    data-testid="theme-toggle"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Toggle between light and dark themes for better viewing experience
                </p>
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card className="border-slate-200 mt-6" data-testid="card-activity-stats">
              <CardHeader>
                <CardTitle className="text-slate-900">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600" data-testid="text-posts-count">0</div>
                    <div className="text-sm text-slate-600">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600" data-testid="text-followers-display">
                      {user.followersCount || 0}
                    </div>
                    <div className="text-sm text-slate-600">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600" data-testid="text-following-display">
                      {user.followingCount || 0}
                    </div>
                    <div className="text-sm text-slate-600">Following</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
