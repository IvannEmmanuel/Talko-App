import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

const { height, width } = Dimensions.get("window");

const ChatPage = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const handleChat = (friend) => {
    console.log("Navigating to chat with:", friend); // Log the friend object
    navigation.navigate("Chats", { friend });
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "userInformation", currentUser.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const friendsList = data.friends || [];

          const sortedFriends = friendsList.sort((a, b) =>
            a.username.localeCompare(b.username)
          );

          setFriends(sortedFriends);
          setLoading(false);
        } else {
          console.log("No document found for this user.");
          setFriends([]);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to friends updates:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => handleChat({ ...item, id: item.id || item.email })}>
      <View style={styles.header}>
        <Image source={{ uri: item.profilePictureURL }} style={styles.profilePicture} />
      </View>
      <View style={styles.friendDetails}>
        <Text style={styles.friendName}>{item.username}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Image source={require('../../images/TALKO.png')} style={styles.talkoPic} />
      {loading ? (
        <Text style={styles.loadingText}>Loading friends...</Text>
      ) : friends.length > 0 ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id || item.email}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.friendList}
        />
      ) : (
        <Text style={styles.noFriendsText}>No friends found.</Text>
      )}
    </View>
  );
};

export default ChatPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2", // Lighter background for a cleaner look
    padding: 16,
  },
  talkoPic:{
    height: height * 0.2,
    width: height * 0.2,
    alignSelf: 'center'
  },
  friendList: {
    paddingBottom: 16,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#ffffff", // White background for friend items
    borderRadius: 10, // Rounded corners for a smoother look
    shadowColor: "#000", // Shadow for elevation effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // Adds elevation for Android
    marginVertical: 8,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#d1d1d1", // Light border around profile picture
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    color: "#333", // Dark text for readability
    fontWeight: "bold",
  },
  friendEmail: {
    fontSize: 14,
    color: "#555",
  },
  friendGender: {
    fontSize: 12,
    color: "#777",
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  noFriendsText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
});
