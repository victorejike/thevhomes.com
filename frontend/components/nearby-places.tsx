"use client";

import { useEffect, useState } from "react";
import { Building, GraduationCap, Plane, ShoppingCart } from "lucide-react";

interface NearbyPlace {
  name: string;
  category: "school" | "hospital" | "supermarket" | "airport";
  distanceMeters: number;
}

const CATEGORY_META: Record<NearbyPlace["category"], { label: string; icon: typeof GraduationCap; type: string }> = {
  school: { label: "Nearest School", icon: GraduationCap, type: "school" },
  hospital: { label: "Nearest Hospital", icon: Building, type: "hospital" },
  supermarket: { label: "Nearest Supermarket", icon: ShoppingCart, type: "supermarket" },
  airport: { label: "Nearest Airport", icon: Plane, type: "airport" },
};

/**
 * Distance-to-landmark panel (schools, hospitals, supermarkets, airports)
 * powered by the Google Places API "nearby search" endpoint, loaded
 * client-side via @react-google-maps/api's places library. Requires
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with the Places API enabled; degrades to
 * an informative empty state otherwise.
 */
export function NearbyPlaces({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || typeof window === "undefined") {
      setError(true);
      return;
    }

    let cancelled = false;

    async function loadPlacesLibrary(): Promise<typeof google.maps.places | null> {
      if (window.google?.maps?.places) return window.google.maps.places;

      return new Promise((resolve) => {
        const scriptId = "google-maps-places-script";
        if (document.getElementById(scriptId)) {
          const check = setInterval(() => {
            if (window.google?.maps?.places) {
              clearInterval(check);
              resolve(window.google.maps.places);
            }
          }, 200);
          return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => resolve(window.google?.maps?.places ?? null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
      });
    }

    loadPlacesLibrary().then((placesLib) => {
      if (cancelled || !placesLib) {
        if (!cancelled) setError(true);
        return;
      }

      const service = new placesLib.PlacesService(document.createElement("div"));
      const categories: { category: NearbyPlace["category"]; type: string }[] = [
        { category: "school", type: "school" },
        { category: "hospital", type: "hospital" },
        { category: "supermarket", type: "supermarket" },
        { category: "airport", type: "airport" },
      ];

      Promise.all(
        categories.map(
          ({ category, type }) =>
            new Promise<NearbyPlace | null>((resolve) => {
              service.nearbySearch(
                {
                  location: { lat: latitude, lng: longitude },
                  rankBy: placesLib.RankBy.DISTANCE,
                  type,
                },
                (results) => {
                  const nearest = results?.[0];
                  if (!nearest?.geometry?.location) {
                    resolve(null);
                    return;
                  }
                  const distance = haversineMeters(
                    latitude,
                    longitude,
                    nearest.geometry.location.lat(),
                    nearest.geometry.location.lng()
                  );
                  resolve({ name: nearest.name ?? type, category, distanceMeters: distance });
                }
              );
            })
        )
      ).then((results) => {
        if (!cancelled) setPlaces(results.filter((r): r is NearbyPlace => r !== null));
      });
    });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (error) {
    return (
      <p className="mt-3 text-xs text-white/40">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (with Places API enabled) to show distances to
        nearby schools, hospitals, supermarkets, and airports.
      </p>
    );
  }

  if (!places) {
    return <p className="mt-3 text-xs text-white/40">Finding nearby landmarks…</p>;
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {places.map((place) => {
        const meta = CATEGORY_META[place.category];
        return (
          <div key={place.category} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <meta.icon size={16} className="text-teal-400" />
            <p className="mt-2 text-xs text-white/50">{meta.label}</p>
            <p className="truncate text-sm font-medium text-white">{place.name}</p>
            <p className="text-xs text-teal-300">{(place.distanceMeters / 1000).toFixed(1)} km away</p>
          </div>
        );
      })}
    </div>
  );
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

declare global {
  interface Window {
    google?: typeof google;
  }
}
