import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Video, Loader2, X } from "lucide-react";

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  async function uploadMedia(file: File) {
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Upload failed");
      }
      return data as { url: string; type: "image" | "video" };
    } finally {
      setUploading(false);
    }
  }

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; imageUrl?: string | null; videoUrl?: string | null }) => {
      await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      setContent("");
      setImageUrl(null);
      setVideoUrl(null);
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
          window.location.href = "/";
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
    if (!content.trim() && !imageUrl && !videoUrl) {
      toast({
        title: "Error",
        description: "Write something or attach media before posting.",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate({
      content: content.trim(),
      imageUrl,
      videoUrl,
    });
  };

  const onPickImage = () => imageInputRef.current?.click();
  const onPickVideo = () => videoInputRef.current?.click();

  const onImageSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url, type } = await uploadMedia(file);
      if (type !== "image") throw new Error("Please select an image file");
      setImageUrl(url);
      setVideoUrl(null); // only one media type at a time
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const onVideoSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url, type } = await uploadMedia(file);
      if (type !== "video") throw new Error("Please select a video file");
      setVideoUrl(url);
      setImageUrl(null); // only one media type at a time
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload video",
        variant: "destructive",
      });
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-slate-200 mb-6" data-testid="card-create-post">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-4">
            <img
              src={
                user?.profileImageUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || "User"} ${user?.lastName || ""}`
              }
              alt="Your avatar"
              className="w-12 h-12 rounded-full object-cover"
              data-testid="img-user-avatar-create"
            />
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full resize-none border-none outline-none placeholder-slate-500 text-slate-900 text-lg bg-slate-50 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                data-testid="textarea-post-content"
              />

              {/* Media preview */}
              {(imageUrl || videoUrl) && (
                <div className="mt-4 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
                    onClick={() => {
                      setImageUrl(null);
                      setVideoUrl(null);
                    }}
                    data-testid="button-remove-media"
                  >
                    <X size={16} />
                  </Button>

                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Selected"
                      className="w-full max-h-80 object-contain rounded-lg border border-slate-200"
                      data-testid="preview-image"
                    />
                  ) : null}
                  {videoUrl ? (
                    <video
                      controls
                      className="w-full max-h-96 rounded-lg border border-slate-200 bg-black"
                      data-testid="preview-video"
                    >
                      <source src={videoUrl} />
                      Your browser does not support the video tag.
                    </video>
                  ) : null}
                </div>
              )}

              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onPickImage}
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
                    onClick={onPickVideo}
                    className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition-colors"
                    data-testid="button-add-video"
                  >
                    <Video size={20} />
                    <span>Video</span>
                  </Button>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageSelected}
                    data-testid="input-image-file"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onVideoSelected}
                    data-testid="input-video-file"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={uploading || createPostMutation.isPending || (!content.trim() && !imageUrl && !videoUrl)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors"
                  data-testid="button-submit-post"
                >
                  {(uploading || createPostMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {uploading
                    ? "Uploading..."
                    : createPostMutation.isPending
                    ? "Posting..."
                    : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
