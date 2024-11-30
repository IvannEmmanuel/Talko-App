import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebaseConfig'; // Import Firebase auth and db
import { doc, getDoc } from 'firebase/firestore';

const ChatPage = () => {
  const navigation = useNavigation();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userEmail = currentUser.email.replace('.', '_'); // Replace dots for Firestore-friendly keys
        const friendsDocRef = doc(db, 'friends', userEmail);

        try {
          const docSnap = await getDoc(friendsDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const friendsList = data.friends || []; // Default to empty array if no friends field
            setFriends(friendsList.map((name, index) => ({ id: index.toString(), name })));
          } else {
            console.log('No friends list found for this user.');
            setFriends([]);
          }
        } catch (error) {
          console.error('Error fetching friends:', error);
        }
      }
      setLoading(false);
    };

    fetchFriends();
  }, []);

  const handleChat = (friendName) => {
    navigation.navigate('Chats', { friendName }); // Pass the friend's name as a parameter
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Friends</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : friends.length > 0 ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.friendItem}
              onPress={() => handleChat(item.name)} // Pass the specific friend's name
            >
              <Text style={styles.friendName}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.friendList}
        />
      ) : (
        <Text>No friends found.</Text>
      )}
    </View>
  );
};

export default ChatPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'center',
    marginBottom: 16,
  },
  friendList: {
    paddingBottom: 16,
  },
  friendItem: {
    padding: 15,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    marginVertical: 8,
  },
  friendName: {
    fontSize: 18,
    color: '#333',
  },
});
