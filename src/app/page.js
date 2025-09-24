"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthButton from "@/components/AuthButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, User } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to plans page
    if (user && !loading) {
      router.push('/plans');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // This will be handled by the useEffect redirect
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to GoOut
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with University of Michigan students and discover spontaneous events happening around campus.
          </p>
          <AuthButton />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Discover Events</CardTitle>
              <CardDescription>
                Find spontaneous events happening in the next 12 hours around campus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Browse events by category, location, and time to find activities that match your interests.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Connect with People</CardTitle>
              <CardDescription>
                Meet other U-M students and build your campus network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Browse student profiles, connect with people in your department, and expand your social circle.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <User className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Create Events</CardTitle>
              <CardDescription>
                Host your own events and bring people together
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create study groups, social gatherings, or any activity you want to share with fellow students.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            How GoOut Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sign In</h3>
              <p className="text-gray-600 text-sm">
                Use your U-M Google account to join the platform
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Complete Profile</h3>
              <p className="text-gray-600 text-sm">
                Add your info so others can get to know you
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Discover & Join</h3>
              <p className="text-gray-600 text-sm">
                Find events and request to join activities you're interested in
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect & Have Fun</h3>
              <p className="text-gray-600 text-sm">
                Meet new people and enjoy spontaneous campus activities
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>Exclusively for University of Michigan students</p>
          <p className="text-sm mt-2">Sign in with your @umich.edu email to get started</p>
        </div>
      </div>
    </div>
  );
}
