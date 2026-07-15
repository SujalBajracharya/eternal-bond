import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, MapPin, Compass, Trash2, Calendar, Clock, Globe } from "lucide-react";
import NavbarAuthenticated from "@/components/userSide/NavbarAuthenticated";
import {
  getKundaliProfile,
  createKundaliProfile,
  updateKundaliProfile,
  deleteKundaliProfile,
  type KundaliProfileRequest
} from "@/api/astrology";

interface PlaceSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function CreateKundaliProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Component states
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [timezone, setTimezone] = useState<number | null>(null);

  // Autocomplete suggestions
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch existing profile if there is one
  const { data: existingProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["kundaliProfile"],
    queryFn: getKundaliProfile,
    retry: false,
  });

  // Load existing profile details into state
  useEffect(() => {
    if (existingProfile) {
      setBirthDate(existingProfile.birthDate || "");
      setBirthTime(existingProfile.birthTime ? existingProfile.birthTime.substring(0, 5) : "");
      setBirthPlace(existingProfile.birthPlace || "");
      setLatitude(existingProfile.birthLatitude);
      setLongitude(existingProfile.birthLongitude);
      setTimezone(existingProfile.birthTimezone);
      setSearchQuery(existingProfile.birthPlace || "");
    }
  }, [existingProfile]);

  // Debounced search for Nominatim autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 3 || isSearching) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingPlaces(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Geocoding fetch error:", err);
      } finally {
        setLoadingPlaces(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearching]);

  // Fetch timezone from latitude/longitude
  const fetchTimezoneDetails = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.standardUtcOffset && typeof data.standardUtcOffset.seconds === "number") {
          return data.standardUtcOffset.seconds / 3600;
        }
      }
    } catch (err) {
      console.error("Timezone fetch error:", err);
    }
    // Fallback: browser's timezone offset
    return -new Date().getTimezoneOffset() / 60;
  };

  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    setIsSearching(true);
    setSearchQuery(suggestion.display_name);
    setBirthPlace(suggestion.display_name);
    
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setLatitude(lat);
    setLongitude(lon);
    setSuggestions([]);

    toast.promise(
      fetchTimezoneDetails(lat, lon).then((tzOffset) => {
        setTimezone(tzOffset);
        setIsSearching(false);
      }),
      {
        loading: "Resolving timezone for location...",
        success: "Location and timezone resolved successfully!",
        error: "Failed to resolve timezone. Using system default offset.",
      }
    );
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: createKundaliProfile,
    onSuccess: () => {
      toast.success("Kundali profile created successfully!");
      queryClient.invalidateQueries({ queryKey: ["kundaliProfile"] });
      navigate("/profile");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create Kundali profile");
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: updateKundaliProfile,
    onSuccess: () => {
      toast.success("Kundali profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["kundaliProfile"] });
      navigate("/profile");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update Kundali profile");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteKundaliProfile,
    onSuccess: () => {
      toast.success("Kundali profile deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["kundaliProfile"] });
      // Reset state
      setBirthDate("");
      setBirthTime("");
      setBirthPlace("");
      setLatitude(null);
      setLongitude(null);
      setTimezone(null);
      setSearchQuery("");
      navigate("/profile");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete Kundali profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!birthDate || !birthTime || !birthPlace || latitude === null || longitude === null || timezone === null) {
      toast.error("Please fill in all birth details and select a location from search.");
      return;
    }

    const payload: KundaliProfileRequest = {
      birthDate,
      birthTime,
      birthPlace,
      birthLatitude: latitude,
      birthLongitude: longitude,
      birthTimezone: timezone,
    };

    if (existingProfile) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gradient-blush dark:bg-slate-950 flex flex-col">
        <NavbarAuthenticated />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading Kundali data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-blush dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <NavbarAuthenticated />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <Card className="border border-border/80 bg-card/90 backdrop-blur-md shadow-card rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 text-center pb-6 border-b border-border/60">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Compass className="h-7 w-7 animate-float" />
              </div>
              <CardTitle className="font-serif text-3xl font-bold tracking-tight text-foreground">
                {existingProfile ? "Edit Kundali Profile" : "Create Kundali Profile"}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Provide your precise birth details to establish your astrological blueprint.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-8">
                {/* Birth Date */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4 text-primary" />
                    Birth Date
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 rounded-xl focus-visible:ring-primary border-border bg-background/50 hover:bg-background/80 transition-colors"
                  />
                </div>

                {/* Birth Time */}
                <div className="space-y-2">
                  <Label htmlFor="birthTime" className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-primary" />
                    Birth Time (Local Time)
                  </Label>
                  <Input
                    id="birthTime"
                    type="time"
                    required
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="h-12 rounded-xl focus-visible:ring-primary border-border bg-background/50 hover:bg-background/80 transition-colors"
                  />
                </div>

                {/* Birth Place Autocomplete */}
                <div className="space-y-2 relative">
                  <Label htmlFor="birthPlace" className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-primary" />
                    Birth Place
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="birthPlace"
                      type="text"
                      placeholder="Search city, town, or region..."
                      required
                      value={searchQuery}
                      onChange={(e) => {
                        setIsSearching(false);
                        setSearchQuery(e.target.value);
                      }}
                      className="pl-11 h-12 rounded-xl focus-visible:ring-primary border-border bg-background/50 hover:bg-background/80 transition-colors"
                    />
                    {loadingPlaces && (
                      <Loader2 className="absolute right-4 top-3.5 h-5 w-5 animate-spin text-primary" />
                    )}
                  </div>

                  {/* Autocomplete suggestions list */}
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-lg max-h-60 overflow-y-auto overflow-hidden divide-y divide-border/40 backdrop-blur-lg">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPlace(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-primary/5 dark:hover:bg-primary/10 text-sm transition-colors flex items-start gap-2.5"
                        >
                          <MapPin className="h-4 w-4 mt-0.5 text-primary/70 flex-shrink-0" />
                          <span className="text-foreground font-medium">{suggestion.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Read-only Coordinates Details (Hidden or elegantly styled) */}
                {latitude !== null && longitude !== null && timezone !== null && (
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-secondary/30 dark:bg-slate-900 border border-border/50 text-xs">
                    <div className="flex flex-col gap-1 items-center text-center">
                      <Compass className="h-4 w-4 text-primary/80" />
                      <span className="text-muted-foreground font-medium">Latitude</span>
                      <span className="font-semibold text-foreground">{latitude.toFixed(4)}°</span>
                    </div>
                    <div className="flex flex-col gap-1 items-center text-center">
                      <Compass className="h-4 w-4 text-primary/80" />
                      <span className="text-muted-foreground font-medium">Longitude</span>
                      <span className="font-semibold text-foreground">{longitude.toFixed(4)}°</span>
                    </div>
                    <div className="flex flex-col gap-1 items-center text-center">
                      <Globe className="h-4 w-4 text-primary/80" />
                      <span className="text-muted-foreground font-medium">Timezone</span>
                      <span className="font-semibold text-foreground">UTC {timezone >= 0 ? `+${timezone}` : timezone}</span>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/60">
                <Button
                  type="submit"
                  disabled={isMutating || isSearching}
                  className="w-full sm:flex-1 h-12 rounded-xl text-base font-semibold shadow-soft hover:shadow-glow transition-all"
                >
                  {isMutating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {existingProfile ? "Update Blueprint" : "Generate Blueprint"}
                </Button>

                {existingProfile && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isMutating}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete your Kundali profile details?")) {
                        deleteMutation.mutate();
                      }
                    }}
                    className="w-full sm:w-auto h-12 rounded-xl font-semibold transition-all px-6 gap-2"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="sm:hidden">Delete Profile</span>
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
