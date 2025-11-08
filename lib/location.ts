import * as Location from "expo-location";
import { LocationCoordinates } from "./types";

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    // Check current permissions first
    let status;
    try {
      // Try getForegroundPermissionsAsync (new API)
      const result = await Location.getForegroundPermissionsAsync();
      status = result.status;
    } catch (e) {
      // If that doesn't work, just request permissions directly
      const result = await Location.requestForegroundPermissionsAsync();
      status = result.status;
    }

    // If not granted, request permissions
    if (status !== "granted") {
      const result = await Location.requestForegroundPermissionsAsync();
      status = result.status;
    }

    if (status !== "granted") {
      console.warn("Location permissions not granted");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error requesting location permissions:", error);
    return false;
  }
}

/**
 * Get current user location
 */
export async function getCurrentPositionAsync(): Promise<LocationCoordinates | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting current position:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocodeAsync(
  coordinates: LocationCoordinates
): Promise<string | null> {
  try {
    const addresses = await Location.reverseGeocodeAsync(coordinates);
    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      const parts = [
        address.street,
        address.streetNumber,
        address.city,
        address.region,
        address.country,
      ].filter(Boolean);
      return parts.join(", ") || "Unknown location";
    }
    return null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
}

