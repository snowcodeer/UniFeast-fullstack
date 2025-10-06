import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Pressable, Modal } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { Image as ExpoImage } from "expo-image";
import * as Location from 'expo-location';
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import outletBanners from "./assets/outletBanners";

const Map = () => {
  const mapRef = useRef<MapView>(null);
  const markerRefs = useRef<{ [key: string]: any }>({});
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [selectedGroupRestaurants, setSelectedGroupRestaurants] = useState<Array<{id: string, name: string}>>([]);
  const [showClosedLocations, setShowClosedLocations] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();


  // Request location permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to see your position on the map.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  // Handle navigation from Home tab with restaurant selection
  useFocusEffect(
    React.useCallback(() => {
      const params = route.params as { restaurantId?: string; selectedLocation?: string } | undefined;
      
      if (params?.restaurantId && campusLocations.length > 0) {
        console.log('Looking for restaurant on map:', params.restaurantId);
        
        // Find the location that matches the restaurant ID
        const matchingLocation = campusLocations.find(location => {
          // Check if the location's restaurantId matches
          if (location.restaurantId === params.restaurantId) {
            return true;
          }
          
          // Check for grouped locations that contain the restaurant
          if (location.id === 'jcr_group' && 
              ['kimiko', 'la_cantina', 'feast', 'hǎo_chí', 'the_bakery_(starbucks)', 'jcr_deli'].includes(params.restaurantId || '')) {
            return true;
          }
          
          if (location.id === 'scr_group' && 
              ['scr_restaurant', 'the_roastery'].includes(params.restaurantId || '')) {
            return true;
          }
          
          return false;
        });

        if (matchingLocation) {
          console.log('Found matching location:', matchingLocation.title);
          
          // Set the selected marker to auto-open callout
          setSelectedMarkerId(matchingLocation.id);
          
          // Center the map on the location
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...matchingLocation.coordinate,
              latitudeDelta: 0.003,
              longitudeDelta: 0.003,
            }, 1000);
          }
          
          // Show the callout programmatically
          setTimeout(() => {
            if (markerRefs.current[matchingLocation.id]) {
              markerRefs.current[matchingLocation.id].showCallout();
            }
          }, 1200);
          
          // Clear the parameter after handling
          setTimeout(() => {
            (navigation as any).setParams({ restaurantId: undefined, selectedLocation: undefined });
          }, 2000);
        } else {
          console.log('No matching location found for restaurant:', params.restaurantId);
        }
      }
    }, [route.params, navigation])
  );

  // Imperial College London coordinates - more zoomed in
  const IMPERIAL_COLLEGE = {
    latitude: 51.4994,
    longitude: -0.1769,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  // Campus locations - all restaurants and cafes
  const campusLocations = [
    // Original main locations
    {
      id: 'rsm_cafe',
      title: 'RSM Cafe',
      description: 'Royal School of Mines cafe - Coffee & food',
      coordinate: { latitude: 51.49985, longitude: -0.176 },
      pinColor: '#FF6B6B',
      restaurantId: 'royal_school_of_mines_café',
    },
    {
      id: 'library_cafe',
      title: 'Library Café',
      description: 'Coffee and light meals available',
      coordinate: { latitude: 51.49812, longitude: -0.17802 },
      pinColor: '#8B4513',
      restaurantId: 'library_café',
    },
    {
      id: 'kokoro',
      title: 'Kokoro',
      description: 'Student bar and social space',
      coordinate: { latitude: 51.49865, longitude: -0.1783 },
      pinColor: '#4ECDC4',
      restaurantId: 'kokoro_at_h-bar',
    },
    
    // JCR Group (multiple restaurants in one location)
    {
      id: 'jcr_group',
      title: 'JCR Dining',
      description: 'Kimiko, La Cantina, Feast, Hǎo Chí, The Bakery, JCR Deli',
      coordinate: { latitude: 51.49859, longitude: -0.17735 },
      pinColor: '#9C27B0', // Purple for grouped location
      restaurantId: 'kimiko', // Default to first restaurant
    },
    
    // SCR Group
    {
      id: 'scr_group',
      title: 'SCR Dining',
      description: 'SCR Restaurant, The Roastery',
      coordinate: { latitude: 51.49858, longitude: -0.17745 },
      pinColor: '#9C27B0', // Purple for grouped location
      restaurantId: 'scr_restaurant',
    },
    
    // Individual locations scattered around campus
    {
      id: 'blackett_cafe',
      title: 'Blackett Café',
      description: 'Cafe in Blackett building',
      coordinate: { latitude: 51.49975, longitude: -0.1785 },
      pinColor: '#8B4513',
      restaurantId: 'blackett_cafe',
    },
    {
      id: 'business_school_cafe',
      title: 'Business School Café',
      description: 'Cafe in Business School',
      coordinate: { latitude: 51.4994, longitude: -0.17475 },
      pinColor: '#8B4513',
      restaurantId: 'business_school_café',
    },
    {
      id: 'chemistry_cafe',
      title: 'Chemistry Café',
      description: 'Cafe in Chemistry building',
      coordinate: { latitude: 51.49775, longitude: -0.17735 },
      pinColor: '#8B4513',
      restaurantId: 'chemistry_café',
    },
    {
      id: 'college_cafe',
      title: 'College Café',
      description: 'Main college cafe',
      coordinate: { latitude: 51.49913, longitude: -0.17495 },
      pinColor: '#8B4513',
      restaurantId: 'college_café',
    },
    {
      id: 'eastside',
      title: 'Eastside',
      description: 'Restaurant and bar',
      coordinate: { latitude: 51.4990, longitude: -0.1719 },
      pinColor: '#FFA726',
      restaurantId: 'eastside_restaurant_and_bar',
    },
    {
      id: 'essentials',
      title: 'Essentials',
      description: 'Convenience store',
      coordinate: { latitude: 51.4997, longitude: -0.17215 },
      pinColor: '#607D8B',
      restaurantId: 'essentials_convenience_store',
    },
    {
      id: 'huxley_cafe',
      title: 'Huxley Café',
      description: 'Cafe in Huxley building',
      coordinate: { latitude: 51.49975, longitude: -0.1783 },
      pinColor: '#8B4513',
      restaurantId: 'huxley_café',
    },
    {
      id: 'lumen_cafe',
      title: 'Lumen Café',
      description: 'Modern cafe space',
      coordinate: { latitude: 51.49912, longitude: -0.17637 },
      pinColor: '#8B4513',
      restaurantId: 'lumen_café',
    },
    {
      id: 'pizza_pi',
      title: 'Pizza Pi',
      description: 'Neo Pizza & Pasta',
      coordinate: { latitude: 51.4986, longitude: -0.17726 },
      pinColor: '#FFA726',
      restaurantId: 'pizza_pi_(neo_pizza_&_pasta)',
    },
    {
      id: 'queens_tower',
      title: "Queen's Tower Rooms",
      description: 'Event and dining space',
      coordinate: { latitude: 51.4990, longitude: -0.1750 },
      pinColor: '#795548',
      restaurantId: "queen's_tower_rooms",
    },
    {
      id: 'rcm_restaurant',
      title: 'RCM Restaurant',
      description: 'Royal College of Music restaurant',
      coordinate: { latitude: 51.49975, longitude: -0.17715 },
      pinColor: '#FFA726',
      restaurantId: 'rcm_restaurant',
    },
    {
      id: 'spar',
      title: 'SPAR',
      description: 'Convenience store',
      coordinate: { latitude: 51.4999, longitude: -0.17215 },
      pinColor: '#607D8B',
      restaurantId: 'spar_convenience_store',
    },
    {
      id: 'loud_bird',
      title: 'The Loud Bird',
      description: 'Student bar and social space',
      coordinate: { latitude: 51.49917, longitude: -0.17723 },
      pinColor: '#4ECDC4',
      restaurantId: 'the_loud_bird',
    },
    {
      id: 'pantry',
      title: 'The Pantry',
      description: 'Grab and go food',
      coordinate: { latitude: 51.49861, longitude: -0.17717 },
      pinColor: '#8B4513',
      restaurantId: 'the_pantry',
    },
    // Closed locations (sample)
    {
      id: 'closed_cafe_1',
      title: 'Temporarily Closed Café',
      description: 'Closed for renovation',
      coordinate: { latitude: 51.4992, longitude: -0.1765 },
      pinColor: '#9E9E9E', // Gray for closed
      restaurantId: 'closed_cafe_1',
      isClosed: true,
    },
    {
      id: 'closed_restaurant_1',
      title: 'Summer Break Restaurant',
      description: 'Closed during summer',
      coordinate: { latitude: 51.4995, longitude: -0.1760 },
      pinColor: '#9E9E9E', // Gray for closed
      restaurantId: 'closed_restaurant_1',
      isClosed: true,
    },
  ];

  // Function to get pin color based on venue type
  const getPinColor = (location: any) => {
    // If location is closed, return gray
    if (location.isClosed) {
      return '#9E9E9E'; // Gray for closed locations
    }
    
    const title = location.title.toLowerCase();
    const description = location.description.toLowerCase();
    
    // Check for specific venue types
    if (title.includes('café') || title.includes('cafe') || description.includes('cafe')) {
      return '#8B4513'; // Brown for cafes
    }
    if (title.includes('bar') || description.includes('bar') || title.includes('loud bird')) {
      return '#E91E63'; // Pink for bars
    }
    if (title.includes('restaurant') || description.includes('restaurant') || 
        title.includes('kimiko') || title.includes('feast') || title.includes('la cantina')) {
      return '#FF6B6B'; // Red for restaurants
    }
    if (title.includes('store') || title.includes('spar') || title.includes('essentials') || 
        title.includes('convenience') || description.includes('store')) {
      return '#607D8B'; // Blue-gray for stores
    }
    if (title.includes('dining') || description.includes('kimiko') || description.includes('feast') || 
        description.includes('la cantina') || description.includes('hǎo chí')) {
      return '#9C27B0'; // Purple for mixed dining areas
    }
    
    // Default color
    return '#FFA726'; // Orange for other venues
  };

  // Filter locations based on closed toggle
  const filteredLocations = campusLocations.filter(location => {
    if (location.isClosed) {
      return showClosedLocations;
    }
    return true; // Always show open locations
  });

  const handleNavigateToRestaurant = (restaurantId: string) => {
    console.log('Navigating to restaurant:', restaurantId);
    
    try {
      // Try different navigation approaches
      (navigation as any).navigate('Home', { restaurantId, fromMap: true });
      console.log('Navigation successful for:', restaurantId);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try with different syntax
      try {
        (navigation as any).navigate({
          name: 'Home',
          params: { restaurantId, fromMap: true }
        });
        console.log('Fallback navigation successful for:', restaurantId);
      } catch (fallbackError) {
        console.error('Fallback navigation error:', fallbackError);
      }
    }
  };

  const handleMarkerPress = (locationId: string) => {
    console.log('Marker pressed:', locationId);
    setSelectedMarkerId(selectedMarkerId === locationId ? null : locationId);
  };


  const flyToCampus = () => {
    if (!mapRef.current) return;
    
    mapRef.current.animateToRegion({
      latitude: 51.4994,
      longitude: -0.1769,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Imperial College London</Text>
      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={IMPERIAL_COLLEGE}
        mapType="standard"
        showsUserLocation={locationPermission}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={true}
        showsCompass={true}
        showsScale={true}
        showsMyLocationButton={true}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        moveOnMarkerPress={false}
      >
        {/* Campus location markers */}
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[location.id] = ref;
              }
            }}
            coordinate={location.coordinate}
            pinColor={getPinColor(location)}
            onPress={() => handleMarkerPress(location.id)}
            tracksViewChanges={false}
          >
            <Callout 
              style={styles.callout}
              tooltip={false}
              onPress={() => {
                setSelectedMarkerId(null); // Clear selected marker
                
                // For grouped locations, show restaurant selection modal
                if (location.id === 'jcr_group') {
                  setSelectedGroupRestaurants([
                    { id: 'kimiko', name: 'Kimiko' },
                    { id: 'la_cantina', name: 'La Cantina' },
                    { id: 'feast', name: 'Feast' },
                    { id: 'hǎo_chí', name: 'Hǎo Chí' },
                    { id: 'the_bakery_(starbucks)', name: 'The Bakery (Starbucks)' },
                    { id: 'jcr_deli', name: 'JCR Deli' }
                  ]);
                  setShowRestaurantModal(true);
                } else if (location.id === 'scr_group') {
                  setSelectedGroupRestaurants([
                    { id: 'scr_restaurant', name: 'SCR Restaurant' },
                    { id: 'the_roastery', name: 'The Roastery' }
                  ]);
                  setShowRestaurantModal(true);
                } else {
                  // For individual locations, navigate directly
                  handleNavigateToRestaurant(location.restaurantId);
                }
              }}
            >
              <View style={styles.calloutContainer}>
                {/* Restaurant Preview Image - only for individual locations */}
                {!location.id.includes('_group') && (
                  <View style={styles.calloutImageContainer}>
                    {outletBanners[location.restaurantId] ? (
                      <ExpoImage
                        source={outletBanners[location.restaurantId]}
                        style={styles.calloutImage}
                        contentFit="cover"
                        contentPosition="center"
                        transition={100}
                      />
                    ) : (
                      <View style={styles.calloutImagePlaceholder}>
                        <Text style={styles.calloutImagePlaceholderText}>{location.title}</Text>
                      </View>
                    )}
                  </View>
                )}
                <Text style={styles.calloutTitle}>{location.title}</Text>
                <Text style={styles.calloutDescription}>{location.description}</Text>
                
                {/* Show instruction for grouped restaurants */}
                {location.id.includes('_group') && (
                  <View style={styles.groupedRestaurants}>
                    <Text style={styles.groupedTitle}>Tap to select restaurant</Text>
                  </View>
                )}
                
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={flyToCampus}
        >
          <Text style={styles.buttonText}>Fly to Campus</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, showClosedLocations && styles.buttonActive]} 
          onPress={() => setShowClosedLocations(!showClosedLocations)}
        >
          <Text style={styles.buttonText}>
            {showClosedLocations ? 'Hide Closed' : 'Show Closed'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Restaurant Selection Modal */}
      <Modal
        visible={showRestaurantModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRestaurantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Restaurant</Text>
            {selectedGroupRestaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.modalRestaurantButton}
                onPress={() => {
                  setShowRestaurantModal(false);
                  handleNavigateToRestaurant(restaurant.id);
                }}
              >
                <Text style={styles.modalRestaurantText}>{restaurant.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowRestaurantModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    padding: 16,
    backgroundColor: "white",
    color: "#333",
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonActive: {
    backgroundColor: '#4CAF50',
  },
  callout: {
    width: 240,
  },
  calloutContainer: {
    padding: 8,
    alignItems: 'center',
  },
  calloutImageContainer: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  calloutImage: {
    width: '100%',
    height: '100%',
  },
  calloutImagePlaceholder: {
    flex: 1,
    backgroundColor: '#cfe3ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  calloutImagePlaceholderText: {
    color: '#0a3ea1',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  calloutDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  navigateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  groupedRestaurants: {
    marginTop: 8,
    width: '100%',
  },
  groupedTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  groupedRestaurant: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupedRestaurantText: {
    fontSize: 13,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 300,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalRestaurantButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalRestaurantText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Map; 