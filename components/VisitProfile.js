import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Button, Image, TouchableOpacity } from "react-native";
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
  const [isFriend, setIsFriend] = useState(false);

  const { username } = route.params || {};

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!username) {
        setError("No username provided.");
        return;
      }

      try {
        const userQuerySnapshot = await getDocs(
          query(collection(db, "userInformation"), where("username", "==", username))
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
            profilePictureURL: userData.profilePictureURL,
          });

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
                profilePictureURL: currentUserData.profilePictureURL,
              });

              // Check if they are already friends
              const friends = currentUserData.friends || [];
              setIsFriend(friends.some(friend => friend.username === userData.username));
            } else {
              setError("Current user profile not found.");
            }
          } else {
            setError("No user is currently authenticated.");
          }
        } else {
          setError("User not found!");
        }
      } catch (error) {
        setError("Error fetching profiles.");
      }
    };

    fetchProfiles();
  }, [username]);

  const handleAcceptRequest = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser && userProfile && userProfile.email) {
        const currentUserDocRef = doc(db, "userInformation", currentUser.uid);
        const recipientDocRef = doc(db, "userInformation", userProfile.id);

        const currentUserFriendData = {
          username: currentUserProfile.username,
          email: currentUserProfile.email,
          profilePictureURL: currentUserProfile.profilePictureURL,
        };

        const recipientFriendData = {
          username: userProfile.username,
          email: userProfile.email,
          profilePictureURL: userProfile.profilePictureURL,
        };

        // Add to both users' friends list
        await updateDoc(currentUserDocRef, { friends: arrayUnion(recipientFriendData) });
        await updateDoc(recipientDocRef, { friends: arrayUnion(currentUserFriendData) });

        setIsFriend(true);
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
          <Image source={{ uri: userProfile.profilePictureURL }} style={styles.profilePicture} />
          <Text style={styles.profileDetails}>
            {userProfile.firstname} {userProfile.lastname}
          </Text>
          <Text style={styles.profileDetails}>Birthday: {userProfile.birthday}</Text>
          <Text style={styles.profileDetails}>Email: {userProfile.email}</Text>
          <Text style={styles.profileDetails}>Username: {userProfile.username}</Text>

          {/* If they are already friends, show "Friends" */}
          {isFriend ? (
            <Text style={styles.friendStatus}>You are now friends!</Text>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRequest}>
                <Text style={styles.buttonText}>Accept Friend Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptButton, styles.rejectButton]}
                onPress={() => console.log("Friend request rejected")}
              >
                <Text style={styles.buttonText}>Reject Friend Request</Text>
              </TouchableOpacity>
            </View>
          )}
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
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profileDetails: {
    fontSize: 16,
    color: "#34495e",
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 8,
    width: "80%",
    marginBottom: 10,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  friendStatus: {
    fontSize: 18,
    color: "#2ecc71",
    fontWeight: "bold",
    marginTop: 20,
  },
});

export default VisitProfile;
