import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../../images/TALKO.png")}
        style={styles.logo}
      />
      <View style={styles.profileImageContainer}>
        {userData.profilePictureURL ? (
          <Image
            source={{ uri: userData.profilePictureURL }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {userData.firstname[0]}
              {userData.lastname[0]}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>{userData.firstname} {userData.lastname}</Text>
      <View style={styles.infoContainer}>
        <InfoItem label="Username" value={userData.username} />
        <InfoItem label="Email" value={userData.email} />
        <InfoItem label="Phone Number" value={userData.phoneNumber || "Not provided"} />
        <InfoItem label="Birthday" value={userData.birthday} />
        <InfoItem label="Gender" value={userData.gender} />
      </View>
    </ScrollView>
  );
};

const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 40,
    color: "#ffffff",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#34495e",
    marginBottom: 20,
  },
  infoContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#34495e",
  },
  value: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
  },
});

