// src/Profile.tsx
import { useState, useEffect } from "react";
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
} from "react-native";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { userService, UserProfile } from "./services/ProfileService";
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
  milk_allergy: false,
  eggs_allergy: false,
  peanuts_allergy: false,
  tree_nuts_allergy: false,
  shellfish_allergy: false,
  other_allergies: [] as string[],
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

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Nutrition Plan</Text>
          <TextInput
            style={styles.textInput}
            value={form.period_plan}
            onChangeText={(text) => setForm(prev => ({ ...prev, period_plan: text }))}
            placeholder="Enter nutrition plan"
            placeholderTextColor="#6e6e73"
          />
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

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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
      dietary_preferences: Array.isArray(profile.dietary_preferences) ? profile.dietary_preferences : [],
      period_plan: profile.period_plan || "",
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
        dietary_preferences: form.dietary_preferences,
        nutrition_plan: form.nutrition_plan,
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
        dietary_preferences: form.dietary_preferences,
        nutrition_plan: form.nutrition_plan,
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
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.user_name ? profile.user_name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
          <Text style={styles.userName}>{profile.user_name || "Anonymous"}</Text>
          <Text style={styles.userEmail}>{profile.email || "No email"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="restaurant" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
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
          <MaterialIcons name="warning" size={24} color="#007AFF" />
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
            <Text style={styles.emptyText}>No allergies specified</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="calendar-today" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Nutrition Plan</Text>
        </View>
        <View style={styles.sectionContent}>
          <Text style={styles.planText}>{profile.period_plan || "No plan selected"}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => setEditing(true)}
        >
          <MaterialIcons name="edit" size={20} color="white" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

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
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  allergenLabel: {
    fontSize: 16,
    color: "#1c1c1e",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: "white",
    fontWeight: "600",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 4,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1c1c1e",
    marginLeft: 8,
  },
  sectionContent: {
    marginTop: 8,
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
});

export default Profile;