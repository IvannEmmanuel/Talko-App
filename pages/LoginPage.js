import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { auth } from '../firebaseConfig'; // Importing the initialized auth instance from firebaseConfig
import { signInWithEmailAndPassword } from "firebase/auth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const handleSignUp = () => {
    navigation.navigate('SignUp')
  }
  
  async function registerLogin() {
    try {
      // await createUserWithEmailAndPassword(auth, email, password); //for register ni siya
      const response = await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Login Successful", `Welcome, ${response.user.email}`);
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
      <TouchableOpacity style={styles.loginButton} onPress={registerLogin}>
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
