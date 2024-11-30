import { StyleSheet } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from "@expo/vector-icons";

// Screens
import ChatPage from './screens/ChatPage';
import CallPage from './screens/CallPage';
import ProfilePage from './screens/ProfilePage';
import Notifications from './screens/Notifications';

const chatName = 'Chat';
const callName = 'Call';
const profileName = 'Profile';
const notificationsName = 'Notifications';

const Tab = createBottomTabNavigator();

const Dashboard = () => {
  return (
    <Tab.Navigator
      initialRouteName={chatName}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let rn = route.name;

          if (rn === chatName) {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (rn === callName) {
            iconName = focused ? 'call' : 'call-outline';
          } else if (rn === profileName) {
            iconName = focused ? 'person' : 'person-outline';
          } else if (rn === notificationsName) {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3498DB",
        tabBarInactiveTintColor: "black",
        tabBarStyle: { paddingBottom: 10, height: 60 },
      })}
    >
      <Tab.Screen name={chatName} component={ChatPage} />
      <Tab.Screen name={callName} component={CallPage} />
      <Tab.Screen name={profileName} component={ProfilePage} />
      <Tab.Screen name={notificationsName} component={Notifications}/>
    </Tab.Navigator>
  );
};

export default Dashboard;

const styles = StyleSheet.create({});
