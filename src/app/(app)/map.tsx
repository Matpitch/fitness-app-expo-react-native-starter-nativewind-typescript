import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  useColorScheme,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import MapView, { Marker, UrlTile, Region } from "react-native-maps";
import * as Location from 'expo-location';
import axios from 'axios';
import { Map as MapIcon, XCircle, AlertCircle, Code } from 'lucide-react-native';
import { useLocalSearchParams } from "expo-router";

// Define a type for the map region
interface MapRegion extends Region {}

// Define a type for a map style
interface MapStyle {
  name: string;
  urlTemplate: string;
  icon: string;
}

export default function Map() {
  const isDark = useColorScheme() === "dark";
  // Retrieve the distressActive parameter passed from the home screen
  const { distressActive } = useLocalSearchParams();

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<MapRegion>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
  const [realtimeLocation, setRealtimeLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
  const [markerLocation, setMarkerLocation] = useState<{
    latitude: number;
    longitude: number;
    title: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  
  // Initialize the distress state based on the passed parameter
  const [isDistressActive, setIsDistressActive] = useState(distressActive === 'true');
  
  // States for the custom modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"confirm" | "info">("info");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const mapStyles: MapStyle[] = [
    { name: "Standard", urlTemplate: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", icon: "🗺️" },
    { name: "Toner", urlTemplate: "https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png", icon: "🔳" },
  ];
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(mapStyles[1]);

  const mapRef = useRef<MapView>(null);

  // Function to show the custom alert modal
  const showCustomAlert = (title: string, message: string, type: "confirm" | "info" = "info", onConfirm?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setOnConfirmAction(onConfirm || null);
    setModalVisible(true);
  };

  // Effect to handle initial location permissions and fetching
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showCustomAlert(
          'Permission Denied',
          'Permission to access location was denied. Cannot show your location.'
        );
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(newRegion);
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        mapRef.current?.animateToRegion(newRegion, 1000);
      } catch (error) {
        console.error(error);
        showCustomAlert("Error", "Could not get your current location.");
      }
    })();
  }, []);

  // Effect to handle the real-time distress alert
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | undefined;

    if (isDistressActive) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showCustomAlert(
            'Permission Denied',
            'Permission to access location was denied. Cannot track your location for a distress alert.'
          );
          return;
        }

        try {
          // Set the initial realtime location to the current user location
          let initialLocation = await Location.getCurrentPositionAsync({});
          setRealtimeLocation({
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
          });

          locationSubscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 10 },
            (newLocation) => {
              setRealtimeLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              });
              mapRef.current?.animateToRegion({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta,
              }, 500);
            }
          );
        } catch (error) {
          console.error('Real-time location tracking error:', error);
          showCustomAlert('Error', 'Failed to start real-time location tracking.');
        }
      })();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isDistressActive, region]);

  // Function to stop the distress alert
  const handleStopDistressAlert = () => {
    showCustomAlert(
      "Clear Distress Alert",
      "Are you sure you want to clear the distress alert? Your real-time location is no longer being shared.",
      "confirm",
      () => {
        setRealtimeLocation(null);
        setIsDistressActive(false); // Set local state to false
        setModalVisible(false);
      }
    );
  };
  
  // Function to simulate opening the Canvas document
  const handleOpenCanvas = () => {
    console.log("Opening the Canvas document for map.tsx");
  };

  // Function to handle the search for a location
  const handleSearch = async () => {
    if (search.trim() === "") {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json`
      );

      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        const newRegion: MapRegion = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };

        setRegion(newRegion);
        setMarkerLocation({
          latitude: newRegion.latitude,
          longitude: newRegion.longitude,
          title: search,
        });

        mapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        showCustomAlert("Location Not Found", "Could not find any results for your search.");
        setMarkerLocation(null);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      showCustomAlert("Error", "Failed to perform location search.");
    } finally {
      setIsLoading(false);
    }
  };

  // Functions to handle zooming in and out
  const handleZoomIn = () => {
    setRegion(prevRegion => ({
      ...prevRegion,
      latitudeDelta: prevRegion.latitudeDelta / 2,
      longitudeDelta: prevRegion.longitudeDelta / 2,
    }));
  };

  const handleZoomOut = () => {
    setRegion(prevRegion => ({
      ...prevRegion,
      latitudeDelta: prevRegion.latitudeDelta * 2,
      longitudeDelta: prevRegion.longitudeDelta * 2,
    }));
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
      >
        <UrlTile
          urlTemplate={currentMapStyle.urlTemplate}
          maximumZ={19}
          tileSize={256}
        />

        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            title="Your Location"
            zIndex={100}
          >
            <View className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          </Marker>
        )}
        
        {isDistressActive && realtimeLocation && (
          // The distress marker with the pulsing, transparent ping effect
          <Marker
            coordinate={{ latitude: realtimeLocation.latitude, longitude: realtimeLocation.longitude }}
            title="Distress Alert"
            pinColor="red"
            zIndex={101}
          >
            <View className="relative w-12 h-12 flex items-center justify-center">
              <View className="absolute inset-0 bg-red-600 rounded-full opacity-75 animate-ping" />
              <View className="absolute w-6 h-6 bg-red-600 rounded-full" />
            </View>
          </Marker>
        )}

        {markerLocation && (
          <Marker
            coordinate={{ latitude: markerLocation.latitude, longitude: markerLocation.longitude }}
            title={markerLocation.title}
            pinColor="red"
          />
        )}
      </MapView>
      
      {/* Button to open the Canvas code */}
      <Pressable
        onPress={handleOpenCanvas}
        className="absolute top-12 left-4 w-12 h-12 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-lg transform active:scale-95 transition-transform duration-150"
      >
        <Code color={isDark ? '#e2e8f0' : '#2d3748'} size={28} />
      </Pressable>

      {/* Search bar and search button */}
      <View className="absolute top-12 left-20 right-4 z-10 px-4">
        <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-full shadow-lg p-1">
          <TextInput
            className="flex-1 h-10 text-base px-4 text-gray-800 dark:text-gray-200"
            placeholder="Find a location..."
            placeholderTextColor={isDark ? '#a0aec0' : '#4a5568'}
            onChangeText={setSearch}
            value={search}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            onPress={handleSearch}
            className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold">Go</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View className="absolute top-36 right-4 z-10 flex-col items-end">
        {/* The "Clear Distress Alert" button now only shows when the distress state is active */}
        {isDistressActive && (
          <TouchableOpacity
            onPress={handleStopDistressAlert}
            className="w-14 h-14 bg-red-600 rounded-full items-center justify-center shadow-lg transform active:scale-95 transition-transform duration-150 mb-4"
          >
            <XCircle color="white" size={28} />
          </TouchableOpacity>
        )}
        <View className="w-auto">
          <TouchableOpacity
            onPress={() => setIsSettingsVisible(!isSettingsVisible)}
            className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-lg transform active:scale-95 transition-transform duration-150"
          >
            <MapIcon color={isDark ? '#e2e8f0' : '#2d3748'} size={28} />
          </TouchableOpacity>

          {isSettingsVisible && (
            <View className="absolute top-full right-0 w-40 mt-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              {mapStyles.map((style) => (
                <TouchableOpacity
                  key={style.name}
                  onPress={() => {
                    setCurrentMapStyle(style);
                    setIsSettingsVisible(false);
                  }}
                  className={`flex-row items-center p-3 rounded-lg my-1 transition-all duration-300 ${currentMapStyle.name === style.name ? 'bg-blue-500' : 'bg-transparent'}`}
                >
                  <Text className={`text-xl mr-3 ${currentMapStyle.name === style.name ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                    {style.icon}
                  </Text>
                  <Text className={`font-bold ${currentMapStyle.name === style.name ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                    {style.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className={`mt-4 p-2 bg-black/30 dark:bg-white/30 rounded-full shadow-lg transition-all duration-300 ${isSettingsVisible ? 'mt-40' : 'mt-4'}`}>
          <TouchableOpacity
            onPress={handleZoomIn}
            className="w-10 h-10 items-center justify-center bg-white dark:bg-gray-800 rounded-full mb-2 shadow-sm"
          >
            <Text className="text-2xl font-light text-gray-800 dark:text-gray-200">+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleZoomOut}
            className="w-10 h-10 items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm"
          >
            <Text className="text-2xl font-light text-gray-800 dark:text-gray-200">-</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Custom Modal for alerts and confirmations */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-8">
          <View className={`rounded-lg p-6 w-full ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <Text className={`text-xl font-bold mb-4 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
              {modalTitle}
            </Text>
            <Text className={`text-base mb-6 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              {modalMessage}
            </Text>
            <View className="flex-row justify-end">
              {modalType === "confirm" && (
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="px-4 py-2 rounded-lg mr-3"
                >
                  <Text className={`text-blue-600 font-semibold`}>Cancel</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  if (onConfirmAction) {
                    onConfirmAction();
                  } else {
                    setModalVisible(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg ${modalType === "confirm" ? "bg-red-600" : "bg-blue-600"}`}
              >
                <Text className="text-white font-semibold">
                  {modalType === "confirm" ? "Confirm" : "OK"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
