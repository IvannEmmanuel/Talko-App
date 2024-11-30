import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { db, auth } from "../firebaseConfig"; // Your Firebase configuration
import {
  getDocs,
  query,
  collection,
  where,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

const VisitProfile = ({ route }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  const { username } = route.params || {};

  useEffect(() => {
    if (username) {
      console.log("Username received:", username);
      fetchUserProfile();
    } else {
      setError("No username provided.");
    }
  }, [username]);

  const fetchUserProfile = async () => {
    if (!username) {
      setError("Username is not available.");
      return;
    }

    try {
      console.log("Searching for user with username:", username);
      const userQuerySnapshot = await getDocs(
        query(
          collection(db, "userInformation"),
          where("username", "==", username) // Ensure 'username' matches Firestore field
        )
      );

      if (!userQuerySnapshot.empty) {
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();

        console.log("Fetched user data:", userData); // Verify the data structure

        setUserProfile({
          username: userData.username,
          firstname: userData.firstname,
          lastname: userData.lastname,
          birthday: userData.birthday,
          email: userData.email, // Ensure 'email' is included
          id: userDoc.id, // User document ID
        });
      } else {
        console.log("User not found!");
        setError("User not found!");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Error fetching user profile.");
    }
  };

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const handleAcceptRequest = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser && userProfile && userProfile.email) {
        // Reference to the current user's document
        const currentUserDocRef = doc(db, "userInformation", currentUser.uid);

        // Reference to the recipient's document
        const recipientDocRef = doc(db, "userInformation", userProfile.id);

        // Prepare the friend objects
        const currentUserFriendData = {
          username: currentUser.displayName || currentUser.email, // Use username if available, fallback to email
          email: currentUser.email,
        };

        const recipientFriendData = {
          username: userProfile.username,
          email: userProfile.email, // Use email fetched from Firestore
        };

        // Update the current user's friends list
        await updateDoc(currentUserDocRef, {
          friends: arrayUnion(recipientFriendData), // Add the recipient's data as an object
        });

        // Update the recipient's friends list
        await updateDoc(recipientDocRef, {
          friends: arrayUnion(currentUserFriendData), // Add the current user's data as an object
        });

        console.log(
          "Friend request accepted, and both users updated successfully."
        );
      } else {
        console.error(
          "Missing user data. Ensure 'email' field is available for both users."
        );
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userProfile ? (
        <>
          <Text style={styles.header}>Profile of {userProfile.username}</Text>
          <Text>
            Name: {userProfile.firstname} {userProfile.lastname}
          </Text>
          <Text>Birthday: {userProfile.birthday}</Text>
          <Text>Email: {userProfile.email}</Text>
          <Text>Username: {userProfile.username}</Text>
          <Button title="Accept Friend Request" onPress={handleAcceptRequest} />
          <Button
            title="Reject Friend Request"
            onPress={() => console.log("Friend request rejected")}
          />
        </>
      ) : (
        <Text>Loading profile...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default VisitProfile;
