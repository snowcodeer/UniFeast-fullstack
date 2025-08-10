import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Image as ExpoImage } from "expo-image";
import type { Outlet } from "../data/outletsSouthKensington";
import type { UserProfile } from "../services/ProfileService";
import outletBanners from "../assets/outletBanners";

const formatCategoryLabel = (category: Outlet["category"]): string => (category === "Cafe" ? "Café" : category);

type Props = {
  outlet: Outlet;
  onBack: () => void;
  userProfile?: UserProfile | null;
};

const OutletView: React.FC<Props> = ({ outlet, onBack, userProfile }) => {
  // No description toggle; always show description
  const rightAlignedIds = new Set(["kimiko", "huxley-cafe"]);

  const filterCategories = [
    "All",
    "Drinks",
    "Pastries",
    "Cold Food",
    "Hot Food",
    "Snacks",
    "Desserts",
  ] as const;

  const [activeFilter, setActiveFilter] = React.useState<string>("All");

  const selectFilter = (label: string) => {
    setActiveFilter(label);
  };

  const menuItems = React.useMemo(() => {
    const base = [
      { id: "m1", name: `${outlet.name} House Coffee`, desc: "Freshly brewed coffee.", price: 2.5, category: "Drinks", allergens: ["Contains caffeine"] },
      { id: "m2", name: `${outlet.name} Iced Tea`, desc: "Refreshing iced tea.", price: 2.8, category: "Drinks", allergens: ["Contains caffeine"] },
      { id: "m3", name: "Butter Croissant", desc: "Flaky, baked daily.", price: 2.2, category: "Pastries", allergens: ["Contains gluten", "May contain nuts"] },
      { id: "m4", name: "Chocolate Muffin", desc: "Rich cocoa muffin.", price: 2.4, category: "Pastries", allergens: ["Contains gluten", "May contain nuts"] },
      { id: "m5", name: "Chicken Caesar Wrap", desc: "Chilled wrap with salad.", price: 4.9, category: "Cold Food", allergens: ["Contains gluten"] },
      { id: "m6", name: "Greek Salad", desc: "Feta, olives, tomatoes.", price: 4.5, category: "Cold Food", allergens: ["Contains dairy"] },
      { id: "m7", name: "Tomato Soup", desc: "Served hot.", price: 3.5, category: "Hot Food", allergens: ["Contains celery"] },
      { id: "m8", name: "Margherita Slice", desc: "Hot pizza slice.", price: 3.2, category: "Hot Food", allergens: ["Contains gluten", "Contains dairy"] },
      { id: "m9", name: "Crisps", desc: "Lightly salted.", price: 1.2, category: "Snacks", allergens: ["May contain traces"] },
      { id: "m10", name: "Brownie", desc: "Fudgy chocolate.", price: 2.0, category: "Desserts", allergens: ["Contains gluten", "Contains eggs", "May contain nuts"] },
    ] as const;

    if (activeFilter === "All") return base;
    return base.filter(item => item.category === activeFilter);
  }, [outlet.name, activeFilter]);

  const getItemIcon = (category: string): string => {
    switch (category) {
      case "Drinks":
        return "local-cafe"; // or local-drink
      case "Pastries":
        return "bakery-dining";
      case "Cold Food":
        return "lunch-dining";
      case "Hot Food":
        return "ramen-dining";
      case "Snacks":
        return "fastfood";
      case "Desserts":
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
      pushIf((userProfile as any).milk_allergy, "milk");
      pushIf((userProfile as any).eggs_allergy, "egg");
      pushIf((userProfile as any).peanuts_allergy, "peanut");
      pushIf((userProfile as any).tree_nuts_allergy, "nut");
      pushIf((userProfile as any).shellfish_allergy, "shellfish");
      const other = Array.isArray(userProfile.other_allergies) ? userProfile.other_allergies : [];
      other.forEach(o => {
        if (typeof o === "string") terms.push(o.toLowerCase());
      });
    }
    return new Set(terms.map(t => t.toLowerCase()));
  }, [userProfile]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.bannerContainer}>
          {outletBanners[outlet.id] ? (
            <ExpoImage
              source={outletBanners[outlet.id]}
              style={styles.bannerImage}
              contentFit="cover"
              contentPosition={rightAlignedIds.has(outlet.id) ? "right center" : "left center"}
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
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterChipsRowInline, styles.filterChipsPad]}
        >
          {filterCategories.map((label) => {
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

        {menuItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.foodCard}>
              <View style={styles.foodIconContainer}>
                <Icon name={getItemIcon(item.category as unknown as string)} size={28} color="#ffffff" />
              </View>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                {Array.isArray((item as any).allergens) && (item as any).allergens.length > 0 ? (() => {
                  const matched = (item as any).allergens.filter((a: string) => {
                    const al = a.toLowerCase();
                    for (const term of Array.from(userAllergenTerms)) {
                      if (al.includes(term)) return true;
                    }
                    return false;
                  });
                  return matched.length > 0 ? (
                    <View style={styles.allergenTagsRow}>
                      {matched.map((a: string) => (
                        <View key={a} style={styles.allergenTag}>
                          <Text style={styles.allergenTagText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null;
                })() : null}
                <Text style={styles.foodPrice}>£{item.price.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ))}
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
  // removed collapse toggle styles
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 12 },
  bodyText: { fontSize: 14, color: "#555", lineHeight: 20 },
  menuHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  // Align to card text: card margin (12) + card padding (16) = 28
  menuHeaderPad: { paddingHorizontal: 28, paddingTop: 12 },
  menuTitle: { fontSize: 24, fontWeight: '800', color: '#222' },
  filterChipsRowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Match card side margins (12) rather than card text (28)
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
  // removed global allergen notice
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
  // foodDesc removed
  allergenTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  allergenTag: { backgroundColor: '#FFF3E0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  allergenTagText: { color: '#E65100', fontSize: 11, fontWeight: '600' },
  foodPrice: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
});

export default OutletView;

