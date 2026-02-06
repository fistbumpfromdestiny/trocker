"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Mail, UserPlus, Clock, Ban } from "lucide-react";
import { formatSwedishDate } from "@/lib/utils/date";

interface PendingUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  provider: string;
  status: string;
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
}

export default function AdminAccessPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
    fetchInvites();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("/api/admin/pending-users");
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/admin/invites");
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, expiresInDays }),
      });

      if (res.ok) {
        toast.success("Invite sent!");
        setEmail("");
        fetchInvites();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send invite");
      }
    } catch (error) {
      toast.error("Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch("/api/admin/pending-users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingUserId: id }),
      });

      if (res.ok) {
        toast.success("User approved!");
        fetchPendingUsers();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to approve user");
      }
    } catch (error) {
      toast.error("Failed to approve user");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch("/api/admin/pending-users/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingUserId: id }),
      });

      if (res.ok) {
        toast.success("User rejected");
        fetchPendingUsers();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to reject user");
      }
    } catch (error) {
      toast.error("Failed to reject user");
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/invites/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Invite revoked");
        fetchInvites();
      } else {
        toast.error("Failed to revoke invite");
      }
    } catch (error) {
      toast.error("Failed to revoke invite");
    }
  };

  const activePendingUsers = pendingUsers.filter((u) => u.status === "PENDING");
  const activeInvites = invites.filter((i) => i.status === "PENDING");

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Access Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user invitations and approve membership applications
        </p>
      </div>

      {/* Send Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email Invitation
          </CardTitle>
          <CardDescription>
            Invite a user by email. They&apos;ll be able to sign in with Google once they receive the invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="expires">Expires in (days)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="30"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Applications ({activePendingUsers.length})
          </CardTitle>
          <CardDescription>
            Users who tried to sign in with Google but need approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending applications
            </p>
          ) : (
            <div className="space-y-4">
              {activePendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name || user.email}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{user.name || "No name"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied {formatSwedishDate(user.createdAt)} via {user.provider}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      className="bg-terminal-green hover:bg-terminal-green/80"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(user.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Invites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Active Invites ({activeInvites.length})
          </CardTitle>
          <CardDescription>
            Email invitations that haven&apos;t been used yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active invites
            </p>
          ) : (
            <div className="space-y-3">
              {activeInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {formatSwedishDate(invite.expiresAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRevokeInvite(invite.id)}
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Invites History */}
      <Card>
        <CardHeader>
          <CardTitle>Invite History</CardTitle>
          <CardDescription>All sent invitations and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No invites sent yet
            </p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 border rounded text-sm"
                >
                  <div>
                    <span className="font-medium">{invite.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Sent {formatSwedishDate(invite.createdAt)}
                    </span>
                    <Badge
                      variant={
                        invite.status === "ACCEPTED"
                          ? "default"
                          : invite.status === "REVOKED"
                          ? "destructive"
                          : invite.status === "EXPIRED"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {invite.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
