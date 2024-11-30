import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig"; // Your Firebase configuration
import { useNavigation } from "@react-navigation/native";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true); // Set loading state to true initially
  const navigation = useNavigation();

  // Fetch and listen to notifications in real-time
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const currentUserDocRef = doc(db, "userInformation", currentUser.uid);

      // Listen for changes in the user's document in real-time
      const unsubscribe = onSnapshot(
        currentUserDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const userNotifications = userData.notifications || [];
            console.log("Real-time user notifications:", userNotifications);
            setNotifications(userNotifications);
            setLoading(false); // Set loading to false when data is fetched
          } else {
            console.log("User document not found!");
            setLoading(false); // Set loading to false if document is not found
          }
        },
        (error) => {
          console.error("Error fetching notifications:", error);
          setLoading(false); // Set loading to false on error
        }
      );

      // Cleanup listener on component unmount
      return () => unsubscribe();
    }
  }, []);

  const handleViewProfile = (message) => {
    // Assuming the message is in the format "@username message text"
    console.log("Navigating to profile of:", message);

    // Extract the username, including the '@' symbol
    const username = message.split(' ')[0];  // Keep '@' with the username
    console.log("Extracted username:", username);

    if (username) {
      navigation.navigate("VisitProfile", { username });  // Pass the username to VisitProfile
    } else {
      console.log("Recipient username is undefined");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>

      {loading ? (
        <Text>Loading...</Text> // Show loading text until data is fetched
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            console.log("Notification item:", item);
            return (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTimestamp}>
                  {new Date(item.timestamp.seconds * 1000).toLocaleString()}
                </Text>
                <TouchableOpacity
                  onPress={() => handleViewProfile(item.message)}
                >
                  <Text style={styles.viewProfileButton}>View Profile</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  notificationItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  notificationMessage: {
    fontSize: 16,
    color: "#333",
  },
  notificationTimestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  viewProfileButton: {
    fontSize: 16,
    color: "#3498db",
    textDecorationLine: "underline",
    marginTop: 10,
  },
});

export default Notifications;
