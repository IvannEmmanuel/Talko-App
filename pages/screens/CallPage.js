import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const WhiteUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    if (searchQuery.trim() === "") {
      setUsers([]);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No logged-in user!");
      return;
    }

    setLoading(true);
    try {
      const currentUserDocRef = doc(db, "userInformation", currentUser.uid);
      const currentUserDoc = await getDoc(currentUserDocRef);
      const currentUserData = currentUserDoc.exists()
        ? currentUserDoc.data()
        : null;

      if (!currentUserData) {
        console.error("Logged-in user data not found!");
        setLoading(false);
        return;
      }

      const currentUsername = currentUserData.username.toLowerCase();

      const userQuery = query(
        collection(db, "userInformation"),
        where("username", ">=", searchQuery),
        where("username", "<=", searchQuery + "\uf8ff")
      );

      const querySnapshot = await getDocs(userQuery);
      const userList = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((user) => {
          const isFullMatch =
            user.username.toLowerCase() === searchQuery.toLowerCase();
          return isFullMatch && user.username.toLowerCase() !== currentUsername;
        });

      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFriend = async (recipientUsername) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return false; // If no user is logged in, return false
      }

      const currentUserDocRef = doc(db, "userInformation", currentUser.uid);
      const currentUserDoc = await getDoc(currentUserDocRef);

      if (!currentUserDoc.exists()) {
        console.error("Current user data not found!");
        return false;
      }

      const currentUserData = currentUserDoc.data();
      const currentUserFriends = currentUserData.friends || [];

      // Check if the recipient is already in the friends list
      return currentUserFriends.some(
        (friend) => friend.username === recipientUsername
      );
    } catch (error) {
      console.error("Error checking if user is a friend:", error);
      return false;
    }
  };

  const handleAddFriend = async (recipientUsername) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const currentUserDocRef = doc(db, "userInformation", currentUser.uid);

        const userDoc = await getDoc(currentUserDocRef);
        if (userDoc.exists()) {
          const currentUserData = userDoc.data();
          const currentUserUsername = currentUserData.username;

          // Send friend request to the recipient
          await updateDoc(currentUserDocRef, {
            friendRequests: arrayUnion({
              username: recipientUsername,
              status: "pending",
            }),
          });

          const recipientQuery = query(
            collection(db, "userInformation"),
            where("username", "==", recipientUsername)
          );

          const recipientQuerySnapshot = await getDocs(recipientQuery);
          if (!recipientQuerySnapshot.empty) {
            const recipientDoc = recipientQuerySnapshot.docs[0];
            const recipientDocRef = doc(db, "userInformation", recipientDoc.id);

            await updateDoc(recipientDocRef, {
              notifications: arrayUnion({
                message: `${currentUserUsername} wants to add you as a friend.`,
                timestamp: new Date(),
              }),
            });

            console.log(`Friend request sent to ${recipientUsername}`);
          } else {
            console.log("Recipient user not found!");
          }
        } else {
          console.log("User document doesn't exist!");
        }
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connections</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search username"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A5ACE" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? "No users found" : "Search for connections"}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Image
                    source={{ uri: item.profilePictureURL }}
                    style={styles.profilePicture}
                  />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.username}>{item.username}</Text>
                  <Text style={styles.fullName}>
                    {item.firstname} {item.lastname}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  checkIfFriend(item.username) && styles.connectedButton,
                ]}
                onPress={async () => {
                  const isFriend = await checkIfFriend(item.username);
                  if (!isFriend) {
                    handleAddFriend(item.username);
                  }
                }}
              >
                <Text style={styles.connectButtonText}>
                  {checkIfFriend(item.username) ? "Friends" : "Add Friend"}
                </Text>
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#4A5ACE",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4A5ACE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  userDetails: {
    justifyContent: "center",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  fullName: {
    color: "#666",
    fontSize: 14,
  },
  connectButton: {
    backgroundColor: "#4A5ACE",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  connectedButton: {
    backgroundColor: "#10AC84",
  },
  connectButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
});

export default WhiteUsersPage;
