"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Lock, BarChart3, MapPin, MessageSquare, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatSwedishDate } from "@/lib/utils/date";

interface UserStats {
  totalReports: number;
  recentReports: any[];
  topLocations: { location: string; count: number }[];
  totalMessages: number;
  isOAuthUser: boolean;
  oAuthProvider: string | null;
  memberSince: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (res.ok) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and view your activity
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{session?.user?.name || "Not set"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <Badge variant={session?.user?.role === "ADMIN" ? "default" : "secondary"}>
                {session?.user?.role}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Type</Label>
              <p className="font-medium">
                {stats?.isOAuthUser
                  ? `OAuth (${stats.oAuthProvider})`
                  : "Email/Password"}
              </p>
            </div>
          </div>
          {stats?.memberSince && (
            <div>
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member Since
              </Label>
              <p className="font-medium">
                {formatSwedishDate(stats.memberSince)} (
                {formatDistanceToNow(new Date(stats.memberSince))} ago)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password - Only for non-OAuth users */}
      {!stats?.isOAuthUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={changingPassword}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={changingPassword}
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={changingPassword}
                />
              </div>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Your Activity
          </CardTitle>
          <CardDescription>
            Overview of your contributions to tracking Rocky
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <p className="text-muted-foreground text-center py-8">Loading stats...</p>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-terminal-cyan mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Location Reports</span>
                  </div>
                  <p className="text-3xl font-bold">{stats?.totalReports || 0}</p>
                </div>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-terminal-green mb-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">Messages Sent</span>
                  </div>
                  <p className="text-3xl font-bold">{stats?.totalMessages || 0}</p>
                </div>
              </div>

              <Separator />

              {/* Top Locations */}
              {stats?.topLocations && stats.topLocations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Most Reported Locations</h3>
                  <div className="space-y-2">
                    {stats.topLocations.map((loc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <span className="font-medium">{loc.location}</span>
                        <Badge variant="outline">{loc.count} reports</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {stats?.recentReports && stats.recentReports.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {stats.recentReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 border rounded text-sm"
                      >
                        <div>
                          <span className="font-medium">{report.cat.name}</span>
                          <span className="text-muted-foreground"> at </span>
                          <span className="font-medium">
                            {report.apartment?.name || report.location.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(report.createdAt))} ago
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats?.totalReports === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No activity yet. Start tracking Rocky to see your stats!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
