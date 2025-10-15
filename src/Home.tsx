import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, TextInput, Animated, Easing, Alert } from "react-native";
import { Image as ExpoImage } from "expo-image";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { userService, UserProfile, FavouriteItem } from "./services/ProfileService";
import { restaurantService } from "./services/RestaurantService";
import type { Restaurant } from "./services/FoodDatabaseService";
import outletBanners from "./assets/outletBanners";
import OutletView from "./components/OutletView";

// Use Restaurant type as Outlet replacement
type Outlet = Restaurant;

const formatCategoryLabel = (category: Outlet["category"]): string => (category === "Cafe" ? "Café" : category);
const formatTag = (tag: string): string =>
  tag
    .split(' ')
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const OutletCard = ({ 
  outlet, 
  isOpen, 
  bannerPosition, 
  onPress, 
  isFavourite, 
  onToggleFavourite,
  navigation
}: { 
  outlet: Outlet; 
  isOpen: boolean; 
  bannerPosition?: string;
  onPress: () => void;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  navigation: any;
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardBannerContainer}>
        {outletBanners[outlet.id] ? (
          <ExpoImage
            source={outletBanners[outlet.id]}
            style={styles.cardBannerImage}
            contentFit="cover"
            contentPosition={(bannerPosition as any) || 'left center'}
            transition={100}
          />
        ) : (
          <View style={styles.cardBannerPlaceholder}>
            <Text style={styles.cardBannerPlaceholderText}>{outlet.name}</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.favouriteButton} 
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavourite();
          }}
        >
          <Icon 
            name={isFavourite ? "star" : "star-border"} 
            size={24} 
            color={isFavourite ? "#FFD700" : "white"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.restaurantName} numberOfLines={2}>{outlet.name}</Text>
        
        <View style={styles.infoRow}>
          <TouchableOpacity 
            style={styles.locationRow}
            onPress={() => {
              console.log('Navigating to map for location:', outlet.buildingOrArea || outlet.campus);
              (navigation as any).navigate('Map', { 
                selectedLocation: outlet.buildingOrArea || outlet.campus,
                restaurantId: outlet.id 
              });
            }}
            activeOpacity={0.7}
          >
            <Icon name="location-on" size={16} color="#d32f2f" style={styles.locationIcon} />
            <Text style={styles.location}>{outlet.buildingOrArea || outlet.campus}</Text>
            <Icon name="navigate-next" size={16} color="#d32f2f" style={styles.locationArrow} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.tags}>
          <Text style={[styles.tag, isOpen ? styles.tagOpen : styles.tagClosed]}>{isOpen ? 'Open' : 'Closed'}</Text>
          <Text style={styles.tag}>{formatCategoryLabel(outlet.category)}</Text>
          {outlet.tags?.slice(0, 2).map((t) => (
            <Text key={t} style={styles.tag}>{formatTag(t)}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Home = () => {
  const { user } = useAuthenticator();
  const route = useRoute();
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Outlet["category"] | null>(null);
  const [fromMap, setFromMap] = useState<boolean>(false);
  const [nowOpenOnly, setNowOpenOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [bannerPositions, setBannerPositions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [favouriteOutlets, setFavouriteOutlets] = useState<Set<string>>(new Set());

  const openSearch = () => {
    setIsSearchOpen(true);
    searchAnim.setValue(0);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeSearch = () => {
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsSearchOpen(false);
    });
  };

  // Function to refresh user profile and favourites
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profile = await userService.getUser(user.userId);
      setUserProfile(profile);
      
      // Set favourite outlets
      if (profile?.favourites) {
        const favouriteRestaurantIds = profile.favourites
          .filter(fav => fav.type === 'restaurant')
          .map(fav => fav.id);
        setFavouriteOutlets(new Set(favouriteRestaurantIds));
      } else {
        setFavouriteOutlets(new Set());
      }
    } catch (error) {
      console.log("Could not fetch profile for personalized recommendations");
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [user]);

  // Refresh favourites when Home tab is focused (e.g., when returning from Profile tab)
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, [user])
  );

  // Handle navigation from map
  useEffect(() => {
    const params = route.params as { restaurantId?: string; fromMap?: boolean } | undefined;
    console.log('Navigation params:', params);
    console.log('Available outlets:', outlets.map(o => ({ id: o.id, name: o.name })));
    
    if (params?.restaurantId && outlets.length > 0) {
      console.log('Looking for restaurant ID:', params.restaurantId);
      setFromMap(params.fromMap || false); // Store the fromMap parameter
      
      const outlet = outlets.find(o => o.id === params.restaurantId);
      console.log('Found outlet:', outlet);
      
      if (outlet) {
        console.log('Setting selected outlet:', outlet.name);
        setSelectedOutlet(outlet);
        // Clear the params after navigation to prevent re-triggering
        navigation.setParams({ restaurantId: undefined, fromMap: undefined });
      } else {
        console.log('No outlet found with ID:', params.restaurantId);
        // Try to find by partial match
        const partialMatch = outlets.find(o => 
          o.id.toLowerCase().includes(params.restaurantId.toLowerCase()) ||
          o.name.toLowerCase().includes(params.restaurantId.toLowerCase())
        );
        if (partialMatch) {
          console.log('Found partial match:', partialMatch);
          setSelectedOutlet(partialMatch);
          navigation.setParams({ restaurantId: undefined, fromMap: undefined });
        }
      }
    }
  }, [route.params, outlets, navigation]);


  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        setIsLoading(true);
        const outletsData = await restaurantService.getSouthKensingtonOutlets();
        setOutlets(outletsData);

        // Fetch banner positions for all outlets
        const positions: Record<string, string> = {};
        await Promise.all(
          outletsData.map(async (outlet) => {
            const position = await restaurantService.getBannerPosition(outlet.id);
            positions[outlet.id] = position;
          })
        );
        setBannerPositions(positions);
      } catch (error) {
        console.error('Error fetching outlets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  const handleOutletPress = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    console.log("Open outlet:", outlet.name);
  };

  const handleToggleFavourite = async (outlet: Outlet) => {
    if (!user) {
      Alert.alert("Error", "Please sign in to save favourites");
      return;
    }

    try {
      const isCurrentlyFavourite = favouriteOutlets.has(outlet.id);
      
      if (isCurrentlyFavourite) {
        // Remove from favourites
        const updatedProfile = await userService.removeFromFavourites(user.userId, outlet.id, 'restaurant');
        if (updatedProfile) {
          setUserProfile(updatedProfile);
          setFavouriteOutlets(prev => {
            const newSet = new Set(prev);
            newSet.delete(outlet.id);
            return newSet;
          });
        }
      } else {
        // Add to favourites
        const favouriteItem: Omit<FavouriteItem, 'added_at'> = {
          id: outlet.id,
          type: 'restaurant',
          name: outlet.name,
          description: outlet.description,
        };
        
        const updatedProfile = await userService.addToFavourites(user.userId, favouriteItem);
        if (updatedProfile) {
          setUserProfile(updatedProfile);
          setFavouriteOutlets(prev => new Set([...prev, outlet.id]));
        }
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      Alert.alert("Error", "Failed to update favourites");
    }
  };

  const selectCategory = (category: Outlet["category"]) => {
    setSelectedCategory(category);
  };



  const isTimeRangeOpen = (timeRange: string): boolean => {
    // Accept formats like "08:00–16:00" or "08:00-16:00"
    if (!/\d/.test(timeRange)) return false;
    const normalized = timeRange.replace(/\s/g, "");
    const parts = normalized.split(/–|-/);
    if (parts.length !== 2) return false;
    const [start, end] = parts;
    const toMinutes = (t: string): number => {
      const match = t.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return NaN;
      const hh = parseInt(match[1], 10);
      const mm = parseInt(match[2], 10);
      return hh * 60 + mm;
    };
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    if (Number.isNaN(startMin) || Number.isNaN(endMin)) return false;
    // Handle typical same-day ranges only
    return nowMinutes >= startMin && nowMinutes <= endMin;
  };

  const isTodayInDays = (days: string): boolean => {
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = dayMap[new Date().getDay()];
    const d = days.replace(/\s/g, "");
    if (/Mon–Sun|Mon-Sun/i.test(d)) return true;
    // Single day, e.g., "Sat" or "Sun"
    if (dayMap.some(k => d === k)) return d === today;
    // Ranges like "Mon–Fri", "Thu–Fri"
    const match = d.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[–-](Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    if (!match) return false;
    const startIdx = dayMap.indexOf(match[1]);
    const endIdx = dayMap.indexOf(match[2]);
    const todayIdx = dayMap.indexOf(today);
    if (startIdx <= endIdx) {
      return todayIdx >= startIdx && todayIdx <= endIdx;
    }
    // Wrap-around (unlikely in our data, but safe)
    return todayIdx >= startIdx || todayIdx <= endIdx;
  };

  const isNowOpen = (outlet: Outlet): boolean => {
    if (!outlet.openingHours || outlet.openingHours.length === 0) return false;
    return outlet.openingHours.some(entry => isTodayInDays(entry.days) && isTimeRangeOpen(entry.time));
  };

  const matchesQuery = (outlet: Outlet): boolean => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const fields = [
      outlet.name,
      outlet.description,
      outlet.buildingOrArea || "",
      ...(outlet.tags || []),
    ].join(" ").toLowerCase();
    return fields.includes(q);
  };

  const filteredOutlets = outlets.filter(o => {
    if (selectedCategory && o.category !== selectedCategory) return false;
    if (nowOpenOnly && !isNowOpen(o)) return false;
    if (!matchesQuery(o)) return false;
    return true;
  }).sort((a, b) => {
    // Move favorite outlets to the top
    const aIsFavourite = favouriteOutlets.has(a.id);
    const bIsFavourite = favouriteOutlets.has(b.id);
    
    if (aIsFavourite && !bIsFavourite) return -1;
    if (!aIsFavourite && bIsFavourite) return 1;
    return 0; // Keep original order for non-favourites
  });

  // If an outlet is selected, show its details
  if (selectedOutlet) {
    return <OutletView outlet={selectedOutlet} userProfile={userProfile} onBack={() => setSelectedOutlet(null)} fromMap={fromMap} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Imperial College London</Text>
      <Text style={styles.subHeader}>South Kensington Campus</Text>
      <View style={styles.filtersContainer}>
        {isSearchOpen ? (
          <Animated.View style={[
            styles.searchRow,
            { opacity: searchAnim, transform: [{ translateX: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] },
          ]}>
            <TouchableOpacity onPress={closeSearch} style={styles.iconButton}>
              <Icon name="arrow-back" size={20} color="#333" />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchInput, { flex: 1 }]}
              placeholder="Search by name, description, tags"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
              autoFocus
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.iconButton}>
                <Icon name="close" size={18} color="#666" />
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        ) : (
          <View style={styles.filtersRow}>
            <TouchableOpacity onPress={openSearch} style={styles.iconButton}>
              <Icon name="search" size={20} color="#333" />
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRowInline}>
              {["Cafe", "Restaurant", "Bar"].map((cat) => (
                <TouchableOpacity
                  key={cat as string}
                  onPress={() => selectCategory(cat as any)}
                  style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>{cat === "Cafe" ? "Café" : (cat as string)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setNowOpenOnly(v => !v)}
                style={[styles.chip, nowOpenOnly && styles.chipSelected]}
              >
                <Text style={[styles.chipText, nowOpenOnly && styles.chipTextSelected]}>Open</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      ) : (
        filteredOutlets.map((outlet) => (
          <OutletCard 
            key={outlet.id} 
            outlet={outlet}
            isOpen={isNowOpen(outlet)}
            bannerPosition={bannerPositions[outlet.id]}
            onPress={() => handleOutletPress(outlet)}
            isFavourite={favouriteOutlets.has(outlet.id)}
            onToggleFavourite={() => handleToggleFavourite(outlet)}
            navigation={navigation}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 16,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  subHeader: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  filtersContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    height: 52,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 0,
    height: 36,
    color: "#333",
  },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChipsRowInline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fafafa",
  },
  chipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "white",
  },
  resetChip: {
    backgroundColor: "#fff0f0",
    borderColor: "#ffd6d6",
  },
  resetChipText: {
    color: "#d32f2f",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  cardBannerContainer: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    backgroundColor: "#eaeaea",
  },
  cardBannerImage: {
    width: "100%",
    height: "100%",
  },
  cardBannerPlaceholder: {
    flex: 1,
    backgroundColor: "#cfe3ff", // pastel blue
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  cardBannerPlaceholderText: {
    color: "#0a3ea1",
    fontWeight: "800",
    fontSize: 20,
  },
  favouriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardContent: {
    padding: 16,
  },
  
  restaurantName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationIcon: {
    marginTop: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  deliveryTime: {
    fontSize: 12,
    color: "#666",
  },
  location: {
    fontSize: 12,
    color: "#666",
  },
  locationArrow: {
    marginLeft: 2,
  },
  tags: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagOpen: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
  tagClosed: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
  menuContainer: {
    flex: 1,
  },
  restaurantInfo: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerContainer: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#eaeaea",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  restaurantHeaderName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  restaurantHeaderDescription: {
    fontSize: 16,
    color: "#555",
    marginBottom: 12,
    lineHeight: 22,
  },
  detailBackFab: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseToggle: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  restaurantHeaderDetails: {
    flexDirection: "row",
    gap: 16,
  },
  menuSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    marginLeft: 4,
  },
  menuItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  menuItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  menuItemDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 8,
  },
  allergenInfo: {
    fontSize: 12,
    color: "#D32F2F",
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default Home;