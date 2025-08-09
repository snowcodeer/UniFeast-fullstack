import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { userService, UserProfile } from "./services/SimpleUserService";

// Mock data for restaurants with menu items
const mockRestaurants = [
  {
    id: 1,
    name: "Spice Garden",
    description: "Authentic Indian cuisine with aromatic spices",
    cuisine_type: "Indian",
    rating: 4.5,
    delivery_time: "20-30 min",
    location: "Student Union Building",
    menuItems: [
      {
        id: 1,
        name: "Chicken Tikka Masala",
        description: "Creamy curry with tender chicken pieces",
        price: 8.50,
        allergens: ["milk", "eggs"]
      }
    ]
  },
  {
    id: 2,
    name: "Fresh Bites",
    description: "Healthy salads, wraps and fresh ingredients",
    cuisine_type: "International",
    rating: 4.3,
    delivery_time: "15-25 min",
    location: "Library Café",
    menuItems: [
      {
        id: 2,
        name: "Caesar Salad",
        description: "Crisp lettuce with parmesan and croutons",
        price: 6.00,
        allergens: ["eggs", "gluten"]
      }
    ]
  },
  {
    id: 3,
    name: "Quick Eats",
    description: "Fast and delicious comfort food",
    cuisine_type: "American",
    rating: 4.1,
    delivery_time: "10-20 min",
    location: "Food Court",
    menuItems: [
      {
        id: 3,
        name: "Classic Burger",
        description: "Beef patty with lettuce, tomato, and special sauce",
        price: 7.50,
        allergens: ["gluten", "eggs"]
      }
    ]
  },
  {
    id: 4,
    name: "Pizza Palace",
    description: "Wood-fired pizzas and Italian classics",
    cuisine_type: "Italian",
    rating: 4.6,
    delivery_time: "25-35 min",
    location: "Campus Center",
    menuItems: [
      {
        id: 4,
        name: "Margherita Pizza",
        description: "Fresh mozzarella, tomato sauce, and basil",
        price: 12.00,
        allergens: ["milk", "gluten"]
      }
    ]
  },
  {
    id: 5,
    name: "Noodle House",
    description: "Asian noodles, rice bowls and stir-fries",
    cuisine_type: "Asian",
    rating: 4.4,
    delivery_time: "20-30 min",
    location: "Engineering Building",
    menuItems: [
      {
        id: 5,
        name: "Chicken Pad Thai",
        description: "Stir-fried rice noodles with chicken and peanuts",
        price: 9.00,
        allergens: ["peanuts", "eggs"]
      }
    ]
  },
  {
    id: 6,
    name: "Burger Junction",
    description: "Gourmet burgers and crispy fries",
    cuisine_type: "American",
    rating: 4.2,
    delivery_time: "15-25 min",
    location: "Sports Complex",
    menuItems: [
      {
        id: 6,
        name: "BBQ Bacon Burger",
        description: "Smoky BBQ sauce with crispy bacon and cheese",
        price: 9.50,
        allergens: ["milk", "gluten"]
      }
    ]
  },
  {
    id: 7,
    name: "Mediterranean Corner",
    description: "Fresh Mediterranean dishes and healthy options",
    cuisine_type: "Mediterranean",
    rating: 4.4,
    delivery_time: "20-25 min",
    location: "Health Sciences Building",
    menuItems: [
      {
        id: 7,
        name: "Chicken Shawarma Wrap",
        description: "Marinated chicken with tahini sauce and vegetables",
        price: 8.00,
        allergens: ["gluten", "sesame"]
      }
    ]
  },
  {
    id: 8,
    name: "Taco Fiesta",
    description: "Authentic Mexican street food and tacos",
    cuisine_type: "Mexican",
    rating: 4.3,
    delivery_time: "15-20 min",
    location: "Arts Building",
    menuItems: [
      {
        id: 8,
        name: "Beef Carnitas Tacos",
        description: "Slow-cooked beef with onions, cilantro, and lime",
        price: 7.00,
        allergens: ["gluten"]
      }
    ]
  },
  {
    id: 9,
    name: "Sushi Express",
    description: "Fresh sushi and Japanese favorites",
    cuisine_type: "Japanese",
    rating: 4.7,
    delivery_time: "25-30 min",
    location: "Science Building",
    menuItems: [
      {
        id: 9,
        name: "Salmon Avocado Roll",
        description: "Fresh salmon and avocado with sushi rice",
        price: 10.50,
        allergens: ["fish"]
      }
    ]
  }
];

const RestaurantCard = ({ restaurant, onPress }: { restaurant: any; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.description}>{restaurant.description}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {restaurant.rating}</Text>
            <Text style={styles.deliveryTime}>{restaurant.delivery_time}</Text>
          </View>
          <Text style={styles.location}>{restaurant.location}</Text>
        </View>
        
        <View style={styles.tags}>
          <Text style={styles.tag}>{restaurant.cuisine_type}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Home = () => {
  const { user } = useAuthenticator();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);

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

  const handleRestaurantPress = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    // TODO: Navigate to restaurant menu
    console.log("Navigate to restaurant:", restaurant.name);
  };

  // If a restaurant is selected, show its menu
  if (selectedRestaurant) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRestaurant(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedRestaurant.name}</Text>
        </View>
        
        <ScrollView style={styles.menuContainer}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantHeaderName}>{selectedRestaurant.name}</Text>
            <Text style={styles.restaurantHeaderDescription}>{selectedRestaurant.description}</Text>
            <View style={styles.restaurantHeaderDetails}>
              <Text style={styles.rating}>⭐ {selectedRestaurant.rating}</Text>
              <Text style={styles.deliveryTime}>{selectedRestaurant.delivery_time}</Text>
              <Text style={styles.location}>{selectedRestaurant.location}</Text>
            </View>
          </View>
          
          <Text style={styles.menuSectionTitle}>Menu</Text>
          {selectedRestaurant.menuItems.map((item: any) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemHeader}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemPrice}>£{item.price.toFixed(2)}</Text>
              </View>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
              {item.allergens.length > 0 && (
                <Text style={styles.allergenInfo}>
                  ⚠️ Contains: {item.allergens.join(", ")}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Restaurants</Text>
      {userProfile && (
        <Text style={styles.welcomeText}>
          Welcome back, {userProfile.user_name || "Student"}! 👋
        </Text>
      )}
      
      {mockRestaurants.map((restaurant) => (
        <RestaurantCard 
          key={restaurant.id} 
          restaurant={restaurant}
          onPress={() => handleRestaurantPress(restaurant)}
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