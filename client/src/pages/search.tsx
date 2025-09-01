import { useEffect, useMemo } from "react";
import Navbar from "@/components/navbar";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, User, FileText } from "lucide-react";

type SearchUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type SearchPost = {
  id: string;
  content: string;
  userId: string;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

export default function SearchResults() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const q = (params.get("q") || "").trim();

  // SEO: update title and meta description
  useEffect(() => {
    const titleBase = "Linkup";
    document.title = q ? `Search: "${q}" | ${titleBase}` : `Search | ${titleBase}`;

    const descContent = q
      ? `Search results on Linkup for "${q}". Discover people and posts.`
      : "Search Linkup for people and posts.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", descContent);
  }, [q]);

  const { data, isLoading, error } = useQuery<{
    users: SearchUser[];
    posts: SearchPost[];
    query: string;
  }>({
    queryKey: [`/api/search?q=${encodeURIComponent(q)}`],
    enabled: q.length > 0,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <SearchIcon className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Search results {q ? `for "${q}"` : ""}
            </h1>
          </div>
          <p className="text-slate-600">
            {q ? "Discover people and posts matching your query." : "Type in the search bar to find people and posts."}
          </p>
        </div>

        {error ? (
          <Card className="border-slate-200">
            <CardContent className="py-10 text-center text-slate-600">
              Failed to load results.
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex space-x-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : q.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-10 text-center text-slate-600">
              Enter a term in the search bar above.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* People */}
            <div className="lg:col-span-1">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-slate-900">
                    <User className="w-5 h-5 text-indigo-600" />
                    <span>People</span>
                    <span className="ml-auto text-sm text-slate-500">
                      {data?.users?.length || 0}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data?.users || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No people found</p>
                  ) : (
                    data!.users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${(u.firstName || "U") + " " + (u.lastName || "")}`}
                            alt="avatar"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-slate-900">
                              {(u.firstName || "") + " " + (u.lastName || "")}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Posts */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-slate-900">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span>Posts</span>
                    <span className="ml-auto text-sm text-slate-500">
                      {data?.posts?.length || 0}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(data?.posts || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No posts found</p>
                  ) : (
                    data!.posts.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 border border-slate-200 rounded-lg bg-white"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-slate-900">
                            {(p.user.firstName || "") + " " + (p.user.lastName || "")}
                          </span>
                          <span className="text-xs text-slate-500">{p.user.email}</span>
                        </div>
                        <p className="text-slate-700">{p.content}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}