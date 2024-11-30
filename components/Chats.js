import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  orderBy,
} from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const Chats = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const route = useRoute();
  const navigation = useNavigation(); // Access navigation
  const { friend } = route.params;
  const inputRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("createdAt"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const formattedData = {
          id: doc.id,
          ...data,
          createdAt: format(data.createdAt.toDate(), "MMM dd, yyyy hh:mm a"),
        };
        messagesList.push(formattedData);
      });

      const filteredMessages = messagesList.filter(
        (message) =>
          (message.senderId.toLowerCase() === currentUser.email.toLowerCase() &&
            message.receiverId.toLowerCase() === friend.email.toLowerCase()) ||
          (message.senderId.toLowerCase() === friend.email.toLowerCase() &&
            message.receiverId.toLowerCase() ===
              currentUser.email.toLowerCase())
      );

      setMessages(filteredMessages);
      setLoading(false); // Loading complete
    });

    return () => unsubscribe();
  }, [friend.id]);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const currentUser = auth.currentUser;
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        senderId: currentUser.email,
        receiverId: friend.email,
        createdAt: new Date(),
      });
      setNewMessage("");
      Keyboard.dismiss();
      if (inputRef.current) {
        inputRef.current.clear();
      }
    }
  };

  const renderMessageItem = ({ item }) => (
    <View
      style={[
        styles.message,
        item.senderId === auth.currentUser.email
          ? styles.sentMessage
          : styles.receivedMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>{item.createdAt}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>{friend.username}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading chat...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
          onLayout={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Chats;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    marginTop: height * 0.05, // Adjust header to be a bit lower from the top
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginLeft: 15,
    flex: 1,
  },
  messageList: {
    paddingBottom: 16,
  },
  message: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: "80%",
  },
  sentMessage: {
    backgroundColor: "#e6f7ff",
    alignSelf: "flex-end",
  },
  receivedMessage: {
    backgroundColor: "#d1ffd1",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007bff",
    borderRadius: 20,
    padding: 10,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
