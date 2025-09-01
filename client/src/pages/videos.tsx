import { useEffect } from "react";
import Navbar from "@/components/navbar";
import SidebarLeft from "@/components/sidebar-left";
import SidebarRight from "@/components/sidebar-right";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function Videos() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <SidebarLeft />
          </div>

          {/* Videos Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-700 p-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Videos</h1>
              <p className="text-slate-600 dark:text-zinc-300">
                Explore and share videos. Upload videos from the Create Post composer on Home.
              </p>
              <div className="mt-6 p-6 border rounded-lg border-dashed border-slate-300 dark:border-zinc-700 text-center text-slate-500">
                Video feed coming soon.
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <SidebarRight />
          </div>
        </div>
      </div>
    </div>
  );
}