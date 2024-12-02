import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const currentUserDocRef = doc(db, "userInformation", currentUser.uid);

      const unsubscribe = onSnapshot(
        currentUserDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setNotifications(userData.notifications || []);
          } else {
            console.log("User document not found!");
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching notifications:", error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, []);

  const handleViewProfile = (message) => {
    const username = message.split(" ")[0]; // Extract username
    if (username) {
      navigation.navigate("VisitProfile", { username });
    } else {
      console.log("Username not found in message");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationTimestamp}>
                {new Date(item.timestamp.seconds * 1000).toLocaleString()}
              </Text>
              <TouchableOpacity
                style={styles.viewProfileButtonContainer}
                onPress={() => handleViewProfile(item.message)}
              >
                <Text style={styles.viewProfileButton}>View Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#7f8c8d",
    textAlign: "center",
  },
  notificationItem: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  notificationMessage: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 5,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: "#95a5a6",
    marginBottom: 10,
  },
  viewProfileButtonContainer: {
    alignSelf: "flex-start",
    padding: 8,
    backgroundColor: "#3498db",
    borderRadius: 5,
  },
  viewProfileButton: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Notifications;
