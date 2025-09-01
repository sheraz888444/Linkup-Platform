import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link2, Search, Bell, MessageSquare, Home, User, LogOut, Shield, Video, Users } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const u = user as any;
  const isAdmin = !!(u && u.role === 'admin');
  const displayName = (u?.firstName || u?.lastName)
    ? `${u?.firstName || ''} ${u?.lastName || ''}`.trim()
    : 'User';
  const avatar = u?.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u?.firstName || 'User'} ${u?.lastName || ''}`;
  const email = u?.email || '';

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length === 0) return;
    setLocation(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <nav className="bg-white dark:bg-zinc-900 shadow-sm border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Link2 className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-slate-900">Linkup</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-slate-400" size={20} />
                </div>
                <Input
                  type="text"
                  placeholder="Search communities, posts, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 rounded-full leading-5
                             bg-white text-slate-900 placeholder-slate-500 border border-slate-300
                             focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400 dark:border-zinc-700"
                  data-testid="input-search"
                />
              </div>
            </form>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/home")}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              data-testid="button-home"
            >
              <Home className="text-slate-600 text-xl" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/videos")}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              data-testid="button-videos"
            >
              <Video className="text-slate-600 text-xl" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/friends")}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              data-testid="button-friends"
            >
              <Users className="text-slate-600 text-xl" />
            </Button>

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin")}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                data-testid="button-admin"
              >
                <Shield className="text-indigo-600 text-xl" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-slate-100 transition-colors relative"
              data-testid="button-notifications"
            >
              <Bell className="text-slate-600 text-xl" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              data-testid="button-messages"
            >
              <MessageSquare className="text-slate-600 text-xl" />
            </Button>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0"
                  data-testid="button-user-menu"
                >
                  <img
                    src={avatar}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                    data-testid="img-user-avatar"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none" data-testid="text-dropdown-username">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none text-slate-600" data-testid="text-dropdown-email">
                    {email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="item-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="item-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
