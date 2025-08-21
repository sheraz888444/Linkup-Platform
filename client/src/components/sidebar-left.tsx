import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Leaf, Palette } from "lucide-react";

export default function SidebarLeft() {
  const { user } = useAuth();

  const mockCommunities = [
    { id: 1, name: "React Developers", members: "15.2K", icon: Code, color: "bg-blue-100 text-blue-600" },
    { id: 2, name: "Node.js Hub", members: "8.7K", icon: Leaf, color: "bg-green-100 text-green-600" },
    { id: 3, name: "UI/UX Design", members: "22.1K", icon: Palette, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="space-y-6" data-testid="sidebar-left">
      {/* User Profile Card */}
      <Card className="border-slate-200" data-testid="card-user-profile">
        <CardContent className="p-6">
          <img
            src={user?.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'User'} ${user?.lastName || ''}`}
            alt="Profile picture"
            className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
            data-testid="img-profile-picture"
          />
          <div className="text-center">
            <h3 className="font-semibold text-slate-900" data-testid="text-profile-name">
              {user?.firstName || user?.lastName 
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'User'
              }
            </h3>
            <p className="text-sm text-slate-500" data-testid="text-profile-title">
              {user?.title || 'Community Member'}
            </p>
            <p className="text-sm text-slate-400 mt-2" data-testid="text-profile-followers">
              {user?.followersCount || 0} followers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Communities Section */}
      <Card className="border-slate-200" data-testid="card-communities">
        <CardHeader>
          <CardTitle className="text-slate-900">Your Communities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockCommunities.map((community) => (
            <Button
              key={community.id}
              variant="ghost"
              className="w-full justify-start p-2 h-auto hover:bg-slate-50 transition-colors"
              data-testid={`button-community-${community.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${community.color}`}>
                  <community.icon size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900" data-testid={`text-community-name-${community.id}`}>
                    {community.name}
                  </p>
                  <p className="text-xs text-slate-500" data-testid={`text-community-members-${community.id}`}>
                    {community.members} members
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
