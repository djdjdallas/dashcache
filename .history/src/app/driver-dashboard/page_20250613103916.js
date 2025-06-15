"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatsRow } from "@/components/stats-row";
import { UploadTab } from "@/components/upload-tab";
import { VideosTab } from "@/components/videos-tab";
import { EarningsTab } from "@/components/earnings-tab";

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setUser(user);

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile || profile.user_type !== "driver") {
        router.push("/auth");
        return;
      }

      setProfile(profile);

      // Load dashboard data
      await Promise.all([loadSubmissions(user.id), loadEarnings(user.id)]);
    } catch (error) {
      console.error("Error checking user:", error);
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (userId) => {
    const { data, error } = await supabase
      .from("video_submissions")
      .select("*")
      .eq("driver_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading submissions:", error);
    } else {
      setSubmissions(data || []);
    }
  };

  const loadEarnings = async (userId) => {
    const { data, error } = await supabase
      .from("driver_earnings")
      .select("*")
      .eq("driver_id", userId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error loading earnings:", error);
    } else {
      setEarnings(data || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <StatsRow
          earnings={earnings}
          submissions={submissions}
          profile={profile}
        />

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-blue-300 border border-gray-200 rounded-lg shadow-sm mb-1">
            <TabsTrigger value="upload">Upload Videos</TabsTrigger>
            <TabsTrigger value="videos">My Videos</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <UploadTab
              userId={user?.id}
              onUploadComplete={() => loadSubmissions(user.id)}
            />
          </TabsContent>

          <TabsContent value="videos">
            <VideosTab submissions={submissions} />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsTab earnings={earnings} profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
