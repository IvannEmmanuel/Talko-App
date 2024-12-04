import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { auth, db } from "../../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { height, width } = Dimensions.get("window");

const EnhancedChatPage = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();

  const handleChat = (friend) => {
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
        } else {
          setFriends([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to friends updates:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendItem = ({ item }) => {
    return (
      <BlurView intensity={30} style={styles.friendItemContainer}>
        <TouchableOpacity
          style={styles.friendItem}
          onPress={() => handleChat({ ...item, id: item.id || item.email })}
        >
          <View style={styles.profileContainer}>
            <Image 
              source={{ uri: item.profilePictureURL }} 
              style={styles.profilePicture} 
            />
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName} numberOfLines={1}>
              {item.username}
            </Text>
            <Text style={styles.friendEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.chatActionButton}
            onPress={() => handleChat({ ...item, id: item.id || item.email })}
          >
            <MaterialIcons 
              name="message" 
              size={24} 
              color={item.isFriend ? "#4CAF50" : "#4A5ACE"} 
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image 
        // source={require('../../images/empty-friends.png')} 
        style={styles.emptyStateImage} 
      />
      <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Connect with people and start chatting!
      </Text>
      <TouchableOpacity 
        style={styles.addFriendsButton}
        onPress={() => navigation.navigate('CallPage')}
      >
        <Text style={styles.addFriendsButtonText}>Add Friends</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient 
      colors={['#f0f4f8', '#e0e7f0']} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <View style={styles.header}>
          <Image 
            source={require("../../images/TALKO.png")} 
            style={styles.talkoPic} 
            resizeMode="contain"
          />
          <TouchableOpacity 
            style={styles.addFriendButton}
            onPress={() => navigation.navigate('CallPage')}
          >
            <Ionicons name="person-add" size={24} color="#4A5ACE" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color="#999" 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchBar}
            placeholder="Search friends by name or email"
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
            style={styles.loadingIndicator} 
          />
        ) : filteredFriends.length > 0 ? (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id || item.email}
            renderItem={renderFriendItem}
            contentContainerStyle={styles.friendList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState />
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  talkoPic: {
    height: height * 0.1,
    width: height * 0.2,
  },
  addFriendButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 25,
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
  searchBar: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  clearButton: {
    paddingHorizontal: 15,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendItemContainer: {
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  profileContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
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
  chatActionButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 10,
    borderRadius: 25,
  },
  friendList: {
    paddingBottom: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateImage: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addFriendsButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFriendsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EnhancedChatPage;