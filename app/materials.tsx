import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SectionList,
  Image,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Platform } from "react-native";
import { ref, get } from "firebase/database";
import { db } from "../config/firebase";
import HambMenu from "../components/HambMenu";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { goBack } from "expo-router/build/global-state/routing";
const getFileReference = (subject: any, fileUrl: any) => {
  try {
    const fileMap = {
      Информатика: {
        "lecture.pdf": require("../assets/files/lecture.pdf"),
      },
      "МДК 02": {
        "lecture.pdf": require("../assets/files/lecture.pdf"),
      },
    };
    const file = fileMap[subject]?.[fileUrl];
    if (!file) throw new Error("File mapping not found");

    return { uri: Image.resolveAssetSource(file).uri };
  } catch (error) {
    console.error("File resolution error:", error);
    return null;
  }
};
const MaterialsScreen = () => {
  const nav = useNavigation();
  const [hambVis, setHambVis] = useState(false);
  const [hambPh, setHambPh] = useState("hamb");
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [openingFile, setOpeningFile] = useState(false);
  const openFile = async (subject: string, fileUrl: string) => {
    if (openingFile) return;
    try {
      setOpeningFile(true);
      const fileReference = getFileReference(subject, fileUrl);

      if (!fileReference?.uri) {
        throw new Error("File URI not available");
      }
      if (Platform.OS === "android") {
        const fileUri = `${FileSystem.cacheDirectory}${fileUrl}`;
        await FileSystem.copyAsync({
          from: fileReference.uri,
          to: fileUri,
        });
        await Sharing.shareAsync(fileUri);
      } else {
        await Sharing.shareAsync(fileReference.uri);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Невозможно открыть файл");
      console.error("File open error:", error);
    } finally {
      setOpeningFile(false);
    }
  };
  const fetchMaterials = async () => {
    try {
      const userId = await AsyncStorage.getItem("uniqueid");
      if (!userId) throw new Error("User ID not found");
      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();
      const groupRef = ref(db, `groups/${userData.groupId}`);
      const groupSnapshot = await get(groupRef);
      const groupData = groupSnapshot.val();
      const materialsRef = ref(db, "materials");
      const materialsSnapshot = await get(materialsRef);
      const materialsData = materialsSnapshot.val();
      const processedSections = groupData.subjects
        .map((subject) => {
          const subjectMaterials = materialsData?.[subject] || [];
          return {
            title: subject,
            data: subjectMaterials.map((item) => ({
              ...item,
              subject: subject,
            })),
          };
        })
        .filter((section) => section.data.length > 0);
      setSections(processedSections);
      setLoading(false);
    } catch (error) {
      console.error("Full Error Stack:", error);
      Alert.alert("Ошибка", "Не удалось загрузить данные");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMaterials();
  }, []);
  const renderMaterialItem = ({ item }) => (
    <View style={styles.materialCard}>
      <View style={styles.cardContent}>
        <Text style={styles.lectureTitle}>{item.title}</Text>
        <TouchableOpacity
          onPress={() => openFile(item.subject, item.fileUrl)}
          disabled={openingFile}
          style={{ display: "flex", alignItems: "flex-end" }}
        >
          <Image
            source={require("../assets/images/icons/material.png")}
            style={{ width: 20, height: 40, objectFit: "contain" }}
          />
        </TouchableOpacity>
        {openingFile && (
          <ActivityIndicator color="black" style={styles.loadingIndicator} />
        )}
      </View>
    </View>
  );
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  const hambHandler = () => {
    setHambVis(!hambVis);
    setHambPh(hambPh == "hamb" ? "cross" : "hamb");
  };
  return (
    <ImageBackground
      source={require("../assets/images/bcg5.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={hambHandler}>
            <Image
              source={
                hambPh == "hamb"
                  ? require("../assets/images/icons/hamb.png")
                  : require("../assets/images/icons/cross.png")
              }
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
          <Text style={{ fontSize: 30, fontFamily: "Roboto" }}>Материалы</Text>
          {hambVis == true ? <HambMenu /> : null}

          <View style={{ height: "60%" }}>
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={renderMaterialItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Image style={styles.emptyImage} />
                  <Text style={styles.emptyText}>Нет доступных материалов</Text>
                </View>
              }
            />
          </View>
        </View>
        <View style={styles.bottomPart}>
          <TouchableOpacity
            style={styles.bpTO}
            onPress={() =>
              nav.reset({
                index: 0,
                routes: [{ name: "schedule" }],
              })
            }
          >
            <Image
              source={require("../assets/images/icons/schedule.png")}
              style={styles.bpImage}
            />
            <Text style={styles.bpTxt}>Расписание</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bpTO}
            onPress={() =>
              nav.reset({
                index: 0,
                routes: [{ name: "chats" }],
              })
            }
          >
            <Image
              source={require("../assets/images/icons/chats.png")}
              style={styles.bpImage}
            />
            <Text style={styles.bpTxt}>Чаты</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bpTO}
            onPress={() =>
              nav.reset({
                index: 0,
                routes: [{ name: "profile" }],
              })
            }
          >
            <Image
              source={require("../assets/images/icons/profile.png")}
              style={styles.bpImage}
            />
            <Text style={styles.bpTxt}>Профиль</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
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
    height: "100%",
    width: "100%",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  bpTxt: {
    fontFamily: "Roboto",
    fontSize: 13,
  },
  bottomPart: {
    position: "absolute",
    bottom: 25,
    marginHorizontal: "auto",
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  materialCard: {
    height: 100,
    margin: 8,
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    opacity: 0.85,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyImage: {
    width: 150,
    height: 150,
    opacity: 0.8,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "black",
    fontSize: 18,
    fontFamily: "Roboto",
  },
  cardContent: {
    flex: 1,
    display: "flex",
    gap: 25,
    alignItems: "center",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#EDEDEB",
  },
  lectureNumber: {
    color: "black",
    fontSize: 18,
    fontFamily: "Roboto",
  },
  lectureTitle: {
    color: "black",
    fontSize: 24,
    fontFamily: "Roboto",
    marginTop: 3,
  },
  list: {
    paddingBottom: 30,
  },
  bpImage: {
    width: 40,
    height: 40,
    objectFit: "contain",
  },
  bpTO: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: 50,
    height: "80%",
  },
  header: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIndicator: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  loader: {
    marginTop: 50,
  },
});

export default MaterialsScreen;
