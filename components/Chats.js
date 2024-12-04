import React, { useEffect, useState, useRef, useCallback } from "react";
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
  RefreshControl,
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
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/chatStyles";

const Chats = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageOptionsVisible, setMessageOptionsVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedMessageText, setEditedMessageText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { friend } = route.params;
  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const [shownReactionsMessageId, setShownReactionsMessageId] = useState(null);

  const reactions = ["👍", "😆", "❤️", "😢", "😮", "😠"];

  const loadOlderMessages = async () => {
    if (!lastVisible) return;

    const currentUser = auth.currentUser;
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const olderMessages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const formattedData = {
        id: doc.id,
        ...data,
        createdAt: format(data.createdAt.toDate(), "MMM dd, yyyy hh:mm a"),
        reactions: data.reactions || {},
      };
      olderMessages.push(formattedData);
    });

    const filteredOlderMessages = olderMessages.filter(
      (message) =>
        (message.senderId.toLowerCase() === currentUser.email.toLowerCase() &&
          message.receiverId.toLowerCase() === friend.email.toLowerCase()) ||
        (message.senderId.toLowerCase() === friend.email.toLowerCase() &&
          message.receiverId.toLowerCase() === currentUser.email.toLowerCase())
    );

    setMessages((prevMessages) => [...prevMessages, ...filteredOlderMessages]);
    if (querySnapshot.docs.length > 0) {
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } else {
      setLastVisible(null);
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(30));

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
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    });

    return () => {
      unsubscribe();
    };
  }, [friend.email]);

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

    setMessageOptionsVisible(false);
    setSelectedMessage(null);

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
  };

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

  // const renderFooter = () => {
  //   return (
  //     <View style={styles.footerContainer}>
  //       <Image
  //         source={{ uri: friend.profilePictureURL }}
  //         style={styles.profilePicture}
  //       />
  //       <Text style={styles.footerText}>
  //         Start a conversation with {friend.username}!
  //       </Text>
  //     </View>
  //   );
  // };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard", { screens: "ChatPage" })}        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: friend.profilePictureURL }}
            style={styles.profilePicture}
          />
          <Text style={styles.header}>{friend.username}</Text>
        </View>
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
          inverted
          onEndReached={loadOlderMessages}
          // ListFooterComponent={renderFooter}
          onEndReachedThreshold={0.1}
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

export default Chats;
