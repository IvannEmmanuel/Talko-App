import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "userInformation", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            console.log("No such document!");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const ProfileStatCard = ({ icon, label, value }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#3498db" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderProfileContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      );
    }

    if (!userData) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#e74c3c" />
          <Text style={styles.errorText}>No user data found.</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#3498db', '#2980b9']}
          style={styles.headerBackground}
        >
          <View style={styles.profileImageContainer}>
            {userData.profilePictureURL ? (
              <Image
                source={{ uri: userData.profilePictureURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>
                  {userData.firstname[0]}{userData.lastname[0]}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>
            {userData.firstname} {userData.lastname}
          </Text>
          <Text style={styles.profileUsername}>@{userData.username}</Text>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <ProfileStatCard 
            icon="people-outline" 
            label="Friends" 
            value={userData.friends?.length || 0} 
          />
          <ProfileStatCard 
            icon="chatbubble-outline" 
            label="Chats" 
            value={userData.chatCount || 0} 
          />
          <ProfileStatCard 
            icon="calendar-outline" 
            label="Joined" 
            value={userData.joinedDate || 'N/A'} 
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.detailItem}>
            <Ionicons name="mail-outline" size={20} color="#3498db" />
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{userData.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color="#3498db" />
            <Text style={styles.detailLabel}>Birthday</Text>
            <Text style={styles.detailValue}>{userData.birthday}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="transgender-outline" size={20} color="#3498db" />
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{userData.gender}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.friendsButton}
          onPress={() => navigation.navigate('FriendList', { userData })}
        >
          <Ionicons name="people-outline" size={20} color="white" />
          <Text style={styles.friendsButtonText}>See All Friends</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {renderProfileContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerBackground: {
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: 'white',
    marginTop: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 50,
    color: 'white',
    fontWeight: 'bold',
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3498db',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
    marginTop: 10,
  },
  profileUsername: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  statCard: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  detailsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  detailLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  friendsButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ProfilePage;