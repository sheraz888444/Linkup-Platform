import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Users, MessageSquare, Heart, Search, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Link2 className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-slate-900">Linkup</span>
            </div>
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Link2 className="text-white text-3xl" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6" data-testid="text-hero-title">
              Connect Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Community</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto" data-testid="text-hero-subtitle">
              Join a thriving social platform designed for developers, creators, and innovators. 
              Share your ideas, discover new perspectives, and build meaningful connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => window.location.href = '/signup'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-3"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-lg px-8 py-3"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" data-testid="text-features-title">
              Everything you need to stay connected
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto" data-testid="text-features-subtitle">
              Powerful features designed to help you share, discover, and engage with your community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow" data-testid="card-feature-sharing">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="text-indigo-600 text-xl" />
                </div>
                <CardTitle className="text-slate-900">Smart Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Share your thoughts, code snippets, and projects with rich formatting and media support.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow" data-testid="card-feature-communities">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-purple-600 text-xl" />
                </div>
                <CardTitle className="text-slate-900">Vibrant Communities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Join specialized communities focused on your interests, from React to UI/UX design.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow" data-testid="card-feature-engagement">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="text-amber-600 text-xl" />
                </div>
                <CardTitle className="text-slate-900">Real Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Like, comment, and have meaningful conversations with fellow creators and developers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow" data-testid="card-feature-discovery">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="text-green-600 text-xl" />
                </div>
                <CardTitle className="text-slate-900">Smart Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Discover trending topics, influential creators, and content tailored to your interests.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow" data-testid="card-feature-realtime">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="text-rose-600 text-xl" />
                </div>
                <CardTitle className="text-slate-900">Real-time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Stay updated with instant notifications and real-time feed updates as they happen.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow" data-testid="card-feature-professional">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Link2 className="text-blue-600 text-xl" />
                </div>
                <CardTitle className="text-slate-900">Professional Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Build your professional network and showcase your expertise to industry peers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6" data-testid="text-cta-title">
            Ready to join the community?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto" data-testid="text-cta-subtitle">
            Start connecting with like-minded professionals and creators today. 
            Your community is waiting for you.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = '/signup'}
            className="bg-white text-indigo-600 hover:bg-slate-50 text-lg px-8 py-3"
            data-testid="button-join-now"
          >
            Join Linkup Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Link2 className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-white">Linkup</span>
            </div>
            <p className="text-slate-400 text-center" data-testid="text-footer-copyright">
              © 2024 Linkup. Built for creators, by creators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
