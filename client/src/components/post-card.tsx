import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  MessageSquare, 
  Share, 
  Bookmark, 
  MoreHorizontal,
  Send,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PostWithUser, CommentWithUser } from "@shared/schema";

interface PostCardProps {
  post: PostWithUser;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
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
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Comments query
  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/posts", post.id, "comments"],
    enabled: showComments,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
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
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    toggleLikeMutation.mutate();
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    addCommentMutation.mutate(commentContent.trim());
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <Card className="bg-white shadow-sm border border-slate-200 overflow-hidden" data-testid={`card-post-${post.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <img
            src={post.user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${post.user.firstName || 'User'} ${post.user.lastName || ''}`}
            alt={`${post.user.firstName || 'User'} avatar`}
            className="w-12 h-12 rounded-full object-cover"
            data-testid={`img-user-avatar-${post.id}`}
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-slate-900" data-testid={`text-username-${post.id}`}>
                {post.user.firstName || post.user.lastName 
                  ? `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim()
                  : 'User'
                }
              </h3>
              <span className="text-indigo-500">•</span>
              <span className="text-sm text-slate-500" data-testid={`text-user-title-${post.id}`}>
                {post.user.title || 'Member'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-sm text-slate-500" data-testid={`text-post-time-${post.id}`}>
                {formatTimeAgo(post.createdAt!)}
              </span>
            </div>
            <p className="text-slate-600 mt-2 whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
              {post.content}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600" data-testid={`button-post-menu-${post.id}`}>
                <MoreHorizontal size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid={`item-share-${post.id}`}>
                Share Post
              </DropdownMenuItem>
              {post.userId === user?.id && (
                <DropdownMenuItem className="text-red-600" data-testid={`item-delete-${post.id}`}>
                  Delete Post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post image"
            className="w-full h-64 object-cover rounded-lg mt-4"
            data-testid={`img-post-image-${post.id}`}
          />
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={toggleLikeMutation.isPending}
              className={`flex items-center space-x-2 transition-colors ${
                post.isLiked 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-slate-600 hover:text-red-500"
              }`}
              data-testid={`button-like-${post.id}`}
            >
              <Heart className={post.isLiked ? "fill-current" : ""} size={20} />
              <span>{post.likesCount || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              className="flex items-center space-x-2 text-slate-600 hover:text-indigo-500 transition-colors"
              data-testid={`button-comment-${post.id}`}
            >
              <MessageSquare size={20} />
              <span>{post.commentsCount || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-slate-600 hover:text-green-500 transition-colors"
              data-testid={`button-share-${post.id}`}
            >
              <Share size={20} />
              <span>Share</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-amber-500 transition-colors"
            data-testid={`button-bookmark-${post.id}`}
          >
            <Bookmark size={20} />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-6 pt-6 border-t border-slate-200" data-testid={`comments-section-${post.id}`}>
            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex space-x-3 mb-4">
              <img
                src={user?.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'User'} ${user?.lastName || ''}`}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
                data-testid={`img-comment-avatar-${post.id}`}
              />
              <div className="flex-1 flex space-x-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="flex-1 min-h-[40px] resize-none"
                  data-testid={`textarea-comment-${post.id}`}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentContent.trim() || addCommentMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  data-testid={`button-submit-comment-${post.id}`}
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>
            </form>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                    <img
                      src={comment.user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user.firstName || 'User'} ${comment.user.lastName || ''}`}
                      alt={`${comment.user.firstName || 'User'} avatar`}
                      className="w-8 h-8 rounded-full object-cover"
                      data-testid={`img-comment-user-avatar-${comment.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-slate-900" data-testid={`text-comment-username-${comment.id}`}>
                          {comment.user.firstName || comment.user.lastName 
                            ? `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim()
                            : 'User'
                          }
                        </span>
                        <span className="text-xs text-slate-500" data-testid={`text-comment-time-${comment.id}`}>
                          {formatTimeAgo(comment.createdAt!)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1" data-testid={`text-comment-content-${comment.id}`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4" data-testid={`text-no-comments-${post.id}`}>
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
