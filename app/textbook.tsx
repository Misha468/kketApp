import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ref, push, remove, update, onValue } from "firebase/database";
import { db } from "../config/firebase";
import HambMenu from "../components/HambMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Menu,
  MenuTrigger,
  MenuOptions,
  MenuOption,
} from "react-native-popup-menu";

const { height } = Dimensions.get("window");

const TextbookScreen = () => {
  const navigation = useNavigation();

  const [hambVisible, setHambVisible] = useState(false);
  const [hambIcon, setHambIcon] = useState<"hamb" | "cross">("hamb");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const { uid } = JSON.parse(userData);
        setUserId(uid);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const notesRef = ref(db, `users/${userId}/notes`);
    const unsubscribe = onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      const notesArray = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      setNotes(notesArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return [
      date.getDate().toString().padStart(2, "0"),
      (date.getMonth() + 1).toString().padStart(2, "0"),
      date.getFullYear(),
    ].join(".");
  };

  const handleCreateNote = async () => {
    if (!newNoteText.trim() || !userId) {
      Alert.alert("Ошибка", "Заметка не может быть пустой");
      return;
    }

    try {
      await push(ref(db, `users/${userId}/notes`), {
        text: newNoteText.trim(),
        date: Date.now(),
      });
      setNewNoteText("");
      setShowInput(false);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось создать заметку");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!userId) return;

    Alert.alert("Удалить заметку", "Вы уверены?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(ref(db, `users/${userId}/notes/${noteId}`));
          } catch (error) {
            Alert.alert("Ошибка", "Не удалось удалить заметку");
          }
        },
      },
    ]);
  };

  const handleUpdateNote = async (noteId: string, currentText: string) => {
    if (!userId) return;

    Alert.prompt(
      "Редактировать заметку",
      "Введите новый текст:",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сохранить",
          onPress: async (text) => {
            if (!text?.trim()) return;
            try {
              await update(ref(db, `users/${userId}/notes/${noteId}`), {
                text: text.trim(),
                date: Date.now(),
              });
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось обновить заметку");
            }
          },
        },
      ],
      "plain-text",
      currentText
    );
  };

  const renderNoteItem = ({ item }: { item: any }) => (
    <View style={styles.noteContainer}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteDate}>{formatDate(item.date)}</Text>
        <Menu>
          <MenuTrigger>
            <Text style={styles.menuTrigger}>⋮</Text>
          </MenuTrigger>
          <MenuOptions optionsContainerStyle={styles.menuOptions}>
            <MenuOption onSelect={() => handleUpdateNote(item.id, item.text)}>
              <Text style={styles.menuOptionText}>Редактировать</Text>
            </MenuOption>
            <MenuOption onSelect={() => handleDeleteNote(item.id)}>
              <Text style={[styles.menuOptionText, styles.deleteText]}>
                Удалить
              </Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
      <Text style={styles.noteText}>{item.text}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/bcg5.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setHambVisible(!hambVisible);
              setHambIcon((prev) => (prev === "hamb" ? "cross" : "hamb"));
            }}
          >
            <Image
              source={
                hambIcon === "hamb"
                  ? require("../assets/images/icons/hamb.png")
                  : require("../assets/images/icons/cross.png")
              }
              style={styles.hambIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "main" }],
              })
            }
          >
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
            />
          </TouchableOpacity>
        </View>
        {hambVisible && (
          <View style={styles.hambMenuContainer}>
            <HambMenu />
          </View>
        )}
        <KeyboardAvoidingView
          style={styles.contentContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>Блокнот</Text>

            <FlatList
              data={notes}
              renderItem={renderNoteItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.notesRow}
              contentContainerStyle={styles.notesContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Нет заметок</Text>
              }
            />
            {showInput && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  multiline
                  placeholder="Введите текст заметки..."
                  value={newNoteText}
                  onChangeText={setNewNoteText}
                  autoFocus
                />
                <View style={styles.inputButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowInput(false)}
                  >
                    <Text style={styles.buttonText}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleCreateNote}
                  >
                    <Text style={styles.buttonText}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
        {!showInput && (
          <View
            style={{
              position: "absolute",
              right: 0,
              bottom: 80,
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
              padding: 10,
            }}
          >
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowInput(true)}
            >
              <Image
                source={require("../assets/images/icons/add.png")}
                style={styles.addIcon}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.reset({ routes: [{ name: "schedule" }] })}
          >
            <Image
              source={require("../assets/images/icons/schedule.png")}
              style={styles.navIcon}
            />
            <Text style={styles.navText}>Расписание</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.reset({ routes: [{ name: "chats" }] })}
          >
            <Image
              source={require("../assets/images/icons/chats.png")}
              style={styles.navIcon}
            />
            <Text style={styles.navText}>Чаты</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.reset({ routes: [{ name: "profile" }] })}
          >
            <Image
              source={require("../assets/images/icons/profile.png")}
              style={styles.navIcon}
            />
            <Text style={styles.navText}>Профиль</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 40,
    zIndex: 9998,
  },
  hambMenuContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 9997,
  },
  contentContainer: {
    flex: 1,
    marginBottom: 80,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notesContent: {
    paddingBottom: 20,
  },
  hambIcon: {
    width: 45,
    height: 45,
    resizeMode: "contain",
  },
  logo: {
    width: 100,
    height: 75,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    color: "#1A1A1A",
    marginVertical: 16,
    fontFamily: "Roboto",
  },
  notesRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  noteContainer: {
    width: "48%",
    backgroundColor: "#EAE3DA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomColor: "#CCC9C9",
    borderBottomWidth: 1,
  },
  noteDate: {
    fontSize: 12,
    color: "#524F4F",
    fontFamily: "Roboto",
  },
  noteText: {
    fontSize: 14,
    color: "#828282",
    lineHeight: 20,
    fontFamily: "Roboto",
  },
  menuTrigger: {
    fontSize: 24,
    color: "black",
    paddingHorizontal: 8,
  },
  menuOptions: {
    backgroundColor: "#EAE3DA",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuOptionText: {
    fontSize: 16,
    color: "#828282",
    padding: 8,
    fontFamily: "Roboto",
  },
  deleteText: {
    color: "#DC3545",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: "top",
    fontFamily: "Roboto",
    marginBottom: 16,
  },
  inputButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  cancelButton: {
    padding: 8,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontFamily: "Roboto",
  },
  addIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: "#D9D9D9",
    borderRadius: "100%",
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    zIndex: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Roboto",
  },
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  navButton: {
    alignItems: "center",
  },
  navIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginBottom: 4,
  },
  navText: {
    fontSize: 13,
    color: "#1A1A1A",
    fontFamily: "Roboto",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  emptyText: {
    textAlign: "center",
    color: "#6C757D",
    fontSize: 16,
    marginTop: 40,
    fontFamily: "Roboto",
  },
});

export default TextbookScreen;
