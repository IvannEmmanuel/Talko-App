import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
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
  updateDoc,
} from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const Chats = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageOptionsVisible, setMessageOptionsVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedMessageText, setEditedMessageText] = useState("");
  const route = useRoute();
  const navigation = useNavigation();
  const { friend } = route.params;
  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const [shownReactionsMessageId, setShownReactionsMessageId] = useState(null);

  const reactions = ["👍", "😆", "❤️", "😢", "😮", "😠"];

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

      // Scroll to the bottom after setting messages
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true }); // Changed animated to true for a smoother effect
      }
    });

    return () => {
      unsubscribe();
    };
  }, [friend.email]);

  // Add this useEffect to scroll to the bottom when the component mounts
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  const handleLongPress = (messageId) => {
    const currentUser = auth.currentUser;
    const message = messages.find((m) => m.id === messageId);
    const isOwnMessage = message.senderId === currentUser.email;

    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
      setMessageOptionsVisible(false);
      setShownReactionsMessageId(null);
    } else {
      setSelectedMessage({ id: messageId });
      setMessageOptionsVisible(isOwnMessage);
      setShownReactionsMessageId(messageId);
    }
  };

  const handleEditMessage = () => {
    const currentUser = auth.currentUser;
    const message = messages.find((m) => m.id === selectedMessage.id);

    if (message.senderId !== currentUser.email) {
      alert("You can only edit your own messages.");
      return;
    }

    setEditedMessageText(message.text);
    setEditModalVisible(true);
  };

  const confirmEditMessage = async () => {
    if (!editedMessageText.trim()) {
      alert("Message cannot be empty");
      return;
    }

    const messageRef = doc(db, "messages", selectedMessage.id);

    setEditModalVisible(false);
    setShownReactionsMessageId(null);
    setMessageOptionsVisible(false);
    setSelectedMessage(null);

    try {
      await updateDoc(messageRef, {
        text: editedMessageText.trim(),
      });
    } catch (error) {
      console.error("Error updating message: ", error);
      alert("Failed to edit message");
    }
  };

  const handleReaction = async (reaction, messageId) => {
    const currentUser = auth.currentUser;
    const messageRef = doc(db, "messages", messageId);

    // Optimistically hide options before the database update
    setShownReactionsMessageId(null);
    setMessageOptionsVisible(false);
    setSelectedMessage(null);

    // Perform the database update
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
  };

  const handleDeleteMessage = async () => {
    const currentUser = auth.currentUser;

    const message = messages.find((m) => m.id === selectedMessage.id);
    if (message.senderId !== currentUser.email) {
      alert("You can only delete your own messages.");
      return;
    }

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

      await addDoc(collection(db, "messages"), {
        text: newMessage,
        senderId: currentUser.email,
        receiverId: friend.email,
        createdAt: new Date(),
        reactions: {},
      });
    }
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
        onLongPress={() => handleLongPress(item.id)}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.createdAt}</Text>

        {renderMessageReactions(item)}

        {shownReactionsMessageId === item.id && (
          <View
            style={[
              styles.reactionsPopup,
              isOwnMessage ? { right: 0 } : { left: 0 },
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

  const renderFooter = () => {
    return (
      <View style={styles.footerContainer}>
        <Image
          source={{ uri: friend.profilePictureURL }} // Assuming friend has profilePictureURL
          style={styles.profilePicture}
        />
        <Text style={styles.footerText}>
          Start a conversation with {friend.username}!
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>{friend.username}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableWithoutFeedback
              onPress={() => {
                if (messageOptionsVisible || shownReactionsMessageId !== null) {
                  setMessageOptionsVisible(false);
                  setSelectedMessage(null);
                  setShownReactionsMessageId(null);
                }
              }}
            >
              <View>{renderMessageItem({ item })}</View>
            </TouchableWithoutFeedback>
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
          keyboardShouldPersistTaps="always"
          style={{ flex: 1 }}
          ListHeaderComponent={renderFooter}
        />
      )}

      {messageOptionsVisible && selectedMessage && (
        <View style={styles.messageOptions}>
          <TouchableOpacity style={styles.option} onPress={handleEditMessage}>
            <Text>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={handleDeleteMessage}>
            <Text>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Message</Text>
            <TextInput
              style={styles.editInput}
              value={editedMessageText}
              onChangeText={setEditedMessageText}
              multiline={true}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={confirmEditMessage}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message"
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollViewContent: {
    flexGrow: 1,
  },
  messageList: {
    paddingHorizontal: 10,
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
    bottom: height * 0.07,
    backgroundColor: "white",
    padding: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  reactionEmoji: {
    fontSize: 20,
    margin: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingLeft: 10,
    paddingVertical: 10,
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
    flexDirection: "row-reverse",
    width: width * 1,
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  editInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: "row",
    alignSelf: "flex-end",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
  },
  footerContainer: {
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    marginBottom: height * 0.03,
  },
  footerText: {
    color: "#333",
    fontSize: 18,
    marginLeft: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    marginBottom: height * 0.02,
    borderRadius: 100,
  },
});

export default Chats;
