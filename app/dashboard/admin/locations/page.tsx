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

interface Apartment {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  userId: string;
  locationId: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface Location {
  id: string;
  externalId: string;
  name: string;
  description: string | null;
  type: string;
  gridTop: string;
  gridLeft: string;
  gridWidth: string;
  gridHeight: string;
  displayOrder: number;
  isActive: boolean;
  apartments: Apartment[];
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<Array<{id: string, email: string, name: string | null}>>([]);
  const [allApartments, setAllApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addingApartmentToLocation, setAddingApartmentToLocation] = useState<string | null>(null);
  const [newApartment, setNewApartment] = useState({ name: "", description: "", userId: "" });
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [isApartmentDialogOpen, setIsApartmentDialogOpen] = useState(false);
  const [attachingToLocation, setAttachingToLocation] = useState<string | null>(null);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>("");

  // Filter state
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterApartmentStatus, setFilterApartmentStatus] = useState<string>("ALL");

  useEffect(() => {
    fetchLocations();
    fetchUsers();
    fetchAllApartments();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/admin/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      } else {
        toast.error("Failed to fetch locations");
      }
    } catch {
      toast.error("Failed to fetch locations");
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

  const fetchAllApartments = async () => {
    try {
      const res = await fetch("/api/admin/apartments");
      if (res.ok) {
        const data = await res.json();
        setAllApartments(data);
      }
    } catch (error) {
      console.error("Failed to fetch apartments:", error);
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!editingLocation) return;

    try {
      const res = await fetch(`/api/admin/locations/${editingLocation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingLocation),
      });

      if (res.ok) {
        toast.success("Location updated successfully");
        fetchLocations();
        setIsDialogOpen(false);
        setEditingLocation(null);
      } else {
        toast.error("Failed to update location");
      }
    } catch {
      toast.error("Failed to update location");
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Location deleted successfully");
        fetchLocations();
      } else {
        toast.error("Failed to delete location");
      }
    } catch {
      toast.error("Failed to delete location");
    }
  };

  const handleAddApartment = async (locationId: string) => {
    if (!newApartment.name.trim() || !newApartment.userId) {
      toast.error("Apartment name and owner are required");
      return;
    }

    try {
      const res = await fetch("/api/admin/apartments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          userId: newApartment.userId,
          name: newApartment.name,
          description: newApartment.description || null,
          displayOrder: 0,
        }),
      });

      if (res.ok) {
        toast.success("Apartment added successfully");
        setNewApartment({ name: "", description: "", userId: "" });
        setAddingApartmentToLocation(null);
        fetchLocations();
      } else {
        toast.error("Failed to add apartment");
      }
    } catch {
      toast.error("Failed to add apartment");
    }
  };

  const handleDeleteApartment = async (apartmentId: string) => {
    if (!confirm("Are you sure you want to delete this apartment?")) return;

    try {
      const res = await fetch(`/api/admin/apartments/${apartmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Apartment deleted successfully");
        fetchLocations();
      } else {
        toast.error("Failed to delete apartment");
      }
    } catch {
      toast.error("Failed to delete apartment");
    }
  };

  const handleEditApartment = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setIsApartmentDialogOpen(true);
  };

  const handleSaveApartment = async () => {
    if (!editingApartment) return;

    try {
      const res = await fetch(`/api/admin/apartments/${editingApartment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingApartment),
      });

      if (res.ok) {
        toast.success("Apartment updated successfully");
        fetchLocations();
        fetchAllApartments();
        setIsApartmentDialogOpen(false);
        setEditingApartment(null);
      } else {
        toast.error("Failed to update apartment");
      }
    } catch {
      toast.error("Failed to update apartment");
    }
  };

  const handleAttachApartment = async (locationId: string) => {
    if (!selectedApartmentId) {
      toast.error("Please select an apartment");
      return;
    }

    const apartment = allApartments.find(apt => apt.id === selectedApartmentId);
    if (!apartment) return;

    try {
      const res = await fetch(`/api/admin/apartments/${selectedApartmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...apartment,
          locationId,
        }),
      });

      if (res.ok) {
        toast.success("Apartment attached to location");
        setSelectedApartmentId("");
        setAttachingToLocation(null);
        fetchLocations();
        fetchAllApartments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to attach apartment");
      }
    } catch {
      toast.error("Failed to attach apartment");
    }
  };

  // Apply filters
  const filteredLocations = locations.filter(location => {
    // Type filter
    if (filterType !== "ALL" && location.type !== filterType) {
      return false;
    }

    // Apartment status filter
    if (filterApartmentStatus === "WITH" && location.apartments.length === 0) {
      return false;
    }
    if (filterApartmentStatus === "WITHOUT" && location.apartments.length > 0) {
      return false;
    }

    return true;
  });

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-terminal-cyan">Location Management</h1>
        <p className="text-terminal-green/70">Manage map locations and their apartments</p>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-terminal-cyan">Location Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="APARTMENT">Apartment</SelectItem>
                  <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                  <SelectItem value="BUILDING_COMMON">Building Common</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label className="text-terminal-green">Apartment Status</Label>
              <Select value={filterApartmentStatus} onValueChange={setFilterApartmentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Locations</SelectItem>
                  <SelectItem value="WITH">With Apartments</SelectItem>
                  <SelectItem value="WITHOUT">Without Apartments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filterType !== "ALL" || filterApartmentStatus !== "ALL") && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType("ALL");
                    setFilterApartmentStatus("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-3">
            Showing {filteredLocations.length} of {locations.length} locations
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredLocations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No locations match the selected filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLocations.map((location) => (
            <Card key={location.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {location.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({location.type})
                    </span>
                  </CardTitle>
                  <CardDescription>
                    ID: {location.externalId} | Position: {location.gridTop} / {location.gridLeft}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLocation(location)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLocation(location.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-terminal-green">Apartments ({location.apartments.length})</Label>
                  {location.apartments.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {location.apartments.map((apartment) => (
                        <div key={apartment.id} className="flex items-center justify-between bg-muted p-2 rounded">
                          <div>
                            <span className="text-sm font-medium">{apartment.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              (Owner: {apartment.user.name || apartment.user.email})
                            </span>
                            {apartment.description && (
                              <p className="text-xs text-muted-foreground">{apartment.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditApartment(apartment)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteApartment(apartment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No apartments yet</p>
                  )}
                </div>

                {addingApartmentToLocation === location.id ? (
                  <div className="space-y-2 bg-muted p-3 rounded">
                    <Select
                      value={newApartment.userId}
                      onValueChange={(value) => setNewApartment({ ...newApartment, userId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Apartment name (e.g., 10A)"
                      value={newApartment.name}
                      onChange={(e) => setNewApartment({ ...newApartment, name: e.target.value })}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newApartment.description}
                      onChange={(e) => setNewApartment({ ...newApartment, description: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAddApartment(location.id)}>
                        Save Apartment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddingApartmentToLocation(null);
                          setNewApartment({ name: "", description: "", userId: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : attachingToLocation === location.id ? (
                  <div className="space-y-2 bg-muted p-3 rounded">
                    <Label className="text-sm">Attach Existing Apartment</Label>
                    <Select
                      value={selectedApartmentId}
                      onValueChange={setSelectedApartmentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select apartment" />
                      </SelectTrigger>
                      <SelectContent>
                        {allApartments.filter(apt => !apt.locationId).length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No unattached apartments available
                          </div>
                        ) : (
                          allApartments
                            .filter(apt => !apt.locationId)
                            .map((apt) => (
                              <SelectItem key={apt.id} value={apt.id}>
                                {apt.name} ({apt.user.name || apt.user.email})
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAttachApartment(location.id)}>
                        Attach
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAttachingToLocation(null);
                          setSelectedApartmentId("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingApartmentToLocation(location.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAttachingToLocation(location.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Attach Existing
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Edit Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update location details</DialogDescription>
          </DialogHeader>

          {editingLocation && (
            <div className="space-y-4">
              <div>
                <Label className="text-terminal-cyan">Name</Label>
                <Input
                  value={editingLocation.name}
                  onChange={(e) =>
                    setEditingLocation({ ...editingLocation, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="text-terminal-green">External ID</Label>
                <Input
                  value={editingLocation.externalId}
                  onChange={(e) =>
                    setEditingLocation({ ...editingLocation, externalId: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="text-terminal-yellow">Type</Label>
                <Select
                  value={editingLocation.type}
                  onValueChange={(value) =>
                    setEditingLocation({ ...editingLocation, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APARTMENT">Apartment</SelectItem>
                    <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                    <SelectItem value="BUILDING_COMMON">Building Common</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-terminal-cyan">Grid Top</Label>
                  <Input
                    value={editingLocation.gridTop}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, gridTop: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-terminal-green">Grid Left</Label>
                  <Input
                    value={editingLocation.gridLeft}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, gridLeft: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-terminal-cyan">Grid Width</Label>
                  <Input
                    value={editingLocation.gridWidth}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, gridWidth: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-terminal-green">Grid Height</Label>
                  <Input
                    value={editingLocation.gridHeight}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, gridHeight: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-terminal-yellow">Display Order</Label>
                <Input
                  type="number"
                  value={editingLocation.displayOrder}
                  onChange={(e) =>
                    setEditingLocation({
                      ...editingLocation,
                      displayOrder: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLocation}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Apartment Dialog */}
      <Dialog open={isApartmentDialogOpen} onOpenChange={setIsApartmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Apartment</DialogTitle>
            <DialogDescription>Update apartment details</DialogDescription>
          </DialogHeader>

          {editingApartment && (
            <div className="space-y-4">
              <div>
                <Label className="text-terminal-yellow">Owner</Label>
                <Select
                  value={editingApartment.userId}
                  onValueChange={(value) =>
                    setEditingApartment({ ...editingApartment, userId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-terminal-cyan">Apartment Name</Label>
                <Input
                  value={editingApartment.name}
                  onChange={(e) =>
                    setEditingApartment({ ...editingApartment, name: e.target.value })
                  }
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
                <Label className="text-terminal-yellow">Display Order</Label>
                <Input
                  type="number"
                  value={editingApartment.displayOrder}
                  onChange={(e) =>
                    setEditingApartment({
                      ...editingApartment,
                      displayOrder: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApartmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApartment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
