import { StyleSheet, Dimensions } from "react-native";

const { height, width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row", // Arrange items in a row
    alignItems: "center", // Center items vertically
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 2,
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
    paddingBottom: 20,
  },
  message: {
    marginBottom: 25,
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
    position: 'absolute',
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Slightly transparent
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  reactionEmoji: {
    fontSize: 20,
    marginHorizontal: 5,
    padding: 5,
    borderRadius: 15,
    // Add hover/press effect
    backgroundColor: "transparent",
    transition: "background-color 0.2s",
  },
  reactionEmojiPressed: {
    backgroundColor: 'rgba(0,0,0,0.1)'
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
    backgroundColor: "#4A5ACE",
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
    bottom: height * 0,
    justifyContent: "space-evenly",
    flexDirection: "row-reverse",
    width: width * 1,
    backgroundColor: "#F0F0F0",
    padding: 25,
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
  profileHeader: {
    flexDirection: "row", // Arrange the profile picture and username in a row
    alignItems: "center", // Center them vertically
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20, // Ensure the picture is circular
    marginLeft: 8,
    marginRight: 8, // Add space between the picture and the username
  },
});
