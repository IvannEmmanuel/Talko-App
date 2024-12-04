import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Dimensions 
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

const { width } = Dimensions.get('window');

const VisitProfile = ({ route, navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [loading, setLoading] = useState(true);

  const { username } = route.params || {};

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!username) {
        setError("No username provided.");
        setLoading(false);
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
            bio: userData.bio || "No bio available",
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
      setLoading(false);
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

        setIsPending(true);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectRequest = () => {
    setIsRejected(true);
  };

  if (loading) {
    return (
      <LinearGradient 
        colors={['#4A5ACE', '#7B68EE']} 
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient 
        colors={['#4A5ACE', '#7B68EE']} 
        style={styles.container}
      >
        <Text style={styles.errorText}>{error}</Text>
      </LinearGradient>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient 
        colors={['#4A5ACE', '#7B68EE']} 
        style={styles.gradientBackground}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {userProfile && currentUserProfile ? (
          <View style={styles.profileContainer}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: userProfile.profilePictureURL }} 
                style={styles.profilePicture} 
              />
            </View>

            <Text style={styles.nameText}>
              {userProfile.firstname} {userProfile.lastname}
            </Text>
            <Text style={styles.usernameText}>{userProfile.username}</Text>

            <View style={styles.profileDetailsContainer}>
              <View style={styles.detailBox}>
                <Ionicons name="mail" size={20} color="#4A5ACE" />
                <Text style={styles.detailText}>{userProfile.email}</Text>
              </View>
              <View style={styles.detailBox}>
                <Ionicons name="calendar" size={20} color="#4A5ACE" />
                <Text style={styles.detailText}>{userProfile.birthday}</Text>
              </View>
            </View>

            <Text style={styles.bioText}>{userProfile.bio}</Text>

            {/* Friend Status and Actions */}
            {isFriend ? (
              <View style={styles.statusContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
                <Text style={styles.friendStatus}>Friends</Text>
              </View>
            ) : isPending ? (
              <View style={styles.statusContainer}>
                <Ionicons name="time" size={24} color="#f39c12" />
                <Text style={styles.friendStatus}>Pending Request</Text>
              </View>
            ) : isRejected ? (
              <View style={styles.statusContainer}>
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
                <Text style={styles.friendStatus}>Request Rejected</Text>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.acceptButton} 
                  onPress={handleAcceptRequest}
                >
                  <Ionicons name="person-add" size={18} color="white" />
                  <Text style={styles.buttonText}>Add Friend</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.acceptButton, styles.rejectButton]} 
                  onPress={handleRejectRequest}
                >
                  <Ionicons name="close" size={18} color="white" />
                  <Text style={styles.buttonText}>Ignore</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.errorText}>Loading profiles...</Text>
        )}
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  profileContainer: {
    width: width * 0.9,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#4A5ACE',
    overflow: 'hidden',
    marginBottom: 15,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A5ACE',
    marginBottom: 5,
  },
  usernameText: {
    fontSize: 16,
    color: '#7B68EE',
    marginBottom: 15,
  },
  profileDetailsContainer: {
    width: '100%',
    marginVertical: 15,
  },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F0F4FF',
    padding: 10,
    borderRadius: 10,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#34495e',
  },
  bioText: {
    fontSize: 16,
    color: '#7B68EE',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  acceptButton: {
    flexDirection: 'row',
    backgroundColor: '#4A5ACE',
    padding: 12,
    borderRadius: 25,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  friendStatus: {
    fontSize: 18,
    color: '#2ecc71',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default VisitProfile;