import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, StyleSheet, Dimensions } from "react-native";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { userService, UserProfile } from "./services/ProfileService";

// Mock data for placeholder food items
const mockFoodItems = [
  {
    id: 1,
    dish_name: "Chicken Tikka Masala",
    restaurant_name: "Spice Garden",
    description: "Creamy curry with tender chicken pieces",
    category: "Main Course",
    cuisine_type: "Indian",
    student_price: 8.50,
    staff_price: 10.00,
    visitor_price: 12.00,
    image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    allergens: ["milk", "eggs"], // Items that may contain these allergens
    available: true
  },
  {
    id: 2,
    dish_name: "Caesar Salad",
    restaurant_name: "Fresh Bites",
    description: "Crisp lettuce with parmesan and croutons",
    category: "Salad",
    cuisine_type: "International",
    student_price: 6.00,
    staff_price: 7.50,
    visitor_price: 9.00,
    image_url: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
    allergens: ["eggs", "gluten"], // Items that may contain these allergens
    available: true
  },
  {
    id: 3,
    dish_name: "Peanut Butter Sandwich",
    restaurant_name: "Quick Eats",
    description: "Classic sandwich with smooth peanut butter",
    category: "Sandwich",
    cuisine_type: "American",
    student_price: 4.50,
    staff_price: 5.50,
    visitor_price: 6.50,
    image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
    allergens: ["peanuts", "gluten"], // Items that may contain these allergens
    available: true
  }
];

const MenuItem = ({ item, userProfile }: { item: any; userProfile: any }) => {
  const [hasAllergenWarning, setHasAllergenWarning] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    
    // Check if user has allergies that match the item's allergens
    const userAllergies: string[] = [];
    
    // Check main 5 allergens
    if (userProfile.milkAllergy) userAllergies.push("milk");
    if (userProfile.eggsAllergy) userAllergies.push("eggs");
    if (userProfile.peanutsAllergy) userAllergies.push("peanuts");
    if (userProfile.treeNutsAllergy) userAllergies.push("tree nuts");
    if (userProfile.shellfishAllergy) userAllergies.push("shellfish");
    
    // Check other allergens from the string
    if (userProfile.otherAllergens) {
      const otherAllergies = userProfile.otherAllergens.split(",").map((a: string) => a.trim().toLowerCase());
      userAllergies.push(...otherAllergies);
    }
    
    // Check for matches (case-insensitive)
    const hasMatch = item.allergens.some((allergen: string) =>
      userAllergies.some((userAllergy: string) => 
        userAllergy.toLowerCase().includes(allergen.toLowerCase()) ||
        allergen.toLowerCase().includes(userAllergy.toLowerCase())
      )
    );
    
    setHasAllergenWarning(hasMatch);
  }, [userProfile, item.allergens]);

  // Determine price based on user identity
  const getPrice = () => {
    if (!userProfile) return item.student_price;
    
    switch (userProfile.userIdentity) {
      case "student":
        return item.student_price;
      case "staff":
        return item.staff_price;
      case "visitor":
        return item.visitor_price;
      default:
        return item.student_price;
    }
  };

  return (
    <View style={[
      styles.card,
      hasAllergenWarning && styles.allergenWarning
    ]}>
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.dishName}>{item.dish_name}</Text>
        <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>£{getPrice().toFixed(2)}</Text>
          {hasAllergenWarning && (
            <Text style={styles.warningText}>⚠️ May contain allergens</Text>
          )}
        </View>
        <View style={styles.tags}>
          <Text style={styles.tag}>{item.category}</Text>
          <Text style={styles.tag}>{item.cuisine_type}</Text>
        </View>
      </View>
    </View>
  );
};

const Menu = () => {
  const { user } = useAuthenticator();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const profile = await userService.getUser(user.userId);
        setUserProfile(profile);
      } catch (error) {
        console.log("Could not fetch profile for menu pricing");
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Today's Menu</Text>
      {mockFoodItems.map((item) => (
        <MenuItem 
          key={item.id} 
          item={item} 
          userProfile={userProfile}
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
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
  allergenWarning: {
    borderWidth: 3,
    borderColor: "#FFD700", // Yellow border for allergen warnings
  },
  image: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  dishName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32", // Green color for price
  },
  warningText: {
    fontSize: 12,
    color: "#D32F2F", // Red color for warning
    fontWeight: "500",
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
});

export default Menu; 