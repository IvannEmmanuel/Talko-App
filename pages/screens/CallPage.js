import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
import BottomSheet from '@gorhom/bottom-sheet';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const EnhancedUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);

  const fetchUsers = useCallback(async () => {
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
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
          profilePicture: doc.data().profilePictureURL || require('../../images/default-avatar.png')
        }))
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
  }, [searchQuery]);

  const checkIfFriend = useCallback(async (recipientUsername) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const currentUserDocRef = doc(db, "userInformation", currentUser.uid);
      const currentUserDoc = await getDoc(currentUserDocRef);

      if (!currentUserDoc.exists()) {
        console.error("Current user data not found!");
        return false;
      }

      const currentUserData = currentUserDoc.data();
      const currentUserFriends = currentUserData.friends || [];

      return currentUserFriends.some((friend) => friend.username === recipientUsername);
    } catch (error) {
      console.error("Error checking if user is a friend:", error);
      return false;
    }
  }, []);

  const handleAddFriend = useCallback(async (recipientUsername) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const currentUserDocRef = doc(db, "userInformation", currentUser.uid);

        const userDoc = await getDoc(currentUserDocRef);
        if (userDoc.exists()) {
          const currentUserData = userDoc.data();
          const currentUserUsername = currentUserData.username;

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
          }
        }
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  }, []);

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setBottomSheetIndex(0);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const renderUserItem = async ({ item }) => (
    <Animated.View 
      entering={FadeIn} 
      exiting={FadeOut} 
      style={styles.userItemContainer}
    >
      <TouchableOpacity 
        style={styles.userItem} 
        onPress={() => openUserDetails(item)}
      >
        <Image 
          source={item.profilePicture} 
          style={styles.profilePicture} 
        />
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userInfo}>
            {item.firstname} {item.lastname}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={async () => {
            const isFriend = await checkIfFriend(item.username);
            if (!isFriend) {
              await handleAddFriend(item.username);
            }
          }}
        >
          <Ionicons 
            name={await checkIfFriend(item.username) ? "person-check" : "person-add"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  const UserDetailsBottomSheet = () => (
    <BottomSheet
      index={bottomSheetIndex}
      snapPoints={['50%', '80%']}
      onClose={() => setBottomSheetIndex(-1)}
    >
      {selectedUser && (
        <View style={styles.bottomSheetContent}>
          <Image 
            source={selectedUser.profilePicture} 
            style={styles.largeProfilePicture} 
          />
          <Text style={styles.bottomSheetUsername}>
            {selectedUser.username}
          </Text>
          <Text style={styles.bottomSheetUserInfo}>
            {selectedUser.firstname} {selectedUser.lastname}
          </Text>
          <TouchableOpacity
            style={styles.sendMessageButton}
            onPress={() => {
              // Navigate to chat with this user
              setBottomSheetIndex(-1);
            }}
          >
            <Ionicons name="chatbubble" size={24} color="white" />
            <Text style={styles.sendMessageButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );

  return (
    <LinearGradient 
      colors={['#f0f4f8', '#e0e7f0']} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Friends</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color="#999" 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')} 
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator 
            size="large" 
            color="#007BFF" 
            style={styles.loader} 
          />
        ) : users.length > 0 ? (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.userList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="group-add" 
              size={100} 
              color="#ccc" 
            />
            <Text style={styles.emptyStateText}>
              Search for users to connect with
            </Text>
          </View>
        )}

        <UserDetailsBottomSheet />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  searchIcon: {
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  clearButton: {
    paddingHorizontal: 15,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userList: {
    paddingBottom: 20,
  },
  userItemContainer: {
    marginVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 25,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 20,
    fontSize: 18,
    color: '#999',
  },
  bottomSheetContent: {
    alignItems: 'center',
    padding: 20,
  },
  largeProfilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  bottomSheetUsername: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bottomSheetUserInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  sendMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  sendMessageButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});

export default EnhancedUsersPage;