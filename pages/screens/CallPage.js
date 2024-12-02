import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
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

const UsersPage = () => {
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
      return currentUserFriends.some((friend) => friend.username === recipientUsername);
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
      <Text style={styles.header}>Find Users</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by username"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.searchButton} onPress={fetchUsers}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <View>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.userInfo}>
                  Name: {item.firstname} {item.lastname}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={async () => {
                  const isFriend = await checkIfFriend(item.username);
                  if (!isFriend) {
                    handleAddFriend(item.username);
                  }
                }}
              >
                <Text style={styles.addButtonText}>
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
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2c3e50",
    textAlign: "center",
  },
  searchInput: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingLeft: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  searchButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34495e",
  },
  userInfo: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  addButton: {
    backgroundColor: "#2ecc71",
    padding: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default UsersPage;
