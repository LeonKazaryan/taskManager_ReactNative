import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Modal, Alert, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { Button, Text, Surface, IconButton, TextInput } from "react-native-paper";
import { LocationCoordinates } from "../lib/types";
import { getCurrentPositionAsync, reverseGeocodeAsync } from "../lib/location";

// Try to import maps, but handle if not available
let MapView: any = null;
let Marker: any = null;
try {
  const maps = require("expo-maps");
  MapView = maps.MapView;
  Marker = maps.Marker;
} catch (e) {
  console.log("Maps module not available, using fallback");
}

type LocationPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string, coordinates: LocationCoordinates) => void;
  initialCoordinates?: LocationCoordinates;
};

export default function LocationPicker({
  visible,
  onClose,
  onSelect,
  initialCoordinates,
}: LocationPickerProps) {
  const [selectedCoordinates, setSelectedCoordinates] = useState<LocationCoordinates | null>(
    initialCoordinates || null
  );
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [mapCenter, setMapCenter] = useState<LocationCoordinates | null>(null);
  const webViewRef = useRef<WebView>(null);
  const mapsAvailable = MapView !== null && Marker !== null;

  useEffect(() => {
    if (visible) {
      const initLocation = async () => {
        const position = await getCurrentPositionAsync();
        if (position) {
          setUserLocation(position);
          setMapCenter(position);
          if (!selectedCoordinates && !initialCoordinates) {
            setSelectedCoordinates(position);
          }
        } else if (initialCoordinates) {
          setMapCenter(initialCoordinates);
        }
      };
      initLocation();
    }
  }, [visible, initialCoordinates]);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedCoordinates({ latitude, longitude });
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "locationSelected" && data.lat && data.lng) {
        setSelectedCoordinates({
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lng),
        });
      }
    } catch (e) {
      console.log("Error parsing webview message:", e);
    }
  };

  const generateMapHTML = (center: LocationCoordinates | null) => {
    const lat = center?.latitude || 37.7749;
    const lng = center?.longitude || -122.4194;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const lat = ${lat};
    const lng = ${lng};
    
    const map = L.map('map').setView([lat, lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    
    marker.on('dragend', function(e) {
      const position = marker.getLatLng();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'locationSelected',
        lat: position.lat.toString(),
        lng: position.lng.toString()
      }));
    });
    
    map.on('click', function(e) {
      const position = e.latlng;
      marker.setLatLng([position.lat, position.lng]);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'locationSelected',
        lat: position.lat.toString(),
        lng: position.lng.toString()
      }));
    });
  </script>
</body>
</html>
    `;
  };

  const handleConfirm = async () => {
    let coords = selectedCoordinates;
    
    // If no coordinates selected and maps not available, try manual input
    if (!coords && !mapsAvailable) {
      if (manualLat && manualLng) {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          coords = { latitude: lat, longitude: lng };
        } else {
          Alert.alert("Error", "Please enter valid coordinates");
          return;
        }
      } else {
        Alert.alert("Error", "Please use current location or enter coordinates");
        return;
      }
    }

    if (!coords) {
      Alert.alert("Error", "Please select a location");
      return;
    }

    setIsLoading(true);
    try {
      const address = await reverseGeocodeAsync(coords);
      const locationText = address || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      onSelect(locationText, coords);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to get address for selected location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    const position = await getCurrentPositionAsync();
    if (position) {
      setSelectedCoordinates(position);
      setUserLocation(position);
      setMapCenter(position);
    } else {
      Alert.alert("Error", "Could not get your current location");
    }
  };

  const initialRegion = selectedCoordinates || userLocation || {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        <Surface style={styles.header} elevation={2}>
          <View style={styles.headerContent}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Select Location
            </Text>
            <IconButton icon="close" onPress={onClose} />
          </View>
        </Surface>

        {mapsAvailable ? (
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation={!!userLocation}
            showsMyLocationButton={true}
          >
            {selectedCoordinates && (
              <Marker
                coordinate={selectedCoordinates}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setSelectedCoordinates({ latitude, longitude });
                }}
              >
                <View style={styles.markerContainer}>
                  <View style={styles.markerPin}>
                    <Text style={styles.markerText}>📍</Text>
                  </View>
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={styles.mapContainer}>
            <WebView
              key={`map-${mapCenter?.latitude}-${mapCenter?.longitude}`}
              ref={webViewRef}
              source={{ html: generateMapHTML(mapCenter || selectedCoordinates || userLocation) }}
              style={styles.webView}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
            {selectedCoordinates && (
              <View style={styles.coordinatesOverlay}>
                <Surface style={styles.coordinatesCard} elevation={2}>
                  <Text variant="bodySmall" style={styles.coordinatesLabel}>
                    Selected Location:
                  </Text>
                  <Text variant="bodySmall" style={styles.coordinatesValue}>
                    {selectedCoordinates.latitude.toFixed(6)}, {selectedCoordinates.longitude.toFixed(6)}
                  </Text>
                </Surface>
              </View>
            )}
          </View>
        )}

        <Surface style={styles.footer} elevation={4}>
          <View style={styles.footerContent}>
            <Button
              mode="outlined"
              onPress={handleUseCurrentLocation}
              icon="crosshairs-gps"
              style={styles.currentLocationButton}
              textColor="#6366f1"
            >
              Use Current Location
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              loading={isLoading}
              disabled={!selectedCoordinates || isLoading}
              style={styles.confirmButton}
              buttonColor="#6366f1"
            >
              Confirm Location
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 24,
  },
  footer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerContent: {
    padding: 16,
    gap: 12,
  },
  currentLocationButton: {
    borderColor: "#6366f1",
  },
  confirmButton: {
    borderRadius: 12,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  coordinatesOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  coordinatesCard: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  coordinatesLabel: {
    color: "#9ca3af",
    marginBottom: 4,
    fontWeight: "500",
    fontSize: 11,
  },
  coordinatesValue: {
    color: "#111827",
    fontWeight: "600",
    fontFamily: "monospace",
    fontSize: 12,
  },
});

