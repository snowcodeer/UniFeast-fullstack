import React from "react";
import { Button, View, StyleSheet, SafeAreaView, Text } from "react-native";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Profile from "./src/Profile";
import Home from "./src/Home";
import Map from "./src/Map";

Amplify.configure({
  "auth": {
    "user_pool_id": "YOUR_USER_POOL_ID_HERE",
    "aws_region": "eu-west-2",
    "user_pool_client_id": "YOUR_USER_POOL_CLIENT_ID_HERE",
    "identity_pool_id": "YOUR_IDENTITY_POOL_ID_HERE",
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

const Deals = () => <View style={styles.center}><Button title="Deals Placeholder" onPress={() => {}} /></View>;

const Tab = createBottomTabNavigator();

const ProfileWithHeader = () => <Profile />;

const TabScreens = () => (
  <SafeAreaView style={styles.container}>
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Map" component={Map} />
      <Tab.Screen name="Deals" component={Deals} />
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