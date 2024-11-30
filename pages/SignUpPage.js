import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dsgmvinyo/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "storing_picture";

const SignUpPage = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthday, setBirthday] = useState(new Date());
  const [gender, setGender] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureURL, setProfilePictureURL] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogin = () => {
    navigation.goBack();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access the media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      setProfilePicture(selectedImage);
      setProfilePictureURL(null); // Reset the Cloudinary URL
    }
  };

  const uploadImage = async () => {
    if (!profilePicture) {
      alert("Please select an image first!");
      return false;
    }

    const formData = new FormData();
    formData.append("file", {
      uri: profilePicture,
      type: "image/jpeg",
      name: "upload.jpg",
    });
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "Profile Picture");

    try {
      setIsUploading(true);
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();
      setIsUploading(false);

      if (data.secure_url) {
        setProfilePictureURL(data.secure_url);
        return true;
      } else {
        alert("Image upload failed!");
        return false;
      }
    } catch (error) {
      setIsUploading(false);
      console.error("Error uploading image:", error);
      alert("An error occurred while uploading.");
      return false;
    }
  };

  const handleSignUp = async () => {
    if (
      !email ||
      !password ||
      !username ||
      !firstname ||
      !lastname ||
      !gender ||
      !profilePicture
    ) {
      Alert.alert(
        "Error",
        "Please fill out all fields and select a profile picture"
      );
      return;
    }

    try {
      setIsUploading(true);

      // Upload image first and get URL
      const formData = new FormData();
      formData.append("file", {
        uri: profilePicture,
        type: "image/jpeg",
        name: "upload.jpg",
      });
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      // Upload to Cloudinary
      const uploadResponse = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.secure_url) {
        setIsUploading(false);
        Alert.alert("Error", "Failed to upload profile picture");
        return;
      }

      // Create user only after successful image upload
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);

      // Create user document with the Cloudinary URL
      const userInfo = {
        email,
        username,
        firstname,
        lastname,
        birthday: birthday.toISOString().split("T")[0],
        gender,
        emailVerified: false,
        profilePictureURL: uploadData.secure_url, // Use URL directly from upload response
      };

      await setDoc(doc(db, "userInformation", user.uid), userInfo);

      setIsUploading(false);
      Alert.alert(
        "Success",
        "Account created successfully! Please check your email to verify your account.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      setIsUploading(false);
      console.error("Error signing up:", error);
      let errorMessage = "An error occurred. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      }
      Alert.alert("Sign Up Failed", errorMessage);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require("../images/TALKO.png")} style={styles.logo} />

      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={firstname}
        onChangeText={setFirstname}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={lastname}
        onChangeText={setLastname}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.datePickerText}>
          {`Birthday: ${birthday.toISOString().split("T")[0]}`}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={birthday}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setBirthday(selectedDate);
          }}
        />
      )}

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Gender:</Text>
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>

      <TouchableOpacity
        style={styles.imagePickerButton}
        onPress={pickImage}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="large" color="#3498db" />
        ) : profilePicture ? (
          <Image
            source={{ uri: profilePicture }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.selectText}>Select Profile Picture</Text>
        )}
      </TouchableOpacity>

      {profilePicture && !isUploading && (
        <Text style={styles.uploadSuccess}>✓ Image selected</Text>
      )}

      <TouchableOpacity
        style={[styles.signUpButton, isUploading && styles.disabledButton]}
        onPress={handleSignUp}
        disabled={isUploading}
      >
        <Text style={styles.signUpButtonText}>
          {isUploading ? "Uploading..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Already have an account?{" "}
        <Text style={styles.signupLink} onPress={handleLogin}>
          Log In
        </Text>
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
  },
  imagePickerButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3498db",
    backgroundColor: "#ecf0f1",
    marginBottom: 20,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  selectText: {
    fontSize: 16,
    color: "#3498db",
    fontWeight: "bold",
    textAlign: "center",
  },
  uploadSuccess: {
    color: "#27ae60",
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "500",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#34495e",
    marginVertical: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#dcdde1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  datePickerButton: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    paddingHorizontal: 15,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "#ecf0f1",
    borderColor: "#dcdde1",
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: 16,
    color: "#34495e",
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    color: "#34495e",
    marginBottom: 5,
  },
  picker: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    borderColor: "#dcdde1",
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  signUpButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupText: {
    fontSize: 16,
    color: "#999",
  },
  signupLink: {
    color: "#3498DB",
    fontWeight: "bold",
  },
});

export default SignUpPage;
