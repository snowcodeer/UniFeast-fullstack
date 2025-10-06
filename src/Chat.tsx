import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { restaurantService } from "./services/RestaurantService";
import type { Restaurant } from "./services/FoodDatabaseService";
import OutletView from "./components/OutletView";
import { Image as ExpoImage } from "expo-image";
import outletBanners from "./assets/outletBanners";
import { userService } from "./services/ProfileService";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
  foodCards?: FoodCard[];
}

interface FoodCard {
  dish_name: string;
  restaurant_name: string;
  description: string;
  category: string;
  food_type: string;
  cuisine_type: string;
  ingredients: string[];
  dietary_tags?: string[]; // API uses dietary_tags
  dietary_preferences?: string[]; // Fallback for our test data
  milk_allergy: boolean;
  eggs_allergy: boolean;
  peanuts_allergy: boolean;
  tree_nuts_allergy: boolean;
  shellfish_allergy: boolean;
  other_allergens?: string[]; // API uses other_allergens
  other_allergies?: string[]; // Fallback for our test data
  student_price: number;
  staff_price: number;
  serve_time: string;
  location: string;
  available: boolean;
  image_url: string | null;
  score: number;
}

interface SearchMetadata {
  total_results?: number;
  search_query?: string;
  filters_applied?: string[];
  user_identity?: string;
  budget_limit?: number;
}

interface AIResponse {
  text_bubble: string;
  ui_cards: FoodCard[];
  user_id: string;
  session_id: string;
  timestamp: string;
  search_metadata: SearchMetadata;
}

const Chat = () => {
  const { user } = useAuthenticator();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize chat with AI's first message
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      initializeChat();
    }
  }, [hasInitialized, user?.userId]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile and create profile message
      let profileMessage = "Hello";
      if (user?.userId) {
        try {
          const profile = await userService.getUser(user.userId);
          if (profile) {
            // Create a plain text profile message
            const dietaryPrefs = profile.dietary_preferences?.join(', ') || 'None specified';
            const allergies = [];
            
            if (profile.milk_allergy) allergies.push('milk');
            if (profile.eggs_allergy) allergies.push('eggs');
            if (profile.peanuts_allergy) allergies.push('peanuts');
            if (profile.tree_nuts_allergy) allergies.push('tree nuts');
            if (profile.shellfish_allergy) allergies.push('shellfish');
            if (profile.other_allergies?.length) {
              allergies.push(...profile.other_allergies);
            }
            
            const allergiesText = allergies.length > 0 ? allergies.join(', ') : 'None';
            
            profileMessage = `Hello. My dietary preferences are: ${dietaryPrefs}. My allergies are: ${allergiesText}.`;
          }
        } catch (profileError) {
          console.log('Could not fetch user profile:', profileError);
        }
      }
      
      const aiResponse = await generateAIResponse(profileMessage);
      
      console.log('Initialization AI Response:', {
        text_bubble: aiResponse.text_bubble,
        ui_cards_count: aiResponse.ui_cards?.length || 0,
        ui_cards: aiResponse.ui_cards
      });
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse.text_bubble,
        isUser: false,
        timestamp: new Date(),
        foodCards: aiResponse.ui_cards,
      };

      setMessages([aiMessage]);
    } catch (error) {
      console.error("Error initializing chat:", error);
      // Fallback welcome message if initialization fails
      const fallbackMessage: Message = {
        id: "fallback",
        text: "Hi! I'm your UniFeast Chatbot. I can help you find restaurants, answer questions about campus dining, and provide recommendations based on your preferences. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Test API health on component mount
  useEffect(() => {
    const testAPIHealth = async () => {
      try {
        console.log('Testing API health endpoint...');
        const response = await fetch('https://unifeast-chatbot-production.up.railway.app/health');
        const healthData = await response.text();
        console.log('Health check response:', response.status, healthData);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };
    
    testAPIHealth();
  }, []);

  // Fetch user profile for restaurant navigation
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const { userService } = await import('./services/ProfileService');
        const profile = await userService.getUser(user.userId);
        setUserProfile(profile);
      } catch (error) {
        console.log("Could not fetch user profile for restaurant navigation");
      }
    };
    fetchUserProfile();
  }, [user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<AIResponse> => {
    // Test case for displaying sample UI card
    if (userMessage.toLowerCase().trim() === 'test') {
      console.log('Test message detected - returning sample food card');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      return {
        text_bubble: "Here's a sample food recommendation to test the UI cards:",
        ui_cards: [{
          dish_name: "Spring Rolls (4 pieces)",
          restaurant_name: "Hão Chí",
          description: "Crispy vegetable rolls",
          category: "Appetizers",
          food_type: "Savory",
          cuisine_type: "Chinese",
          ingredients: ["Pastry", "vegetables", "cabbage", "carrot"],
          dietary_preferences: ["Vegan"],
          milk_allergy: false,
          eggs_allergy: false,
          peanuts_allergy: false,
          tree_nuts_allergy: false,
          shellfish_allergy: false,
          other_allergies: [],
          student_price: 4.25,
          staff_price: 4.65,
          serve_time: "All day",
          location: "Junior Common Room (Sherfield Building)",
          available: true,
          image_url: null,
          score: 0.95
        }],
        user_id: user?.userId || 'test',
        session_id: 'test-session',
        timestamp: new Date().toISOString(),
        search_metadata: {
          total_results: 1,
          search_query: "test",
          filters_applied: ["test"],
          user_identity: "student",
          budget_limit: 10
        }
      };
    }

    try {
      console.log('Sending request to AI endpoint:', {
        message: userMessage,
        user_id: user?.userId || 'anonymous'
      });

      const response = await fetch('https://unifeast-chatbot-production.up.railway.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          user_id: user?.userId || 'anonymous',
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.log('Response text that failed to parse:', responseText);
        return {
          text_bubble: "I received a response from the server, but it wasn't in the expected format. Please try again.",
          ui_cards: [],
          user_id: '',
          session_id: '',
          timestamp: new Date().toISOString(),
          search_metadata: {}
        };
      }

      console.log('Parsed response data:', data);

      // Handle the correct response format
      if (data.text_bubble) {
        return {
          text_bubble: data.text_bubble,
          ui_cards: data.ui_cards || [],
          user_id: data.user_id,
          session_id: data.session_id,
          timestamp: data.timestamp,
          search_metadata: data.search_metadata
        };
      }

      // Fallback for old format or missing text_bubble
      if (data.response || data.message || data.text) {
        return {
          text_bubble: data.response || data.message || data.text,
          ui_cards: [],
          user_id: data.user_id || '',
          session_id: data.session_id || '',
          timestamp: data.timestamp || new Date().toISOString(),
          search_metadata: data.search_metadata || {}
        };
      }

      // If response is empty or unexpected format
      if (!data || Object.keys(data).length === 0) {
        return {
          text_bubble: "The AI service returned an empty response. Please try rephrasing your question or try again.",
          ui_cards: [],
          user_id: '',
          session_id: '',
          timestamp: new Date().toISOString(),
          search_metadata: {}
        };
      }

      // Fallback - try to use the data as is
      return {
        text_bubble: JSON.stringify(data),
        ui_cards: [],
        user_id: '',
        session_id: '',
        timestamp: new Date().toISOString(),
        search_metadata: {}
      };

    } catch (error) {
      console.error('Error calling AI endpoint:', error);
      // Fallback response if API is unavailable
      return {
        text_bubble: "I'm having trouble connecting to my AI service right now. I'm still here to help with campus dining questions though! Feel free to ask me about restaurants, food options, or dietary requirements.",
        ui_cards: [],
        user_id: '',
        session_id: '',
        timestamp: new Date().toISOString(),
        search_metadata: {}
      };
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.text);
      
      console.log('AI Response received:', {
        text_bubble: aiResponse.text_bubble,
        ui_cards_count: aiResponse.ui_cards?.length || 0,
        ui_cards: aiResponse.ui_cards
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text_bubble,
        isUser: false,
        timestamp: new Date(),
        foodCards: aiResponse.ui_cards,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      Alert.alert("Error", "Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Map API restaurant names to database restaurant names
  const normalizeRestaurantName = (apiName: string): string => {
    const nameMappings: Record<string, string> = {
      "Kokoro at H-Bar": "Kokoro",
      "kokoro at h-bar": "Kokoro",
      "KOKORO AT H-BAR": "Kokoro",
    };

    // Check for exact matches first
    if (nameMappings[apiName]) {
      return nameMappings[apiName];
    }

    // Check for partial matches (case insensitive)
    const lowerApiName = apiName.toLowerCase();
    for (const [apiKey, dbName] of Object.entries(nameMappings)) {
      if (lowerApiName.includes(apiKey.toLowerCase())) {
        return dbName;
      }
    }

    // If no mapping found, return the original name
    return apiName;
  };

  // Extract location from restaurant name (e.g., "Kokoro at H-Bar" -> "H-Bar")
  const extractLocationFromRestaurantName = (restaurantName: string): string => {
    const locationMappings: Record<string, string> = {
      "Kokoro at H-Bar": "H-Bar",
      "kokoro at h-bar": "H-Bar",
      "KOKORO AT H-BAR": "H-Bar",
    };

    // Check for exact matches first
    if (locationMappings[restaurantName]) {
      return locationMappings[restaurantName];
    }

    // Check for partial matches (case insensitive)
    const lowerRestaurantName = restaurantName.toLowerCase();
    for (const [apiKey, location] of Object.entries(locationMappings)) {
      if (lowerRestaurantName.includes(apiKey.toLowerCase())) {
        return location;
      }
    }

    // If no mapping found, return the original location or restaurant name
    return restaurantName;
  };

  const FoodCard = ({ card }: { card: FoodCard }) => {
    const [bannerImage, setBannerImage] = useState<any>(null);
    const [bannerPosition, setBannerPosition] = useState<string>('left center');

    useEffect(() => {
      const loadBanner = async () => {
        try {
          // Normalize the restaurant name from API to match database
          const normalizedName = normalizeRestaurantName(card.restaurant_name);
          
          // Get the restaurant from the service to find its ID
          const restaurants = await restaurantService.getSouthKensingtonOutlets();
          const restaurant = restaurants.find(r => r.name === normalizedName);
          
          if (restaurant) {
            // Get banner image
            if (outletBanners[restaurant.id]) {
              setBannerImage(outletBanners[restaurant.id]);
            }
            
            // Get banner position
            const position = await restaurantService.getBannerPosition(restaurant.id);
            setBannerPosition(position);
          }
        } catch (error) {
          console.log('Error loading banner for', card.restaurant_name, ':', error);
        }
      };

      loadBanner();
    }, [card.restaurant_name]);

    const formatTag = (tag: string): string => {
      return tag
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-');
    };

    const formatServeTime = (serveTime: string): string => {
      return serveTime
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const getUserPrice = () => {
      // Check if we have user profile data to determine pricing
      // For now, default to student pricing. You can enhance this by:
      // 1. Getting user profile from context/props
      // 2. Checking user.identity or similar field
      // 3. Defaulting to student pricing
      
      // Example logic (uncomment and modify based on your user system):
      // const userIdentity = user?.user_identity || 'student';
      // if (userIdentity === 'staff') {
      //   return { price: card.staff_price, label: "Staff Price" };
      // }
      
      return {
        price: card.student_price,
        label: "Student Price"
      };
    };

    const getAllergies = () => {
      const allergies = [];
      if (card.milk_allergy) allergies.push('Milk');
      if (card.eggs_allergy) allergies.push('Eggs');
      if (card.peanuts_allergy) allergies.push('Peanuts');
      if (card.tree_nuts_allergy) allergies.push('Tree nuts');
      if (card.shellfish_allergy) allergies.push('Shellfish');
      
      // Handle both API field names
      const otherAllergies = card.other_allergens || card.other_allergies || [];
      return [...allergies, ...otherAllergies];
    };

    const allergies = getAllergies();
    const dietaryPreferences = (card.dietary_tags || card.dietary_preferences || []).map(formatTag);

    const handleCardPress = async () => {
      try {
        // Normalize the restaurant name from API to match database
        const normalizedName = normalizeRestaurantName(card.restaurant_name);
        console.log('Normalizing restaurant name:', card.restaurant_name, '->', normalizedName);
        
        // Find the restaurant by normalized name from the restaurant service
        const restaurants = await restaurantService.getSouthKensingtonOutlets();
        const restaurant = restaurants.find(r => r.name === normalizedName);
        
        if (restaurant) {
          // Navigate to restaurant details using the same component as Home
          setSelectedRestaurant(restaurant);
          // Set the food category to open the correct tab
          setSelectedFoodCategory(card.category);
        } else {
          // Fallback if restaurant not found
          console.log('Available restaurants:', restaurants.map(r => r.name));
          Alert.alert(
            card.restaurant_name,
            `Restaurant details not found for ${card.restaurant_name} (normalized: ${normalizedName}). This might be a new restaurant or the name might be slightly different.`,
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error('Error finding restaurant:', error);
        Alert.alert(
          "Error",
          "Could not load restaurant details. Please try again.",
          [{ text: "OK" }]
        );
      }
    };

    return (
      <TouchableOpacity style={styles.foodCard} onPress={handleCardPress} activeOpacity={0.7}>
        {/* Restaurant Banner Image */}
        <View style={styles.foodImageContainer}>
          {bannerImage ? (
            <ExpoImage
              source={bannerImage}
              style={styles.foodImage}
              contentFit="cover"
              contentPosition={bannerPosition as any}
              transition={100}
            />
          ) : (
            <View style={styles.foodImagePlaceholder}>
              <Text style={styles.foodImagePlaceholderText}>{card.restaurant_name}</Text>
            </View>
          )}
          <View style={[styles.availabilityBadge, card.available ? styles.availableBadge : styles.unavailableBadge]}>
            <Text style={[styles.availabilityText, card.available ? styles.availableText : styles.unavailableText]}>
              {card.available ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>

        <View style={styles.foodCardContent}>
          <View style={styles.foodCardHeader}>
            <Text style={styles.dishName}>{card.dish_name}</Text>
          </View>
          
          <Text style={styles.restaurantName}>{card.restaurant_name}</Text>
          <Text style={styles.description}>{card.description}</Text>
        
          <View style={styles.foodCardDetails}>
          <View style={styles.detailRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.detailText}>{extractLocationFromRestaurantName(card.restaurant_name)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="access-time" size={16} color="#666" />
            <Text style={styles.detailText}>{formatServeTime(card.serve_time)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="category" size={16} color="#666" />
            <Text style={styles.detailText}>{card.category} • {card.cuisine_type}</Text>
          </View>
        </View>

        {dietaryPreferences.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Dietary:</Text>
            <View style={styles.tagsRow}>
              {dietaryPreferences.map((pref, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{pref}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {allergies.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Allergens:</Text>
            <View style={styles.tagsRow}>
              {allergies.map((allergy, index) => (
                <View key={index} style={[styles.tag, styles.allergyTag]}>
                  <Text style={[styles.tagText, styles.allergyTagText]}>{allergy}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>{getUserPrice().label}: £{getUserPrice().price}</Text>
        </View>
        
          <View style={styles.cardFooter}>
            <Text style={styles.tapToViewText}>Tap to view restaurant details</Text>
            <Icon name="chevron-right" size={16} color="#007AFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    // Auto-send the suggestion by creating a message directly
    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Generate AI response for the suggestion
    generateAIResponse(suggestion).then(aiResponse => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text_bubble,
        isUser: false,
        timestamp: new Date(),
        foodCards: aiResponse.ui_cards,
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }).catch(error => {
      console.error("Error generating AI response:", error);
      Alert.alert("Error", "Failed to get AI response. Please try again.");
      setIsLoading(false);
    });
  };

  // If a restaurant is selected, show its details (same as Home component)
  if (selectedRestaurant) {
    return <OutletView outlet={selectedRestaurant} userProfile={userProfile} onBack={() => {
      setSelectedRestaurant(null);
      setSelectedFoodCategory(null);
    }} initialCategory={selectedFoodCategory} />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UniFeast Chatbot</Text>
        <View style={styles.headerSubtitle}>
          <Icon name="smart-toy" size={16} color="#007AFF" />
          <Text style={styles.headerSubtitleText}>Campus Dining Helper</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && messages.length === 0 && (
          <View style={[styles.messageContainer, styles.aiMessageContainer]}>
            <View style={[styles.messageBubble, styles.aiMessageBubble]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotDelay1]} />
                <View style={[styles.typingDot, styles.typingDotDelay2]} />
              </View>
            </View>
          </View>
        )}
        
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessageBubble : styles.aiMessageBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.text}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.isUser ? styles.userMessageTime : styles.aiMessageTime,
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
            
            {/* Render food cards for AI messages - outside the message bubble */}
            {!message.isUser && message.foodCards && message.foodCards.length > 0 && (
              <View style={styles.foodCardsContainer}>
                {message.foodCards.map((card, index) => (
                  <FoodCard key={index} card={card} />
                ))}
              </View>
            )}
            
          </View>
        ))}
        
        {isLoading && messages.length > 0 && (
          <View style={[styles.messageContainer, styles.aiMessageContainer]}>
            <View style={[styles.messageBubble, styles.aiMessageBubble]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotDelay1]} />
                <View style={[styles.typingDot, styles.typingDotDelay2]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me about food..."
          placeholderTextColor="#8e8e93"
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Icon
            name="send"
            size={20}
            color={(!inputText.trim() || isLoading) ? "#8e8e93" : "white"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 4,
  },
  headerSubtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerSubtitleText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  aiMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessageBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "white",
  },
  aiMessageText: {
    color: "#1c1c1e",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  aiMessageTime: {
    color: "#8e8e93",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    opacity: 0.4,
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1c1c1e",
    backgroundColor: "#f8f9fa",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  suggestionsContainer: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  suggestionText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  foodCardsContainer: {
    marginTop: 8,
    gap: 12,
  },
  foodCardsHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
  },
  foodCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  foodImageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
    backgroundColor: "#f0f0f0",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  foodImagePlaceholder: {
    flex: 1,
    backgroundColor: "#cfe3ff", // pastel blue - same as homepage
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  foodImagePlaceholderText: {
    color: "#0a3ea1",
    fontWeight: "800",
    fontSize: 20,
  },
  foodCardContent: {
    padding: 16,
  },
  foodCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dishName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1c1c1e",
    flex: 1,
    marginRight: 8,
  },
  availabilityBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: "#e8f5e9",
  },
  unavailableBadge: {
    backgroundColor: "#ffebee",
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  availableText: {
    color: "#2e7d32",
  },
  unavailableText: {
    color: "#c62828",
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  foodCardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  tagsContainer: {
    marginBottom: 8,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allergyTag: {
    backgroundColor: "#ffebee",
  },
  tagText: {
    fontSize: 12,
    color: "#1c1c1e",
    fontWeight: "500",
  },
  allergyTagText: {
    color: "#c62828",
  },
  priceContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-start",
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  tapToViewText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
});

export default Chat;
