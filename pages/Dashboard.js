import { StyleSheet } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from "@expo/vector-icons";

//Screens
import HomePage from './screens/HomePage';
import OrderPage from './screens/OrderPage';
import Profile from './screens/Profile';
import Settings from './screens/Settings';

const homeName = 'Home';
const orderName = 'Order';
const customerName = 'Profile';
const settingsName = 'Settings';

const Tab = createBottomTabNavigator();

const Dashboard = () => {
    return (
      <Tab.Navigator
        initialRouteName={homeName}
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let rn = route.name;
  
            if (rn === homeName) {
              iconName = focused ? 'home' : 'home-outline';
            } else if (rn === orderName) {
              iconName = focused ? 'cart' : 'cart-outline';
            } else if (rn === customerName) {
              iconName = focused ? 'person' : 'person-outline';
            } else if (rn === settingsName) {
              iconName = focused ? 'settings' : 'settings-outline';
            }
  
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#3498DB",
                tabBarInactiveTintColor: "black",
                tabBarStyle: { paddingBottom: 10, height: 60 },
        })}
      >
        <Tab.Screen name={homeName} component={HomePage} />
        <Tab.Screen name={orderName} component={OrderPage} />
        <Tab.Screen name={customerName} component={Profile} />
        <Tab.Screen name={settingsName} component={Settings} />
      </Tab.Navigator>
    );
  };

export default Dashboard

const styles = StyleSheet.create({})