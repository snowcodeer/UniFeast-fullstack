import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Image as ExpoImage } from "expo-image";
import type { Restaurant } from "../services/FoodDatabaseService";
import type { UserProfile } from "../services/ProfileService";
import { foodDatabaseService } from "../services/FoodDatabaseService";
import outletBanners from "../assets/outletBanners";

// Use Restaurant type as Outlet replacement  
type Outlet = Restaurant;

const formatCategoryLabel = (category: Outlet["category"]): string => (category === "Cafe" ? "Café" : category);

type Props = {
  outlet: Outlet;
  onBack: () => void;
  userProfile?: UserProfile | null;
};

const OutletView: React.FC<Props> = ({ outlet, onBack, userProfile }) => {
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  // Use banner_position from outlet data if available, otherwise fallback to hardcoded
  const getBannerPosition = () => {
    if ('banner_position' in outlet && outlet.banner_position) {
      return outlet.banner_position;
    }
    // Fallback to hardcoded positions
    const rightAlignedIds = new Set(["kimiko", "huxley-cafe"]);
    return rightAlignedIds.has(outlet.id) ? "right center" : "left center";
  };

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        setLoading(true);
        const items = await foodDatabaseService.getFoodItemsByRestaurant(outlet.id);
        setFoodItems(items);
      } catch (error) {
        console.error('Error fetching food items:', error);
        setFoodItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, [outlet.id]);

  // Get unique categories from food items
  const categories = React.useMemo(() => {
    const cats = foodItems.map(item => item.category).filter(Boolean);
    return ["All", ...Array.from(new Set(cats))];
  }, [foodItems]);

  const selectFilter = (label: string) => {
    setActiveFilter(label);
  };

  const filteredFoodItems = React.useMemo(() => {
    if (activeFilter === "All") return foodItems;
    return foodItems.filter(item => item.category === activeFilter);
  }, [foodItems, activeFilter]);

  const getItemIcon = (category: string): string => {
    switch (category?.toLowerCase()) {
      case "drinks":
      case "beverages":
        return "local-cafe";
      case "pastries":
      case "bakery":
        return "bakery-dining";
      case "cold food":
      case "salads":
        return "lunch-dining";
      case "hot food":
      case "main dishes":
        return "ramen-dining";
      case "snacks":
        return "fastfood";
      case "desserts":
        return "icecream";
      default:
        return "restaurant";
    }
  };

  const userAllergenTerms: Set<string> = React.useMemo(() => {
    const terms: string[] = [];
    if (userProfile) {
      const pushIf = (cond?: boolean, label?: string) => {
        if (cond && label) terms.push(label);
      };
      pushIf(userProfile.milk_allergy, "milk");
      pushIf(userProfile.eggs_allergy, "egg");
      pushIf(userProfile.peanuts_allergy, "peanut");
      pushIf(userProfile.tree_nuts_allergy, "nut");
      pushIf(userProfile.shellfish_allergy, "shellfish");
      const other = Array.isArray(userProfile.other_allergies) ? userProfile.other_allergies : [];
      other.forEach(o => {
        if (typeof o === "string") terms.push(o.toLowerCase());
      });
    }
    return new Set(terms.map(t => t.toLowerCase()));
  }, [userProfile]);

  const getAllergens = (item: any): string[] => {
    const allergens: string[] = [];
    
    if (item.milk_allergy) allergens.push("Contains milk");
    if (item.eggs_allergy) allergens.push("Contains eggs");
    if (item.peanuts_allergy) allergens.push("Contains peanuts");
    if (item.tree_nuts_allergy) allergens.push("Contains tree nuts");
    if (item.shellfish_allergy) allergens.push("Contains shellfish");
    
    if (item.other_allergens && Array.isArray(item.other_allergens)) {
      allergens.push(...item.other_allergens);
    }
    
    return allergens;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.bannerContainer}>
          {outletBanners[outlet.id] ? (
            <ExpoImage
              source={outletBanners[outlet.id]}
              style={styles.bannerImage}
              contentFit="cover"
              contentPosition={getBannerPosition() as any}
              transition={120}
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Text style={styles.bannerPlaceholderText}>{outlet.name}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backFab} onPress={onBack}>
            <Icon name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{outlet.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.locationRow}>
              <Icon name="location-on" size={18} color="#d32f2f" style={{ marginTop: 1 }} />
              <Text style={styles.locationText}>{outlet.buildingOrArea || outlet.campus}</Text>
            </View>
            <Text style={styles.tag}>{formatCategoryLabel(outlet.category)}</Text>
          </View>
          <Text style={styles.description}>{outlet.description}</Text>
        </View>

        {outlet.openingHours && outlet.openingHours.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            {outlet.openingHours.map((oh, idx) => (
              <View key={`${oh.days}-${idx}`} style={{ marginBottom: 6 }}>
                <Text style={{ fontWeight: "600", color: "#333" }}>{oh.days}</Text>
                <Text style={{ color: "#555" }}>{oh.time}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.menuHeaderPad}>
          <View style={styles.menuHeaderRow}>
            <Text style={styles.menuTitle}>Menu</Text>
            {loading && <Text style={styles.loadingText}>Loading...</Text>}
          </View>
        </View>

        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.filterChipsRowInline, styles.filterChipsPad]}
          >
            {categories.map((label) => {
              const selected = activeFilter === label;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => selectFilter(label)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {filteredFoodItems.map((item) => {
          const allergens = getAllergens(item);
          const matchedAllergens = allergens.filter(a => {
            const al = a.toLowerCase();
            for (const term of Array.from(userAllergenTerms)) {
              if (al.includes(term)) return true;
            }
            return false;
          });

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.foodCard}>
                <View style={styles.foodIconContainer}>
                  <Icon name={getItemIcon(item.category)} size={28} color="#ffffff" />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.dish_name}</Text>
                  {item.description && (
                    <Text style={styles.foodDesc}>{item.description}</Text>
                  )}
                  {matchedAllergens.length > 0 && (
                    <View style={styles.allergenTagsRow}>
                      {matchedAllergens.map((a) => (
                        <View key={a} style={styles.allergenTag}>
                          <Text style={styles.allergenTagText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.priceRow}>
                    {item.student_price && (
                      <Text style={styles.foodPrice}>Student: £{item.student_price}</Text>
                    )}
                    {item.staff_price && (
                      <Text style={styles.foodPrice}>Staff: £{item.staff_price}</Text>
                    )}
                  </View>
                  {item.dietary_tags && item.dietary_tags.length > 0 && (
                    <View style={styles.dietaryTagsRow}>
                      {item.dietary_tags.map((tag: string) => (
                        <View key={tag} style={styles.dietaryTag}>
                          <Text style={styles.dietaryTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {!loading && filteredFoodItems.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.noItemsText}>No menu items available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { flex: 1 },
  bannerContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#cfe3ff",
    marginBottom: 12,
  },
  bannerImage: { width: "100%", height: "100%" },
  bannerPlaceholder: {
    flex: 1,
    backgroundColor: "#cfe3ff",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  bannerPlaceholderText: {
    color: "#0a3ea1",
    fontWeight: "800",
    fontSize: 22,
  },
  backFab: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 8 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 14, color: "#666" },
  tag: { fontSize: 12, color: "#666", backgroundColor: "#f0f0f0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  description: { fontSize: 16, color: "#555", lineHeight: 22 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 12 },
  menuHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  menuHeaderPad: { paddingHorizontal: 28, paddingTop: 12 },
  menuTitle: { fontSize: 24, fontWeight: '800', color: '#222' },
  loadingText: { fontSize: 14, color: '#666', fontStyle: 'italic' },
  filterChipsRowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterChipsPad: { paddingHorizontal: 12, paddingBottom: 6 },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fafafa',
    marginRight: 6,
  },
  chipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { color: '#333', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: 'white' },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  foodDesc: { fontSize: 14, color: '#666', marginBottom: 4, lineHeight: 18 },
  allergenTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  allergenTag: { backgroundColor: '#FFF3E0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  allergenTagText: { color: '#E65100', fontSize: 11, fontWeight: '600' },
  priceRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  foodPrice: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  dietaryTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dietaryTag: { backgroundColor: '#E3F2FD', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  dietaryTagText: { color: '#1976D2', fontSize: 11, fontWeight: '600' },
  noItemsText: { fontSize: 16, color: '#666', textAlign: 'center', fontStyle: 'italic' },
});

export default OutletView;