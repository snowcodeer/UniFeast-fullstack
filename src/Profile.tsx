// src/Profile.tsx
import { useState, useEffect } from "react";
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { userService, UserProfile } from "./services/SimpleUserService";

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
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
        {submitLabel === "Create" ? "Create Profile" : "Edit Profile"}
      </Text>

      <Text style={{ marginBottom: 8 }}>Name:</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 16 }}
        value={form.user_name}
        onChangeText={(text) => setForm(prev => ({ ...prev, user_name: text }))}
        placeholder="Enter your name"
      />

      <Text style={{ marginBottom: 8 }}>Dietary Preferences:</Text>
      {DIETARY_OPTIONS.map(option => (
        <TouchableOpacity
          key={option}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 12,
            marginBottom: 4,
            backgroundColor: form.dietary_preferences.includes(option) ? "#e3f2fd" : "#f5f5f5",
            borderRadius: 4,
          }}
          onPress={() => toggleDietaryPreference(option)}
        >
          <Text style={{ flex: 1 }}>{option}</Text>
          <Text>{form.dietary_preferences.includes(option) ? "✓" : ""}</Text>
        </TouchableOpacity>
      ))}

      <Text style={{ marginTop: 16, marginBottom: 8 }}>Period Plan:</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 16 }}
        value={form.period_plan}
        onChangeText={(text) => setForm(prev => ({ ...prev, period_plan: text }))}
        placeholder="Enter period plan"
      />

      <Text style={{ marginTop: 16, marginBottom: 8, fontWeight: "bold" }}>Allergens:</Text>
      {ALL_ALLERGENS.map(allergen => (
        <View key={allergen.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Switch
            value={!!form[allergen.key]}
            onValueChange={() => toggleAllergen(allergen.key)}
          />
          <Text style={{ marginLeft: 8 }}>{allergen.label}</Text>
        </View>
      ))}

      <View style={{ marginTop: 20 }}>
        <Button title={submitLabel} onPress={() => onSubmit(form)} />
        {onCancel && (
          <View style={{ marginTop: 8 }}>
            <Button title="Cancel" onPress={onCancel} color="gray" />
          </View>
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
        period_plan: form.period_plan,
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
        period_plan: form.period_plan,
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red", marginBottom: 16 }}>Error: {error}</Text>
        <Button title="Retry" onPress={fetchProfile} />
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
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
        Profile
      </Text>

      <Text style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: "bold" }}>Email:</Text> {profile.email || "N/A"}
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: "bold" }}>Name:</Text> {profile.user_name || "N/A"}
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: "bold" }}>Dietary Preferences:</Text>{" "}
        {Array.isArray(profile.dietary_preferences) && profile.dietary_preferences.length > 0
          ? profile.dietary_preferences.join(", ")
          : "None"}
      </Text>
      
      <Text style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: "bold" }}>Period Plan:</Text> {profile.period_plan || "N/A"}
      </Text>
      
      <Text style={{ marginTop: 12, marginBottom: 8, fontWeight: "bold" }}>
        Allergies:
      </Text>
      <Text style={{ marginBottom: 16 }}>
        {[
          ...getMainAllergens().filter((a: any) => (profile as any)[a.key]).map((a: any) => a.label),
          ...(Array.isArray(profile.other_allergies) ? profile.other_allergies : [])
        ].join(", ") || "None"}
      </Text>

      <Button title="Edit Profile" onPress={() => setEditing(true)} />
    </ScrollView>
  );
};

export default Profile;