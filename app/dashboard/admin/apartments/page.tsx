"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Apartment {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
  user: User | null;
  location?: {
    id: string;
    name: string;
  } | null;
  _count: {
    locationReports: number;
  };
}

export default function AdminApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingApartment, setIsAddingApartment] = useState(false);
  const [newApartment, setNewApartment] = useState({
    userId: "",
    name: "",
    description: "",
    locationId: "",
  });

  useEffect(() => {
    fetchApartments();
    fetchUsers();
    fetchLocations();
  }, []);

  const fetchApartments = async () => {
    try {
      const res = await fetch("/api/admin/apartments");
      if (res.ok) {
        const data = await res.json();
        setApartments(data);
      } else {
        toast.error("Failed to fetch apartments");
      }
    } catch (error) {
      toast.error("Failed to fetch apartments");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/admin/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  };


  const handleEditApartment = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setIsDialogOpen(true);
  };

  const handleSaveApartment = async () => {
    if (!editingApartment) return;

    if (!editingApartment.name.trim()) {
      toast.error("Apartment name is required");
      return;
    }

    try {
      const res = await fetch(`/api/admin/apartments/${editingApartment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingApartment.userId,
          name: editingApartment.name,
          description: editingApartment.description,
        }),
      });

      if (res.ok) {
        toast.success("Apartment updated successfully");
        fetchApartments();
        setIsDialogOpen(false);
        setEditingApartment(null);
      } else {
        toast.error("Failed to update apartment");
      }
    } catch (error) {
      toast.error("Failed to update apartment");
    }
  };

  const handleDeleteApartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this apartment? This will also delete all associated location reports.")) return;

    try {
      const res = await fetch(`/api/admin/apartments/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Apartment deleted successfully");
        fetchApartments();
      } else {
        toast.error("Failed to delete apartment");
      }
    } catch (error) {
      toast.error("Failed to delete apartment");
    }
  };

  const handleCreateApartment = async () => {
    if (!newApartment.name.trim()) {
      toast.error("Apartment name is required");
      return;
    }

    try {
      const res = await fetch("/api/admin/apartments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newApartment,
          userId: newApartment.userId || null,
          locationId: newApartment.locationId || null,
        }),
      });

      if (res.ok) {
        toast.success("Apartment created successfully");
        setNewApartment({ userId: "", name: "", description: "", locationId: "" });
        setIsAddingApartment(false);
        fetchApartments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create apartment");
      }
    } catch (error) {
      toast.error("Failed to create apartment");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-terminal-cyan">Apartment Management</h1>
          <p className="text-terminal-green/70">Manage user apartments in the building</p>
        </div>
        <Button onClick={() => setIsAddingApartment(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Apartment
        </Button>
      </div>

      <div className="grid gap-4">
        {apartments.map((apartment) => (
          <Card key={apartment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {apartment.name}
                  </CardTitle>
                  <CardDescription>
                    Owner: {apartment.user ? (apartment.user.name || apartment.user.email) : "No owner"} • Created {formatDistanceToNow(new Date(apartment.createdAt))} ago
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditApartment(apartment)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteApartment(apartment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {apartment.description && (
                  <p className="text-sm text-terminal-green/60">{apartment.description}</p>
                )}
                {apartment.location && (
                  <p className="text-sm text-muted-foreground">
                    Location: <span className="font-medium">{apartment.location.name}</span>
                  </p>
                )}
                <div className="text-sm text-terminal-cyan">
                  <span className="font-semibold">{apartment._count.locationReports}</span> location reports
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Apartment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Apartment</DialogTitle>
            <DialogDescription>Update apartment details</DialogDescription>
          </DialogHeader>

          {editingApartment && (
            <div className="space-y-4">
              <div>
                <Label className="text-terminal-cyan">Apartment Name *</Label>
                <Input
                  value={editingApartment.name}
                  onChange={(e) =>
                    setEditingApartment({ ...editingApartment, name: e.target.value })
                  }
                  placeholder="e.g., Apartment 101"
                />
              </div>

              <div>
                <Label className="text-terminal-green">Description</Label>
                <Input
                  value={editingApartment.description || ""}
                  onChange={(e) =>
                    setEditingApartment({ ...editingApartment, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>

              <div>
                <Label className="text-terminal-yellow">Owner</Label>
                <Select
                  value={editingApartment.userId || "none"}
                  onValueChange={(value) =>
                    setEditingApartment({ ...editingApartment, userId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No owner</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Location (Optional)</Label>
                <Select
                  value={editingApartment.locationId || "none"}
                  onValueChange={(value) =>
                    setEditingApartment({
                      ...editingApartment,
                      locationId: value === "none" ? null : value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No location</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApartment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Apartment Dialog */}
      <Dialog open={isAddingApartment} onOpenChange={setIsAddingApartment}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Apartment</DialogTitle>
            <DialogDescription>
              Add a new apartment to the building. You can assign an owner now or later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-terminal-yellow">Owner</Label>
              <Select
                value={newApartment.userId || "none"}
                onValueChange={(value) =>
                  setNewApartment({ ...newApartment, userId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No owner</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-terminal-cyan">Apartment Name *</Label>
              <Input
                value={newApartment.name}
                onChange={(e) =>
                  setNewApartment({ ...newApartment, name: e.target.value })
                }
                placeholder="e.g., Apartment 101"
              />
            </div>

            <div>
              <Label className="text-terminal-green">Description</Label>
              <Input
                value={newApartment.description}
                onChange={(e) =>
                  setNewApartment({ ...newApartment, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div>
              <Label>Location (Optional)</Label>
              <Select
                value={newApartment.locationId || "none"}
                onValueChange={(value) =>
                  setNewApartment({ ...newApartment, locationId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingApartment(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateApartment}>
              Create Apartment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
