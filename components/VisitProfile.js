import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Button, Image } from "react-native";
import { db, auth } from "../firebaseConfig";
import {
  getDocs,
  query,
  collection,
  where,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

const VisitProfile = ({ route }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [error, setError] = useState(null);

  const { username } = route.params || {};

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!username) {
        setError("No username provided.");
        return;
      }

      try {
        // Fetch recipient user profile
        const userQuerySnapshot = await getDocs(
          query(
            collection(db, "userInformation"),
            where("username", "==", username)
          )
        );

        if (!userQuerySnapshot.empty) {
          const userDoc = userQuerySnapshot.docs[0];
          const userData = userDoc.data();

          setUserProfile({
            username: userData.username,
            firstname: userData.firstname,
            lastname: userData.lastname,
            birthday: userData.birthday,
            email: userData.email,
            id: userDoc.id,
            profilePictureURL: userData.profilePictureURL, // Store the profile picture URL
          });

          // Fetch current user's profile
          const currentUser = auth.currentUser;
          if (currentUser) {
            const currentUserDocRef = doc(db, "userInformation", currentUser.uid);
            const currentUserDocSnapshot = await getDoc(currentUserDocRef);
            
            if (currentUserDocSnapshot.exists()) {
              const currentUserData = currentUserDocSnapshot.data();
              setCurrentUserProfile({
                username: currentUserData.username,
                firstname: currentUserData.firstname,
                lastname: currentUserData.lastname,
                email: currentUserData.email,
                id: currentUser.uid,
                profilePictureURL: currentUserData.profilePictureURL, // Store the profile picture URL
              });
            } else {
              console.log("Current user document not found.");
              setError("Current user profile not found.");
            }
          } else {
            console.log("No current user authenticated.");
            setError("No user is currently authenticated.");
          }
        } else {
          setError("User not found!");
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
        setError("Error fetching profiles.");
      }
    };

    fetchProfiles();
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
          username: currentUserProfile.username,
          email: currentUserProfile.email,
          profilePictureURL: currentUserProfile.profilePictureURL, // Include profile picture URL
        };

        const recipientFriendData = {
          username: userProfile.username,
          email: userProfile.email,
          profilePictureURL: userProfile.profilePictureURL, // Include profile picture URL
        };

        // Update the current user's friends list
        await updateDoc(currentUserDocRef, {
          friends: arrayUnion(recipientFriendData),
        });

        // Update the recipient's friends list
        await updateDoc(recipientDocRef, {
          friends: arrayUnion(currentUserFriendData),
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
      {userProfile && currentUserProfile ? (
        <>
          <Text style={styles.header}>Profile of {userProfile.username}</Text>
          <Image
            source={{ uri: userProfile.profilePictureURL }}
            style={styles.profilePicture}
          />
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
        <Text>Loading profiles...</Text>
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
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
});

export default VisitProfile;