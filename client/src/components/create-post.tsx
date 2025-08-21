import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Image, BarChart3, Calendar, Loader2 } from "lucide-react";

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string }) => {
      await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
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
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please write something before posting.",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate({ content: content.trim() });
  };

  return (
    <Card className="bg-white shadow-sm border border-slate-200 mb-6" data-testid="card-create-post">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-4">
            <img
              src={user?.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'User'} ${user?.lastName || ''}`}
              alt="Your avatar"
              className="w-12 h-12 rounded-full object-cover"
              data-testid="img-user-avatar-create"
            />
            <div className="flex-1">
              <Textarea
                placeholder="Share something with your community..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full resize-none border-none outline-none placeholder-slate-500 text-slate-900 text-lg bg-slate-50 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                data-testid="textarea-post-content"
              />
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition-colors"
                    data-testid="button-add-image"
                  >
                    <Image size={20} />
                    <span>Photo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition-colors"
                    data-testid="button-add-poll"
                  >
                    <BarChart3 size={20} />
                    <span>Poll</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition-colors"
                    data-testid="button-add-event"
                  >
                    <Calendar size={20} />
                    <span>Event</span>
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={!content.trim() || createPostMutation.isPending}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors"
                  data-testid="button-submit-post"
                >
                  {createPostMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
