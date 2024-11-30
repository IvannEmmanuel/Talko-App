import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Button,
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
import { db, auth } from "../../firebaseConfig"; // Your Firebase configuration

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    if (searchQuery.trim() === "") {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      // Firestore query to search by username
      const userQuery = query(
        collection(db, "userInformation"),
        where("username", ">=", searchQuery),
        where("username", "<=", searchQuery + "\uf8ff") // This ensures case-insensitive search
      );

      const querySnapshot = await getDocs(userQuery);
      const userList = querySnapshot.docs.map((doc) => doc.data()); // Extract user data from Firestore
      setUsers(userList); // Update the state with the search results
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (recipientUsername) => {
    try {
      const currentUser = auth.currentUser; // Get the logged-in user
      if (currentUser) {
        // Reference to the current user's document in "userInformation"
        const currentUserDocRef = doc(db, "userInformation", currentUser.uid);

        // Fetch the current user data to check if they already have a friendRequests array
        const userDoc = await getDoc(currentUserDocRef);
        if (userDoc.exists()) {
          // Fetch the current user's username from Firestore
          const currentUserData = userDoc.data();
          const currentUserUsername = currentUserData.username; // Get username from Firestore

          // Append a new friend request in the friendRequests array of the current user's document
          await updateDoc(currentUserDocRef, {
            friendRequests: arrayUnion({
              username: recipientUsername,
              status: "pending",
            }),
          });

          // Query to find the recipient document based on the username field
          const recipientQuery = query(
            collection(db, "userInformation"),
            where("username", "==", recipientUsername)
          );

          const recipientQuerySnapshot = await getDocs(recipientQuery);
          if (!recipientQuerySnapshot.empty) {
            const recipientDoc = recipientQuerySnapshot.docs[0]; // Get the first match
            const recipientDocRef = doc(db, "userInformation", recipientDoc.id); // Use recipient's document ID
            // Add a notification for the recipient about the friend request
            await updateDoc(recipientDocRef, {
              notifications: arrayUnion({
                message: `${currentUserUsername} wants to add you as a friend.`, // Use currentUserUsername here
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

  // useEffect hook to fetch users when the searchQuery changes
  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by username"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Search Button */}
      <Button title="Search" onPress={fetchUsers} />

      {/* Display users list */}
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.userInfo}>
                Name: {item.firstname} {item.lastname}
              </Text>
              <TouchableOpacity onPress={() => handleAddFriend(item.username)}>
                <Text style={styles.addButton}>ADD FRIEND</Text>
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
    padding: 10,
  },
  searchInput: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
  },
  userItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    fontSize: 14,
    color: "#777",
  },
  addButton: {
    fontSize: 16,
    color: "#3498db",
    textDecorationLine: "underline",
  },
});

export default UsersPage;
