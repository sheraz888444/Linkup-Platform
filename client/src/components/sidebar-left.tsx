import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Video, Users, Bell } from "lucide-react";
import { useLocation } from "wouter";

export default function SidebarLeft() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const navItems = [
    { id: "home", label: "Home", icon: Home, href: "/home" },
    { id: "videos", label: "Videos", icon: Video, href: "/videos" },
    { id: "friends", label: "Friends", icon: Users, href: "/friends" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/home#notifications" },
  ];

  return (
    <div className="space-y-6" data-testid="sidebar-left">
      {/* User Profile Card */}
      <Card className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" data-testid="card-user-profile">
        <CardContent className="p-6">
          <img
            src={
              user?.profileImageUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || "User"} ${user?.lastName || ""}`
            }
            alt="Profile picture"
            className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
            data-testid="img-profile-picture"
          />
          <div className="text-center">
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100" data-testid="text-profile-name">
              {user?.firstName || user?.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "User"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400" data-testid="text-profile-title">
              {user?.title || "Community Member"}
            </p>
            <p className="text-sm text-slate-400 mt-2" data-testid="text-profile-followers">
              {user?.followersCount || 0} followers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Navigation */}
      <Card className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" data-testid="card-navigation">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-zinc-100">Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start p-2 h-auto hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setLocation(item.href)}
              data-testid={`button-nav-${item.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-100">
                  <item.icon size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-zinc-100">{item.label}</p>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
