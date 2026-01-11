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

interface Room {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
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
  rooms: Room[];
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addingRoomToLocation, setAddingRoomToLocation] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState({ name: "", description: "" });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);

  useEffect(() => {
    fetchLocations();
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
    } catch (error) {
      toast.error("Failed to fetch locations");
    } finally {
      setLoading(false);
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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to delete location");
    }
  };

  const handleAddRoom = async (locationId: string) => {
    if (!newRoom.name.trim()) {
      toast.error("Room name is required");
      return;
    }

    try {
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          name: newRoom.name,
          description: newRoom.description || null,
          displayOrder: 0,
        }),
      });

      if (res.ok) {
        toast.success("Room added successfully");
        setNewRoom({ name: "", description: "" });
        setAddingRoomToLocation(null);
        fetchLocations();
      } else {
        toast.error("Failed to add room");
      }
    } catch (error) {
      toast.error("Failed to add room");
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const res = await fetch(`/api/admin/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Room deleted successfully");
        fetchLocations();
      } else {
        toast.error("Failed to delete room");
      }
    } catch (error) {
      toast.error("Failed to delete room");
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsRoomDialogOpen(true);
  };

  const handleSaveRoom = async () => {
    if (!editingRoom) return;

    try {
      const res = await fetch(`/api/admin/rooms/${editingRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRoom),
      });

      if (res.ok) {
        toast.success("Room updated successfully");
        fetchLocations();
        setIsRoomDialogOpen(false);
        setEditingRoom(null);
      } else {
        toast.error("Failed to update room");
      }
    } catch (error) {
      toast.error("Failed to update room");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-terminal-cyan">Location Management</h1>
        <p className="text-terminal-green/70">Manage map locations and their rooms</p>
      </div>

      <div className="grid gap-4">
        {locations.map((location) => (
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
                  <Label className="text-sm font-semibold text-terminal-green">Rooms ({location.rooms.length})</Label>
                  {location.rooms.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {location.rooms.map((room) => (
                        <div key={room.id} className="flex items-center justify-between bg-muted p-2 rounded">
                          <div>
                            <span className="text-sm font-medium">{room.name}</span>
                            {room.description && (
                              <p className="text-xs text-muted-foreground">{room.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRoom(room)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRoom(room.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No rooms yet</p>
                  )}
                </div>

                {addingRoomToLocation === location.id ? (
                  <div className="space-y-2 bg-muted p-3 rounded">
                    <Input
                      placeholder="Room name"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAddRoom(location.id)}>
                        Save Room
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddingRoomToLocation(null);
                          setNewRoom({ name: "", description: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingRoomToLocation(location.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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

      {/* Edit Room Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room details</DialogDescription>
          </DialogHeader>

          {editingRoom && (
            <div className="space-y-4">
              <div>
                <Label className="text-terminal-cyan">Room Name</Label>
                <Input
                  value={editingRoom.name}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="text-terminal-green">Description</Label>
                <Input
                  value={editingRoom.description || ""}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>

              <div>
                <Label className="text-terminal-yellow">Display Order</Label>
                <Input
                  type="number"
                  value={editingRoom.displayOrder}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      displayOrder: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoom}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
