import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();

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

          // Sort friends alphabetically and filter based on search
          const sortedAndFilteredFriends = friendsList
            .sort((a, b) => a.username.localeCompare(b.username))
            .filter(friend => 
              friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
              friend.email.toLowerCase().includes(searchQuery.toLowerCase())
            );

          setFriends(sortedAndFilteredFriends);
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
  }, [searchQuery]);

  const handleChat = (friend) => {
    navigation.navigate("Chats", { friend });
  };

  const renderFriendItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.friendItem}
        onPress={() => handleChat(item)}
      >
        <View style={styles.friendItemContent}>
          <Image
            source={{ uri: item.profilePictureURL }}
            style={styles.profilePicture}
          />
          <View style={styles.friendDetails}>
            <Text style={styles.friendName} numberOfLines={1}>
              {item.username}
            </Text>
            <Text style={styles.friendEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <Ionicons 
            name="chatbubble-ellipses-outline" 
            size={24} 
            color="#007bff" 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#007bff', '#00b4db']}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Image
          source={require("../images/TALKO.png")}
          style={styles.talkoPic}
          resizeMode="contain"
        />
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color="#888" 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      ) : friends.length > 0 ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id || item.email}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.friendList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContent}>
          <Text style={styles.noFriendsText}>
            {searchQuery 
              ? "No friends match your search" 
              : "No friends found. Start connecting!"}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  headerGradient: {
    paddingBottom: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 10,
  },
  talkoPic: {
    height: height * 0.1,
    width: height * 0.1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  friendList: {
    paddingHorizontal: 15,
  },
  friendItem: {
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  friendItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#e1e1e1',
  },
  friendDetails: {
    flex: 1,
    marginRight: 10,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  noFriendsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FriendsList;