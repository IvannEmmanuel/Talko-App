import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { auth } from '../firebaseConfig'; // Importing the initialized auth instance from firebaseConfig
import { signInWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const handleSignUp = () => {
    navigation.navigate('SignUp')
  }

  const checkEmailVerified = async (user) => {
    if (user.emailVerified) {
      // Update Firestore to mark the email as verified
      try {
        const userDocRef = doc(db, "userInformation", user.uid);
        await updateDoc(userDocRef, {
          emailVerified: true,
        });
        console.log("Firestore emailVerified updated to true.");
      } catch (error) {
        console.error("Error updating Firestore emailVerified:", error);
      }
    } else {
      Alert.alert("Email not verified", "Please verify your email address.");
    }
  };
  
  async function handleLogin() {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      checkEmailVerified(user);
  
      if (!user.emailVerified) {
        Alert.alert("Email not verified", "Please verify your email address.");
        return;
      } // then if the emailVerified the firestore database will also change to true also
  
      // Proceed with the rest of the login process
      // For example, navigate to the home screen after login
      navigation.navigate("Dashboard");
    } catch (error) {
      let errorMessage = "An error occurred. Please try again.";
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Wrong email or password.";
      }
      Alert.alert("Login Failed", errorMessage);
    }
  }

  return (
    <View style={styles.container}>
      {/* Talko Logo */}
      <Image
        source={require("../images/TALKO.png")} // Save the logo file in the `assets` folder
        style={styles.logo}
      />

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        style={styles.input}
        onChangeText={setEmail}
      />

      {/* Password Input */}
      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry={true}
        style={styles.input}
        onChangeText={setPassword}
      />

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      {/* Sign-Up Link */}
      <Text style={styles.signupText}>
        Don't have an account?{" "}
        <Text style={styles.signupLink} onPress={handleSignUp}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
};

export default LoginPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#3498DB",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 20,
  },
  loginButtonText: {
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
