import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import { ref, get } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { db } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HambMenu from "@/components/HambMenu";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";

const GradebookScreen = () => {
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const [hambVis, setHambVis] = useState(false);
  const [hambPh, setHambPh] = useState("hamb");
  const [gradebookData, setGradebookData] = useState([]);

  useEffect(() => {
    const fetchGradebook = async () => {
      try {
        const userId = await AsyncStorage.getItem("uniqueid");
        const gradebookRef = ref(db, `gradebook/${userId}`);
        const snapshot = await get(gradebookRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const gradebookArray = Object.entries(data).map(([key, value]) => ({
            type: key,
            ...value,
          }));
          setGradebookData(gradebookArray);
        }
        setLoading(false);
      } catch (error) {
        console.error("Ошибка загрузки:", error);
        setLoading(false);
      }
    };
    fetchGradebook();
  }, []);

  const handleDownload = async (fileurl) => {
    try {
      const fileMap: { [key: string]: any } = {
        "lecture.pdf": require("../assets/files/lecture.pdf"),
      };
      if (!fileMap[fileurl]) {
        throw new Error("Файл не найден");
      }
      const asset = Asset.fromModule(fileMap[fileurl]);
      await asset.downloadAsync();

      const fileUri = FileSystem.cacheDirectory + fileurl;
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: fileUri,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert("Файл доступен по пути: " + fileUri);
      }
    } catch (error) {
      console.error("Ошибка скачивания:", error);
      alert("Не удалось открыть файл");
    }
  };

  const renderGradebookItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.title}>
        {item.type === "exams" ? "Экзамены" : "Зачеты"}
      </Text>
      <Text style={styles.date}>{item.date}</Text>
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => handleDownload(item.fileurl)}
      >
        <Image
          source={require("../assets/images/icons/download.png")}
          style={{ width: 25, height: 25 }}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  const hambHandler = () => {
    setHambVis(!hambVis);
    setHambPh(hambPh === "hamb" ? "cross" : "hamb");
  };

  return (
    <ImageBackground
      source={require("../assets/images/bcg1.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={hambHandler}>
            <Image
              source={
                hambPh === "hamb"
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
          {hambVis && <HambMenu />}
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Зачетная книжка</Text>
            <FlatList
              data={gradebookData}
              renderItem={renderGradebookItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Нет данных по зачетам и экзаменам
                </Text>
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
    resizeMode: "cover",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
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
    height: "80%",
    paddingHorizontal: 20,
  },
  itemContainer: {
    backgroundColor: "#f5f5f5",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontFamily: "Roboto",
  },
  date: {
    fontSize: 10,
    color: "#666",
  },
  downloadButton: {
    padding: 10,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  downloadText: {
    color: "white",
    fontSize: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: "Roboto",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
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
  bpTO: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  bpImage: {
    width: 40,
    height: 40,
    objectFit: "contain",
  },
});

export default GradebookScreen;
