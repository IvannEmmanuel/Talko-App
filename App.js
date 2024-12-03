// App.js
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import SignUpPage from "./pages/SignUpPage";
import Chats from "./components/Chats";
import VisitProfile from "./components/VisitProfile";
import FriendList from './components/FriendList';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="SignUp" component={SignUpPage} />
          <Stack.Screen name="Chats" component={Chats} />
          <Stack.Screen name="VisitProfile" component={VisitProfile} />
          <Stack.Screen name="FriendList" component={FriendList} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
