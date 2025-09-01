import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NotificationItem = {
  id: number;
  text: string;
  time: string;
  avatar?: string;
};

export default function SidebarRight() {
  // Mock notifications (replace with API-backed notifications later)
  const notifications: NotificationItem[] = [
    {
      id: 1,
      text: "Alex Johnson liked your post",
      time: "2m ago",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150",
    },
    {
      id: 2,
      text: "Sarah Parker commented: “Loved this!”",
      time: "10m ago",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150",
    },
    {
      id: 3,
      text: "Michael Lee started following you",
      time: "1h ago",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150",
    },
  ];

  return (
    <div className="space-y-6" data-testid="sidebar-right">
      {/* Notifications */}
      <Card className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" data-testid="card-notifications">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-zinc-100">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">You're all caught up!</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors"
                data-testid={`notification-${n.id}`}
              >
                <img
                  src={
                    n.avatar ||
                    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&h=150"
                  }
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-slate-800 dark:text-zinc-100">{n.text}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{n.time}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
