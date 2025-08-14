import React from "react";
import { Button, View, StyleSheet, SafeAreaView } from "react-native";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  AWS_REGION,
  USER_POOL_ID,
  USER_POOL_CLIENT_ID,
  IDENTITY_POOL_ID,
} from '@env';

import Profile from "./src/Profile";
import Home from "./src/Home";
import Map from "./src/Map";

Amplify.configure({
  "auth": {
    "user_pool_id": USER_POOL_ID,
    "aws_region": AWS_REGION,
    "user_pool_client_id": USER_POOL_CLIENT_ID,
    "identity_pool_id": IDENTITY_POOL_ID,
    "mfa_methods": [],
    "standard_required_attributes": [
      "email"
    ],
    "username_attributes": [
      "email"
    ],
    "user_verification_types": [
      "email"
    ],
    "groups": [],
    "mfa_configuration": "NONE",
    "password_policy": {
      "min_length": 8,
      "require_lowercase": true,
      "require_numbers": true,
      "require_symbols": true,
      "require_uppercase": true
    },
    "unauthenticated_identities_enabled": true
  },
  "version": "1.4"
});

const Tab = createBottomTabNavigator();

const ProfileWithHeader = () => <Profile />;

const TabScreens = () => (
  <SafeAreaView style={styles.container}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: { height: 56 },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, string> = {
            Home: "restaurant-menu",
            Map: "map",
            Profile: "person",
          };
          const name = iconMap[route.name] ?? "circle";
          return <Icon name={name} size={size ?? 24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Map" component={Map} />
      <Tab.Screen name="Profile" component={ProfileWithHeader} />
    </Tab.Navigator>
  </SafeAreaView>
);

const AuthenticatedApp = () => (
  <NavigationContainer>
    <TabScreens />
  </NavigationContainer>
);

const App = () => (
  <Authenticator.Provider>
    <Authenticator>
      <AuthenticatedApp />
    </Authenticator>
  </Authenticator.Provider>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default App;