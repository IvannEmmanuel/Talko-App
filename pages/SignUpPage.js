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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker"; // Updated import
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

const SignUpPage = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthday, setBirthday] = useState(new Date());
  const [gender, setGender] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleLogin = () => {
    navigation.goBack();
  };

  const handleSignUp = async () => {
    if (!email || !password || !phoneNumber || !gender) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const { uid } = userCredential.user;

      // Save user information in Firestore
      const userInfo = {
        email,
        phoneNumber,
        birthday: birthday.toISOString().split("T")[0], // Format as YYYY-MM-DD
        gender,
      };

      await setDoc(doc(db, "userInformation", uid), userInfo);
      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Dashboard"); // Navigate to HomePage after successful sign-up
    } catch (error) {
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
      <Image
        source={require("../images/TALKO.png")} // Save the logo file in the `assets` folder
        style={styles.logo}
      />

      {/* Email */}
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Phone Number */}
      <TextInput
        placeholder="Phone Number"
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      {/* Birthday */}
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

      {/* Gender */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Gender:</Text>
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={styles.signUpButtonText}>Sign Up</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Already have an account?{" "}
        <Text style={styles.signupLink} onPress={handleLogin}>
          Sign Up
        </Text>
      </Text>
    </ScrollView>
  );
};

export default SignUpPage;

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
