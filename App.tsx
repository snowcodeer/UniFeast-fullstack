import React from "react";
import { Button, View, StyleSheet, SafeAreaView, Text } from "react-native";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import outputs from "./amplify_outputs.json";
import Profile from "./src/Profile";
import Menu from "./src/Menu";
import Map from "./src/Map";
const Deals = () => <View style={styles.center}><Button title="Deals Placeholder" onPress={() => {}} /></View>;

Amplify.configure(outputs);

const Tab = createBottomTabNavigator();

// Profile component with header logout button
const ProfileWithHeader = () => {
  const { signOut } = useAuthenticator();
  
  React.useLayoutEffect(() => {
    // This will be handled by the navigation options
  }, []);

  return <Profile />;
};

const TabScreens = () => (
  <SafeAreaView style={styles.container}>
    <Tab.Navigator>
      <Tab.Screen name="Menu" component={Menu} />
      <Tab.Screen name="Map" component={Map} />
      <Tab.Screen name="Deals" component={Deals} />
      <Tab.Screen 
        name="Profile" 
        component={ProfileWithHeader}
        options={({ navigation }) => ({
          headerRight: () => {
            const { signOut } = useAuthenticator();
            return (
              <Button
                onPress={signOut}
                title="Logout"
                color="#007AFF"
              />
            );
          },
        })}
      />
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