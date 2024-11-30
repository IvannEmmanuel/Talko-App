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
  Animated,
} from "react-native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  query,
  setDoc,
  deleteDoc,
  doc,
  onSnapshot,
  addDoc,
  orderBy,
  deleteField,
} from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const Chats = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [messageOptionsVisible, setMessageOptionsVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { friend } = route.params;
  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [shownReactionsMessageId, setShownReactionsMessageId] = useState(null);

  const reactions = ["❤️", "😢", "😮", "😠"];

  useEffect(() => {
    if (friendIsTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [friendIsTyping]);

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
          reactions: data.reactions || {},
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
      setLoading(false);
    });

    const typingRef = doc(db, "typingStatus", friend.email);
    const unsubscribeTyping = onSnapshot(typingRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setFriendIsTyping(docSnapshot.data().isTyping);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeTyping();
    };
  }, [friend.email]);

  const handleLongPress = (messageId, messageText) => {
    if (selectedMessage?.id === messageId) {
      // If the same message is long-pressed again, hide options
      setSelectedMessage(null);
      setMessageOptionsVisible(false);
      setShownReactionsMessageId(null);
    } else {
      setSelectedMessage({ id: messageId, text: messageText });
      setMessageOptionsVisible(true);
      setShownReactionsMessageId(messageId);
    }
  };

  const handleReaction = async (reaction, messageId) => {
    const currentUser = auth.currentUser;
    const messageRef = doc(db, "messages", messageId);

    const message = messages.find((m) => m.id === messageId);
    const currentUserReaction = message.reactions[currentUser.email];

    await setDoc(
      messageRef,
      {
        reactions: {
          ...message.reactions,
          [currentUser.email]:
            currentUserReaction === reaction ? deleteField() : reaction,
        },
      },
      { merge: true }
    );

    setShownReactionsMessageId(null);
  };

  const handleEditMessage = async (newMessageText) => {
    const messageRef = doc(db, "messages", selectedMessage.id);
    await setDoc(messageRef, { text: newMessageText }, { merge: true });
    setMessageOptionsVisible(false);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    const messageRef = doc(db, "messages", selectedMessage.id);
    await deleteDoc(messageRef);
    setMessages((prevMessages) =>
      prevMessages.filter((message) => message.id !== selectedMessage.id)
    );
    setMessageOptionsVisible(false);
    setSelectedMessage(null);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      setNewMessage("");
      Keyboard.dismiss();

      const currentUser = auth.currentUser;

      if (editingMessageId) {
        await handleEditMessage(newMessage);
        setEditingMessageId(null);
      } else {
        await addDoc(collection(db, "messages"), {
          text: newMessage,
          senderId: currentUser.email,
          receiverId: friend.email,
          createdAt: new Date(),
          reactions: {},
        });
      }
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);

    const currentUser = auth.currentUser;
    const typingRef = doc(db, "typingStatus", currentUser.email);

    setDoc(typingRef, { isTyping: text.trim().length > 0 });
  };

  const renderMessageReactions = (item) => {
    const reactionCounts = {};
    Object.values(item.reactions || {}).forEach((reaction) => {
      reactionCounts[reaction] = (reactionCounts[reaction] || 0) + 1;
    });

    return (
      <View style={styles.reactionContainer}>
        {Object.entries(reactionCounts).map(([reaction, count]) => (
          <Text key={reaction} style={styles.reactionText}>
            {reaction} {count > 1 ? count : ""}
          </Text>
        ))}
      </View>
    );
  };

  const renderMessageItem = ({ item }) => {
    const isOwnMessage = item.senderId === auth.currentUser.email;

    return (
      <TouchableOpacity
        style={[
          styles.message,
          isOwnMessage ? styles.sentMessage : styles.receivedMessage,
        ]}
        onLongPress={() => handleLongPress(item.id, item.text)}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.createdAt}</Text>

        {renderMessageReactions(item)}

        {shownReactionsMessageId === item.id && (
          <View
            style={[
              styles.reactionsPopup,
              isOwnMessage ? { right: 0 } : { left: 0 },
              { zIndex: 999 },
            ]}
          >
            {reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction}
                onPress={() => handleReaction(reaction, item.id)}
              >
                <Text style={styles.reactionEmoji}>{reaction}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
          onScrollBeginDrag={() => setShownReactionsMessageId(null)}
        />
      )}

      {friendIsTyping && (
        <Animated.View
          style={[
            styles.typingIndicator,
            {
              opacity: bounceAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.5, 1],
              }),
            },
          ]}
        >
          <Text>{friend.username} is typing...</Text>
        </Animated.View>
      )}

      {messageOptionsVisible && selectedMessage && (
        <View style={styles.messageOptions}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleEditMessage(newMessage)}
          >
            <Text>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={handleDeleteMessage}>
            <Text>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Type a message"
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
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
    marginTop: height * 0.03,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  messageList: {
    paddingBottom: 50,
  },
  message: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    maxWidth: "80%",
    position: "relative",
  },
  sentMessage: {
    backgroundColor: "#d1f0d1",
    alignSelf: "flex-end",
  },
  receivedMessage: {
    backgroundColor: "#f1f1f1",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  reactionContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  reactionText: {
    fontSize: 14,
    marginRight: 5,
  },
  reactionsPopup: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  reactionEmoji: {
    fontSize: 24,
  },
  typingIndicator: {
    position: "absolute",
    bottom: 20,
    left: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingLeft: 10,
    paddingVertical: 5,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 50,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageOptions: {
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: [{ translateX: -50 }],
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    zIndex: 999,
  },
  option: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
});

export default Chats;
