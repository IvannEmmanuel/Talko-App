import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

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
      <Image source={{ uri: item.profilePictureURL }} style={styles.profilePicture} />
      <View style={styles.friendDetails}>
        <Text style={styles.friendName}>{item.username}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
        {item.gender && (
          <Text style={styles.friendGender}>
            Gender: {item.gender}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Friends</Text>
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
    backgroundColor: "#f9f9f9",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    alignSelf: "center",
    marginBottom: 16,
  },
  friendList: {
    paddingBottom: 16,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#e6f7ff",
    borderRadius: 8,
    marginVertical: 8,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    color: "#333",
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
