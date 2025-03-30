import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import {
  ref,
  push,
  set,
  update,
  onValue,
  off,
  query,
  orderByChild,
} from "firebase/database";
import { db } from "../config/firebase";
import { useUser } from "../config/UserContext";
import { useNavigation, useRoute } from "@react-navigation/native";
const ChatScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const { chatId } = route.params || {};
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatName, setChatName] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();
  const messagesRef = query(
    ref(db, `chats/${chatId}/messages`),
    orderByChild("timestamp")
  );
  const chatRef = ref(db, `chats/${chatId}`);

  useEffect(() => {
    const chatUnsubscribe = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        setChatName(snapshot.val().groupName || "Без названия");
      }
      setLoading(false);
    });
    const messagesUnsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = [];
        snapshot.forEach((childSnapshot) => {
          messagesData.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
            isMyMessage: childSnapshot.val().sender === user?.uid,
          });
        });
        setMessages(messagesData);
      } else {
        setMessages([]);
      }
    });

    return () => {
      off(chatRef, "value", chatUnsubscribe);
      off(messagesRef, "value", messagesUnsubscribe);
    };
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.uid) return;

    try {
      const newMessageRef = push(ref(db, `chats/${chatId}/messages`));
      await set(newMessageRef, {
        text: newMessage,
        sender: user.uid,
        senderName: user.username,
        timestamp: Date.now(),
      });

      await update(chatRef, {
        "lastMessage/text": newMessage,
        "lastMessage/timestamp": Date.now(),
        "lastMessage/sender": user.uid,
      });

      setNewMessage("");
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Image
              source={require("../assets/images/icons/arrow.png")}
              style={{ width: 45, height: 45, objectFit: "contain" }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              nav.reset({
                index: 0,
                routes: [{ name: "main" }],
              })
            }
          >
            <Image
              source={require("../assets/images/logo.png")}
              style={{ width: 100, height: 75, objectFit: "contain" }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          <View style={styles.chatWrap}>
            <Image
              source={require("../assets/images/icons/chats.png")}
              style={styles.chatAvatar}
            />
            <Text style={styles.chatName}>{chatName}</Text>
          </View>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.isMyMessage ? styles.myMessage : styles.otherMessage,
                ]}
              >
                {!item.isMyMessage && (
                  <Text style={styles.senderName}>{item.senderName}</Text>
                )}
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.timeText}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Напишите сообщение..."
              placeholderTextColor="#888"
              multiline
            />

            <TouchableOpacity
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Image
                source={require("../assets/images/icons/send.png")}
                style={styles.sendIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "white",
    resizeMode: "cover",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "auto",
    width: "100%",
  },
  header: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 40,
    paddingBottom: 30,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    width: "100%",
    height: "83%",
  },
  chatAvatar: {
    width: 50,
    height: 50,
    marginRight: 12,
    objectFit: "contain",
  },
  chatName: {
    fontSize: 20,
    fontFamily: "Roboto",
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 10,
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: "Roboto",
  },
  chatWrap: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    borderBottomColor: "gray",
    borderBottomWidth: 1,
    gap: 5,
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Roboto",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 10,
    alignSelf: "flex-end",
    fontFamily: "Roboto",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#24b59d",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e3e3e0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#efefef",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontFamily: "Roboto",
    fontSize: 16,
    maxHeight: 120,
    paddingVertical: 12,
  },
  sendIcon: {
    width: 24,
    height: 24,
    objectFit: "contain",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatScreen;
