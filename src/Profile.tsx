// src/Profile.tsx
import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert,
  StyleSheet,
  Platform,
  Pressable,
  Image,
  Animated,
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { userService, UserProfile, FavouriteItem } from "./services/ProfileService";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const DIETARY_OPTIONS = [
  "Halal",
  "Vegan", 
  "Vegetarian",
  "Gluten-Free",
  "Kosher",
  "Dairy-Free",
  "Nut-Free",
];

const ALL_ALLERGENS = [
  { key: "milk_allergy", label: "Milk" },
  { key: "eggs_allergy", label: "Eggs" },
  { key: "peanuts_allergy", label: "Peanuts" },
  { key: "tree_nuts_allergy", label: "Tree nuts" },
  { key: "shellfish_allergy", label: "Shellfish" },
  { key: "celery", label: "Celery" },
  { key: "gluten", label: "Cereals containing gluten" },
  { key: "crustaceans", label: "Crustaceans" },
  { key: "fish", label: "Fish" },
  { key: "lupin", label: "Lupin" },
  { key: "molluscs", label: "Molluscs" },
  { key: "mustard", label: "Mustard" },
  { key: "sesame", label: "Sesame seeds" },
  { key: "soybeans", label: "Soybeans" },
  { key: "sulphites", label: "Sulphur dioxide and sulphites" },
];

// Helper functions to get main 5 allergens and extra allergens
const getMainAllergens = () => ALL_ALLERGENS.slice(0, 5);
const getExtraAllergens = () => ALL_ALLERGENS.slice(5);

const defaultProfile = {
  user_name: "",
  dietary_preferences: [] as string[],
  period_plan: "",
  budget: "",
  milk_allergy: false,
  eggs_allergy: false,
  peanuts_allergy: false,
  tree_nuts_allergy: false,
  shellfish_allergy: false,
  other_allergies: [] as string[],
  favourites: [] as any[],
};

// User ID now comes from authenticated user

function ProfileForm({
  initialForm,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initialForm: Record<string, any>;
  onSubmit: (form: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initialForm);

  const toggleDietaryPreference = (preference: string) => {
    setForm(prev => ({
      ...prev,
      dietary_preferences: prev.dietary_preferences.includes(preference)
        ? prev.dietary_preferences.filter((p: string) => p !== preference)
        : [...prev.dietary_preferences, preference]
    }));
  };

  const toggleAllergen = (key: string) => {
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {submitLabel === "Create" ? "Create Profile" : "Edit Profile"}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>
        <View style={styles.sectionContent}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={form.user_name}
            onChangeText={(text) => setForm(prev => ({ ...prev, user_name: text }))}
            placeholder="Enter your name"
            placeholderTextColor="#6e6e73"
          />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Identity</Text>
          <View style={styles.identityButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.identityButton, 
                form.user_identity === 'student' && styles.identityButtonSelected
              ]}
              onPress={() => setForm(prev => ({ ...prev, user_identity: 'student' }))}
            >
              <Text style={[
                styles.identityButtonText,
                form.user_identity === 'student' && styles.identityButtonTextSelected
              ]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.identityButton, 
                form.user_identity === 'staff' && styles.identityButtonSelected
              ]}
              onPress={() => setForm(prev => ({ ...prev, user_identity: 'staff' }))}
            >
              <Text style={[
                styles.identityButtonText,
                form.user_identity === 'staff' && styles.identityButtonTextSelected
              ]}>Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.identityButton, 
                form.user_identity === 'visitor' && styles.identityButtonSelected
              ]}
              onPress={() => setForm(prev => ({ ...prev, user_identity: 'visitor' }))}
            >
              <Text style={[
                styles.identityButtonText,
                form.user_identity === 'visitor' && styles.identityButtonTextSelected
              ]}>Visitor</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Budget</Text>
          <View style={styles.budgetButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.budgetButton, 
                form.budget === '£' && styles.budgetButtonSelected
              ]}
              onPress={() => setForm(prev => ({ ...prev, budget: '£' }))}
            >
              <Text style={[
                styles.budgetButtonText,
                form.budget === '£' && styles.budgetButtonTextSelected
              ]}>£</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.budgetButton, 
                form.budget === '££' && styles.budgetButtonSelected
              ]}
              onPress={() => setForm(prev => ({ ...prev, budget: '££' }))}
            >
              <Text style={[
                styles.budgetButtonText,
                form.budget === '££' && styles.budgetButtonTextSelected
              ]}>££</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.budgetButton, 
                form.budget === '£££' && styles.budgetButtonSelected
              ]}
              onPress={() => setForm(prev => ({ ...prev, budget: '£££' }))}
            >
              <Text style={[
                styles.budgetButtonText,
                form.budget === '£££' && styles.budgetButtonTextSelected
              ]}>£££</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="restaurant" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.preferencesContainer}>
            {DIETARY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.preferenceChip,
                  form.dietary_preferences.includes(option) && styles.preferenceChipSelected
                ]}
                onPress={() => toggleDietaryPreference(option)}
              >
                <Text style={[
                  styles.preferenceChipText,
                  form.dietary_preferences.includes(option) && styles.preferenceChipTextSelected
                ]}>
                  {option}
                </Text>
                {form.dietary_preferences.includes(option) && (
                  <MaterialIcons name="check" size={18} color="white" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="warning" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Allergens</Text>
        </View>
        <View style={styles.sectionContent}>
          {ALL_ALLERGENS.map(allergen => (
            <View key={allergen.key} style={styles.allergenRow}>
              <Text style={styles.allergenLabel}>{allergen.label}</Text>
              <Switch
                value={!!form[allergen.key]}
                onValueChange={() => toggleAllergen(allergen.key)}
                trackColor={{ false: "#e0e0e0", true: "#007AFF" }}
                ios_backgroundColor="#e0e0e0"
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="flag" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Current Goal</Text>
        </View>
        <View style={styles.sectionContent}>
          <TextInput
            style={styles.textInput}
            value={form.period_plan}
            onChangeText={(text) => setForm(prev => ({ ...prev, period_plan: text }))}
            placeholder="Type in your recent plans, whether you want to find a nearby restaurant..."
            placeholderTextColor="#6e6e73"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => onSubmit(form)}
        >
          <MaterialIcons name="check" size={20} color="white" />
          <Text style={styles.editButtonText}>{submitLabel}</Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={onCancel}
          >
            <MaterialIcons name="close" size={20} color="#FF3B30" />
            <Text style={styles.signOutButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const Profile = () => {
  const { user, signOut } = useAuthenticator();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Refresh profile when user navigates to this tab
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchProfile();
      }
    }, [user])
  );

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProfile = await userService.getUser(user.userId);
      setProfile(userProfile);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const getFormFromProfile = (profile: UserProfile) => {
    // Handle main 5 allergens as booleans
    const mainAllergens = getMainAllergens().reduce((acc: Record<string, boolean>, a) => {
      acc[a.key] = !!(profile as any)[a.key];
      return acc;
    }, {} as Record<string, boolean>);

    // Handle extra allergens from other_allergies array
    const extraAllergens = getExtraAllergens().reduce((acc: Record<string, boolean>, a) => {
      const otherAllergiesList = Array.isArray(profile.other_allergies) ? profile.other_allergies : [];
      acc[a.key] = otherAllergiesList.includes(a.label);
      return acc;
    }, {} as Record<string, boolean>);

    return {
      user_name: profile.user_name || "",
      user_identity: profile.user_identity || "student",
      dietary_preferences: Array.isArray(profile.dietary_preferences) ? profile.dietary_preferences : [],
      period_plan: profile.period_plan || "",
      budget: profile.budget || "",
      ...mainAllergens,
      ...extraAllergens,
    };
  };

  const handleCreate = async (form: Record<string, any>) => {
    if (!user) return;

    try {
      // Collect extra allergens that are toggled on
      const other_allergies = getExtraAllergens()
        .filter((allergen: any) => form[allergen.key])
        .map((allergen: any) => allergen.label);

      const profileData = {
        email: user.signInDetails?.loginId ?? "",
        user_name: form.user_name,
        user_identity: form.user_identity,
        dietary_preferences: form.dietary_preferences,
        period_plan: form.period_plan,
        budget: form.budget,
        milk_allergy: form.milk_allergy,
        eggs_allergy: form.eggs_allergy,
        peanuts_allergy: form.peanuts_allergy,
        tree_nuts_allergy: form.tree_nuts_allergy,
        shellfish_allergy: form.shellfish_allergy,
        other_allergies,
      };

      const created = await userService.createUser(user.userId, profileData);
      if (created) {
        setProfile(created);
        Alert.alert("Success", "Profile created successfully!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
      Alert.alert("Error", err.message || "Failed to create profile");
    }
  };

  const handleUpdate = async (form: Record<string, any>) => {
    if (!user) return;

    try {
      // Collect extra allergens that are toggled on
      const other_allergies = getExtraAllergens()
        .filter((allergen: any) => form[allergen.key])
        .map((allergen: any) => allergen.label);

      const updateData = {
        user_name: form.user_name,
        user_identity: form.user_identity,
        dietary_preferences: form.dietary_preferences,
        period_plan: form.period_plan,
        budget: form.budget,
        milk_allergy: form.milk_allergy,
        eggs_allergy: form.eggs_allergy,
        peanuts_allergy: form.peanuts_allergy,
        tree_nuts_allergy: form.tree_nuts_allergy,
        shellfish_allergy: form.shellfish_allergy,
        other_allergies,
      };

      const updated = await userService.updateUser(user.userId, updateData);
      if (updated) {
        setProfile(updated);
        setEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      Alert.alert("Error", err.message || "Failed to update profile");
    }
  };

  const handleBudgetSelect = async (budget: string) => {
    if (!user || !profile) return;

    try {
      const updatedProfile = await userService.updateUser(user.userId, { budget });
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      Alert.alert("Error", "Failed to update budget");
    }
  };

  const handleUnfavourite = async (favourite: FavouriteItem) => {
    if (!user || !profile) return;

    try {
      const updatedProfile = await userService.removeFromFavourites(
        user.userId, 
        favourite.id, 
        favourite.type
      );
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error removing favourite:', error);
      Alert.alert("Error", "Failed to remove favourite");
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", onPress: () => signOut() }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <MaterialIcons name="refresh" size={20} color="white" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    // Show form to create profile
    return (
      <ProfileForm
        initialForm={defaultProfile}
        onSubmit={handleCreate}
        submitLabel="Create Profile"
      />
    );
  }

  if (editing) {
    return (
      <ProfileForm
        initialForm={getFormFromProfile(profile)}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
        submitLabel="Save Changes"
      />
    );
  }

  // Show profile if it exists
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editIconButton} onPress={() => setEditing(true)}>
          <MaterialIcons name="edit" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.userInfoCard}>
        <View style={styles.userCardHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.user_name ? profile.user_name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
            <View style={styles.userInfoText}>
              <Text style={styles.userName}>{profile.user_name || "Anonymous"}</Text>
              <TouchableOpacity 
                style={styles.accountDetailsButton} 
                onPress={() => {
                  console.log('Account Details pressed');
                  const newState = !showAccountDetails;
                  setShowAccountDetails(newState);
                  
                  Animated.timing(animatedHeight, {
                    toValue: newState ? 1 : 0,
                    duration: 300,
                    useNativeDriver: false,
                  }).start();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.accountDetailsText}>Account Details</Text>
                <MaterialIcons 
                  name={showAccountDetails ? "expand-less" : "expand-more"} 
                  size={16} 
                  color="#6e6e73" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showAccountDetails && (
          <Animated.View 
            style={[
              styles.expandedDetailsContainer,
              {
                maxHeight: animatedHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
                opacity: animatedHeight,
              }
            ]}
          >
            <View style={styles.accountDetailRow}>
              <Text style={styles.accountDetailLabel}>Email</Text>
              <Text style={styles.accountDetailValue}>{profile.email || "Not set"}</Text>
            </View>
            <View style={styles.accountDetailRow}>
              <Text style={styles.accountDetailLabel}>Identity</Text>
              <Text style={styles.accountDetailValue}>{(profile.user_identity || "Student").charAt(0).toUpperCase() + (profile.user_identity || "Student").slice(1).toLowerCase()}</Text>
            </View>
            <View style={styles.accountDetailRow}>
              <Text style={styles.accountDetailLabel}>Budget</Text>
              <Text style={styles.accountDetailValue}>{profile.budget || "Not set"}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dietary preferences</Text>
        </View>
        <View style={styles.sectionContent}>
          {Array.isArray(profile.dietary_preferences) && profile.dietary_preferences.length > 0 ? (
            <View style={styles.tagContainer}>
              {profile.dietary_preferences.map((pref) => (
                <View key={pref} style={styles.tag}>
                  <Text style={styles.tagText}>{pref}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No dietary preferences set</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Allergies</Text>
        </View>
        <View style={styles.sectionContent}>
          {[
            ...getMainAllergens().filter((a: any) => (profile as any)[a.key]).map((a: any) => a.label),
            ...(Array.isArray(profile.other_allergies) ? profile.other_allergies : [])
          ].length > 0 ? (
            <View style={styles.tagContainer}>
              {[
                ...getMainAllergens().filter((a: any) => (profile as any)[a.key]).map((a: any) => (
                  <View key={a.key} style={[styles.tag, styles.allergyTag]}>
                    <Text style={styles.tagText}>{a.label}</Text>
                  </View>
                )),
                ...(Array.isArray(profile.other_allergies) ? profile.other_allergies.map((allergy) => (
                  <View key={allergy} style={[styles.tag, styles.allergyTag]}>
                    <Text style={styles.tagText}>{allergy}</Text>
                  </View>
                )) : [])
              ]}
            </View>
          ) : (
            <Text style={styles.emptyText}>No allergies set</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favourites</Text>
        </View>
        <View style={styles.sectionContent}>
          {Array.isArray(profile.favourites) && profile.favourites.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favouritesContainer}
              style={styles.favouritesScrollView}
            >
              {profile.favourites.map((favourite) => (
                <View key={`${favourite.type}-${favourite.id}`} style={styles.favouriteCard}>
                  <View style={styles.favouriteIconContainer}>
                    <MaterialIcons 
                      name={favourite.type === 'restaurant' ? 'restaurant' : 'restaurant-menu'} 
                      size={20} 
                      color="#007AFF" 
                    />
                  </View>
                  <Text style={styles.favouriteName} numberOfLines={2}>
                    {favourite.name}
                  </Text>
                  {favourite.restaurant_name && favourite.type === 'menu_item' && (
                    <Text style={styles.favouriteRestaurant} numberOfLines={1}>
                      {favourite.restaurant_name}
                    </Text>
                  )}
                  <Text style={styles.favouriteType}>
                    {favourite.type === 'restaurant' ? 'Restaurant' : 'Menu Item'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.favouriteRemoveButton}
                    onPress={() => handleUnfavourite(favourite)}
                  >
                    <MaterialIcons 
                      name="star" 
                      size={16} 
                      color="#FFD700" 
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No favourites yet. Star restaurants and menu items to add them here!</Text>
          )}
        </View>
      </View>



      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current goal</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.goalField}>
            <Text style={styles.goalText}>{profile.period_plan || "No goal set"}</Text>
          </View>
        </View>
      </View>





      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
          <MaterialIcons name="logout" size={20} color="#FF3B30" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    marginVertical: 16,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  formHeader: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1c1c1e",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1c1c1e",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1c1c1e",
    backgroundColor: "white",
  },
  preferencesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  preferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  preferenceChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  preferenceChipText: {
    fontSize: 14,
    color: "#1c1c1e",
    marginRight: 4,
  },
  preferenceChipTextSelected: {
    color: "white",
  },
  checkIcon: {
    marginLeft: 4,
  },
  allergenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  allergenLabel: {
    fontSize: 16,
    color: "#1c1c1e",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1c1c1e",
  },

  userInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfoText: {
    marginLeft: 24,
    flex: 1,
    marginRight: 0,
  },
  userCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accountDetailsText: {
    fontSize: 14,
    color: "#6e6e73",
    marginTop: 2,
  },
  accountDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderRadius: 6,
  },
  editIconButton: {
    padding: 0,
    alignSelf: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    color: "white",
    fontWeight: "600",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1c1c1e",
  },
  userIdentity: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginTop: 2,
  },
  userEmail: {
    fontSize: 16,
    color: "#6e6e73",
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1c1c1e",
    marginLeft: 8,
  },
  sectionContent: {
    marginTop: 4,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  allergyTag: {
    backgroundColor: "#ffebee",
  },
  tagText: {
    color: "#1c1c1e",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    color: "#6e6e73",
    fontStyle: "italic",
  },
  planText: {
    fontSize: 16,
    color: "#1c1c1e",
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  editButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#FF3B30",
    gap: 8,
  },
  signOutButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  favouritesContainer: {
    paddingHorizontal: 4,
  },
  favouritesScrollView: {
    marginHorizontal: -16,
  },
  favouriteCard: {
    width: 140,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  favouriteIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  favouriteName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 4,
  },
  favouriteRestaurant: {
    fontSize: 12,
    color: "#6e6e73",
    marginBottom: 4,
  },
  favouriteType: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  favouriteRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  budgetButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  budgetButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  budgetButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  budgetButtonText: {
    fontSize: 16,
    color: "#6e6e73",
    fontWeight: "600",
  },
  budgetButtonTextSelected: {
    color: "white",
  },
  identityButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  identityButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  identityButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  identityButtonText: {
    fontSize: 16,
    color: "#6e6e73",
    fontWeight: "600",
  },
  identityButtonTextSelected: {
    color: "white",
  },
  budgetField: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  budgetText: {
    fontSize: 16,
    color: "#1c1c1e",
  },
  goalField: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  goalText: {
    fontSize: 16,
    color: "#1c1c1e",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1c1c1e",
  },
  modalContent: {
    padding: 16,
  },
  accountDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  accountDetailLabel: {
    fontSize: 16,
    color: "#6e6e73",
  },
  accountDetailValue: {
    fontSize: 16,
    color: "#1c1c1e",
    fontWeight: "500",
  },
  expandedDetailsContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 12,
    padding: 12,
  },
});

export default Profile;