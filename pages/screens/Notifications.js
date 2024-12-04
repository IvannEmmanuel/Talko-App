import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

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

  const NotificationItem = ({ item }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color="#4A5ACE" />
        </View>
        <View style={styles.notificationDetails}>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTimestamp}>
            {new Date(item.timestamp.seconds * 1000).toLocaleString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleViewProfile(item.message)}
      >
        <Text style={styles.actionButtonText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A5ACE" style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
            </View>
          )}
          renderItem={({ item }) => <NotificationItem item={item} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 50,
    zIndex: 1,
  },
  loader: {
    marginTop: 50,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyStateText: {
    color: "#999",
    fontSize: 18,
    marginTop: 20,
  },
  notificationCard: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 20, // Increase padding to allow more space
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: width - 40, // Ensure the width is constrained for readability
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",  // Allow wrapping of content to avoid overlap
  },  
  notificationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationDetails: {
    flex: 1,
    justifyContent: "center",
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    paddingBottom: 5,
    lineHeight: 22, // Increase line height for better spacing
    flexWrap: "wrap", // Allow the text to wrap if it's too long
  },
  notificationTimestamp: {
    color: "#666",
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: "#4A5ACE",
    paddingVertical: 8,
    top: height * 0.01,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default Notifications;