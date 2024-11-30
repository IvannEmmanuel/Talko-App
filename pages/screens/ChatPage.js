import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { auth, db } from '../../firebaseConfig'; // Update this path as per your project structure
import { doc, getDoc } from 'firebase/firestore';

const ChatPage = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      // Assume the logged-in user's ID is being used to fetch their document
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userDocRef = doc(db, 'userInformation', currentUser.uid); // Adjust 'uid' as needed

        try {
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const friendsList = data.friends || []; // Default to an empty array if 'friends' is missing
            setFriends(friendsList); // Populate the friends state
          } else {
            console.log('No document found for this user.');
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Friends</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : friends.length > 0 ? (
        <FlatList
          data={friends}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.friendItem}>
              <Image
                source={{ uri: item.profilePictureURL }}
                style={styles.profilePicture}
              />
              <View>
                <Text style={styles.friendName}>{item.username}</Text>
                <Text style={styles.friendEmail}>{item.email}</Text>
                <Text style={styles.friendGender}>Gender: {item.gender}</Text>
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    marginVertical: 8,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendName: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  friendEmail: {
    fontSize: 14,
    color: '#555',
  },
  friendGender: {
    fontSize: 12,
    color: '#777',
  },
});
