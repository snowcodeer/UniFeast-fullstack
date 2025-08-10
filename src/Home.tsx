import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { userService, UserProfile } from "./services/ProfileService";
import { localOutletService } from "./services/LocalOutletService";
import type { Outlet } from "./data/outletsSouthKensington";

// Use local outlets dataset
const outlets = localOutletService.getSouthKensingtonOutlets();

const formatCategoryLabel = (category: Outlet["category"]): string => (category === "Cafe" ? "Café" : category);

const OutletCard = ({ outlet, isOpen, onPress }: { outlet: Outlet; isOpen: boolean; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <Text style={styles.restaurantName}>{outlet.name}</Text>
        <Text style={styles.description}>{outlet.description}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.locationRow}>
            <Icon name="location-on" size={16} color="#d32f2f" style={styles.locationIcon} />
            <Text style={styles.location}>{outlet.buildingOrArea || outlet.campus}</Text>
          </View>
        </View>
        
        <View style={styles.tags}>
          <Text style={[styles.tag, isOpen ? styles.tagOpen : styles.tagClosed]}>{isOpen ? 'Open now' : 'Closed'}</Text>
          <Text style={styles.tag}>{formatCategoryLabel(outlet.category)}</Text>
          {outlet.tags?.slice(0, 2).map((t) => (
            <Text key={t} style={styles.tag}>{t}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Home = () => {
  const { user } = useAuthenticator();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<Outlet["category"]>>(new Set());
  const [nowOpenOnly, setNowOpenOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const profile = await userService.getUser(user.userId);
        setUserProfile(profile);
      } catch (error) {
        console.log("Could not fetch profile for personalized recommendations");
      }
    };
    fetchProfile();
  }, [user]);

  const handleOutletPress = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    console.log("Open outlet:", outlet.name);
  };

  const toggleCategory = (category: Outlet["category"]) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedCategories(new Set());
    setNowOpenOnly(false);
    setSearchQuery("");
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
    if (selectedCategories.size > 0 && !selectedCategories.has(o.category)) return false;
    if (nowOpenOnly && !isNowOpen(o)) return false;
    if (!matchesQuery(o)) return false;
    return true;
  });

  // If an outlet is selected, show its details
  if (selectedOutlet) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedOutlet(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedOutlet.name}</Text>
        </View>
        
        <ScrollView style={styles.menuContainer}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantHeaderName}>{selectedOutlet.name}</Text>
            <Text style={styles.restaurantHeaderDescription}>{selectedOutlet.description}</Text>
            <View style={styles.restaurantHeaderDetails}>
              <Text style={styles.location}>{selectedOutlet.buildingOrArea || selectedOutlet.campus}</Text>
              <Text style={styles.tag}>{selectedOutlet.category}</Text>
            </View>
          </View>

          {selectedOutlet.openingHours && selectedOutlet.openingHours.length > 0 && (
            <View style={styles.menuItem}>
              <Text style={styles.menuSectionTitle}>Opening Hours</Text>
              {selectedOutlet.openingHours.map((oh, idx) => (
                <View key={`${oh.days}-${idx}`} style={{ marginBottom: 6 }}>
                  <Text style={{ fontWeight: "600", color: "#333" }}>{oh.days}</Text>
                  <Text style={{ color: "#555" }}>{oh.time}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.menuItem}>
            <Text style={styles.menuSectionTitle}>More info</Text>
            {selectedOutlet.details ? (
              <Text style={styles.menuItemDescription}>{selectedOutlet.details}</Text>
            ) : null}
            <Text style={[styles.menuItemDescription, { color: "#007AFF" }]}>Source</Text>
            <Text style={{ color: "#007AFF" }}>{selectedOutlet.url}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>South Kensington Outlets</Text>
      {userProfile && (
        <Text style={styles.welcomeText}>
          Welcome back, {userProfile.user_name || "Student"}! 👋
        </Text>
      )}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, description, tags"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <View style={styles.filterChipsRow}>
          {(["Cafe", "Restaurant", "Bar"] as Outlet["category"][]).map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => toggleCategory(cat)}
              style={[styles.chip, selectedCategories.has(cat) && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selectedCategories.has(cat) && styles.chipTextSelected]}>{formatCategoryLabel(cat)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setNowOpenOnly(v => !v)}
            style={[styles.chip, nowOpenOnly && styles.chipSelected]}
          >
            <Text style={[styles.chipText, nowOpenOnly && styles.chipTextSelected]}>Now open</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetFilters} style={[styles.chip, styles.resetChip]}>
            <Text style={[styles.chipText, styles.resetChipText]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {filteredOutlets.map((outlet) => (
        <OutletCard 
          key={outlet.id} 
          outlet={outlet}
          isOpen={isNowOpen(outlet)}
          onPress={() => handleOutletPress(outlet)}
        />
      ))}
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
  welcomeText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  filtersContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    color: "#333",
  },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
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
});

export default Home;