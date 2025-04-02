import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { ref, get } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { db } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HambMenu from "@/components/HambMenu";
const DebtsScreen = () => {
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const [hambVis, setHambVis] = useState(false);
  const [hambPh, setHambPh] = useState("hamb");
  const [debts, setDebts] = useState([]);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("ru-RU", {
      month: "numeric",
    });
    return (
      <View>
        <Text
          style={{
            fontSize: 30,
            fontFamily: "Roboto",
            color: "white",
          }}
        >
          {day}.{month}
        </Text>
      </View>
    );
  };
  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const userId = await AsyncStorage.getItem("uniqueid");
        const debtsRef = ref(db, `debts/${userId}`);
        const snapshot = await get(debtsRef);
        if (snapshot.exists()) {
          const debtsData = Object.entries(snapshot.val())
            .map(([key, value]) => ({ id: key, ...value }))
            .filter((item) => item.status === "Активно");

          setDebts(debtsData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Ошибка загрузки:", error);
        setLoading(false);
      }
    };
    fetchDebts();
  }, []);
  const renderDebtItem = ({ item }) => (
    <View
      style={{
        backgroundColor: "#DB4B38",
        width: "100%",
        height: 75,
        borderRadius: 15,
        display: "flex",
        padding: 15,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Text> {formatDate(item.date)}</Text>
        <Text style={{ fontFamily: "Roboto", fontSize: 30, color: "white" }}>
          {item.title}
        </Text>
      </View>
    </View>
  );
  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }
  const hambHandler = () => {
    setHambVis(!hambVis);
    setHambPh(hambPh == "hamb" ? "cross" : "hamb");
  };
  return (
    <View style={styles.background}>
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
          {hambVis == true ? <HambMenu /> : null}
          <View style={{ display: "flex", flexDirection: "column", gap: 25 }}>
            <Text
              style={{
                fontSize: 30,
                fontFamily: "Roboto",
                width: "100%",
              }}
            >
              Задолженности
            </Text>
            <FlatList
              data={debts}
              renderItem={renderDebtItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={{ fontFamily: "Roboto", fontSize: 20 }}>
                  Нет активных задолженностей 🎉
                </Text>
              }
            />
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
  listContent: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: 10,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "auto",
    width: "100%",
  },
  bpTxt: {
    fontFamily: "Roboto",
    fontSize: 13,
  },
  bottomPart: {
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
  loader: {
    marginTop: 50,
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
    justifyContent: "space-between",
    width: "95%",
    height: "81%",
  },
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default DebtsScreen;
