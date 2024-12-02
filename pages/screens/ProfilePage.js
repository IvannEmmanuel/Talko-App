import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
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
      <Text style={styles.title}>
        {userData.firstname} {userData.lastname}
      </Text>
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
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
    textAlign: "center",
  },
  infoContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 10,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  value: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorText: {
    fontSize: 18,
    color: "#e74c3c",
    marginTop: 20,
  },
});
