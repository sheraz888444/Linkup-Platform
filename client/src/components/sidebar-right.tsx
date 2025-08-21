import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Smartphone, Brain } from "lucide-react";

export default function SidebarRight() {
  const trendingTopics = [
    { id: 1, hashtag: "#ReactJS", posts: "12.4K" },
    { id: 2, hashtag: "#WebDevelopment", posts: "8.7K" },
    { id: 3, hashtag: "#DesignSystems", posts: "5.2K" },
    { id: 4, hashtag: "#NodeJS", posts: "4.8K" },
    { id: 5, hashtag: "#DevOps", posts: "3.9K" },
  ];

  const suggestedCommunities = [
    { id: 1, name: "Vue.js", members: "9.1K", icon: TrendingUp, color: "bg-orange-100 text-orange-600" },
    { id: 2, name: "Mobile Dev", members: "6.7K", icon: Smartphone, color: "bg-indigo-100 text-indigo-600" },
    { id: 3, name: "AI/ML", members: "11.3K", icon: Brain, color: "bg-pink-100 text-pink-600" },
  ];

  const onlineFriends = [
    { id: 1, name: "James Wilson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" },
    { id: 2, name: "Lisa Park", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" },
    { id: 3, name: "David Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" },
  ];

  return (
    <div className="space-y-6" data-testid="sidebar-right">
      {/* Trending Topics */}
      <Card className="border-slate-200" data-testid="card-trending">
        <CardHeader>
          <CardTitle className="text-slate-900">Trending Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingTopics.map((topic) => (
            <Button
              key={topic.id}
              variant="ghost"
              className="w-full justify-between p-2 h-auto hover:bg-slate-50 transition-colors"
              data-testid={`button-trending-${topic.id}`}
            >
              <div>
                <p className="font-medium text-slate-900" data-testid={`text-hashtag-${topic.id}`}>
                  {topic.hashtag}
                </p>
                <p className="text-sm text-slate-500" data-testid={`text-posts-count-${topic.id}`}>
                  {topic.posts} posts
                </p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Communities */}
      <Card className="border-slate-200" data-testid="card-suggested">
        <CardHeader>
          <CardTitle className="text-slate-900">Suggested Communities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestedCommunities.map((community) => (
            <div key={community.id} className="flex items-center justify-between" data-testid={`suggested-community-${community.id}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${community.color}`}>
                  <community.icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900" data-testid={`text-suggested-name-${community.id}`}>
                    {community.name}
                  </p>
                  <p className="text-xs text-slate-500" data-testid={`text-suggested-members-${community.id}`}>
                    {community.members} members
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                data-testid={`button-join-${community.id}`}
              >
                Join
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Online Friends */}
      <Card className="border-slate-200" data-testid="card-online-friends">
        <CardHeader>
          <CardTitle className="text-slate-900">Online Now</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {onlineFriends.map((friend) => (
            <Button
              key={friend.id}
              variant="ghost"
              className="w-full justify-start p-2 h-auto hover:bg-slate-50 transition-colors"
              data-testid={`button-friend-${friend.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={friend.avatar}
                    alt={`${friend.name} avatar`}
                    className="w-10 h-10 rounded-full object-cover"
                    data-testid={`img-friend-avatar-${friend.id}`}
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <p className="font-medium text-slate-900" data-testid={`text-friend-name-${friend.id}`}>
                  {friend.name}
                </p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
