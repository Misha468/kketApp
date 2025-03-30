import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ref, onValue } from "firebase/database";
import { db } from "../config/firebase";
import { useUser } from "../config/UserContext";
import PerformanceTracker from "../components/PerformanceTracker";
import HambMenu from "../components/HambMenu";

const roleText = {
  Студент: "за семестр",
  Преподаватель: "курируемой группы",
};
const MainScreen = () => {
  const nav = useNavigation();
  const { user, loading: userLoading } = useUser();
  const [hambVis, setHambVis] = useState(false);
  const [hambPh, setHambPh] = useState("hamb");
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [activeDebts, setActiveDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCurrentDay = () => {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  };
  useEffect(() => {
    if (user && user.role === "Студент" && user.uid) {
      const debtsRef = ref(db, `debts/${user.uid}`);
      const unsubscribe = onValue(debtsRef, (snapshot) => {
        const debtsData = snapshot.val();
        if (debtsData) {
          const filteredDebts = Object.values(debtsData).filter(
            (debt) => debt.status === "Активно"
          );
          setActiveDebts(filteredDebts);
        } else {
          setActiveDebts([]);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);
  useEffect(() => {
    if (user && user.groupId) {
      setLoading(true);
      const scheduleRef = ref(db, `schedule/${user.groupId}/days`);
      const unsubscribe = onValue(scheduleRef, (snapshot) => {
        const scheduleData = snapshot.val();
        const today = getCurrentDay();
        setTodaySchedule(scheduleData?.[today] || []);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);
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
            fontSize: 25,
            fontFamily: "Roboto",
          }}
        >
          {day}.
        </Text>
        <Text
          style={{
            fontSize: 25,
            fontFamily: "Roboto",
          }}
        >
          {month}
        </Text>
      </View>
    );
  };

  if (userLoading || loading) {
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
          <TouchableOpacity>
            <Image
              source={require("../assets/images/logo.png")}
              style={{ width: 100, height: 75, objectFit: "contain" }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          {hambVis == true ? <HambMenu /> : null}
          <View style={styles.topPart}>
            <View style={styles.topPartText}>
              <Text style={{ fontSize: 20, fontFamily: "Roboto" }}>
                Успеваемость
              </Text>
              <Text style={{ fontSize: 20, fontFamily: "Roboto" }}>
                {roleText[user?.role] || ""}
              </Text>
            </View>
            <PerformanceTracker />
          </View>
          <View style={styles.middlePart}>
            <View>
              {user?.role === "Студент" && (
                <>
                  {activeDebts.length > 0 ? (
                    <FlatList
                      data={activeDebts}
                      renderItem={({ item }) => (
                        <View style={styles.debtItem}>
                          <Text
                            style={{
                              textAlign: "center",
                              fontFamily: "Roboto",
                              fontSize: 18,
                              backgroundColor: "#d9d9d9",
                              borderRadius: 7,
                              paddingLeft: 10,
                              paddingRight: 10,
                            }}
                          >
                            {getDebtTypeName(item.type)}
                          </Text>
                          <View
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-around",
                              width: "100%",
                            }}
                          >
                            <View
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              {formatDate(item.date)}
                            </View>
                            <Text style={styles.debtTitle}>
                              {getShortTitle(item.title)}
                            </Text>
                          </View>
                        </View>
                      )}
                      keyExtractor={(item, index) => index.toString()}
                    />
                  ) : (
                    <Text>Нет активных задолженностей</Text>
                  )}
                </>
              )}
            </View>
            <View style={styles.schedule}>
              <Text style={styles.title}>Расписание на сегодня</Text>
              {todaySchedule.length > 0 ? (
                <FlatList
                  style={{ backgroundColor: "#b7e9e1", borderRadius: 15 }}
                  data={todaySchedule}
                  renderItem={({ item }) => (
                    <View style={styles.scheduleItem}>
                      <Text style={styles.subject}>{item.subject}</Text>
                      <Text style={styles.time}>{item.time}</Text>
                    </View>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                />
              ) : (
                <Text style={{ fontFamily: "Roboto", fontSize: 16 }}>
                  На сегодня занятий нет
                </Text>
              )}
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
      </View>
    </View>
  );
};

const getDebtTypeName = (type) => {
  const types = {
    exam: "Экз.",
    dz: "ДЗ.",
    practice: "Практ.",
    control: "КР.",
  };
  return types[type] || type;
};
const getShortTitle = (title) => {
  const titles = {
    Информатика: "Инф.",
    Математика: "Мат.",
    Физика: "Физ.",
    "МДК 02": "МДК02",
  };
  return titles[title] || title;
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
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    padding: 40,
  },
  bpTxt: {
    fontFamily: "Roboto",
    fontSize: 13,
  },
  bottomPart: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  bpImage: {
    width: 40,
    height: 40,
    objectFit: "contain",
  },
  schedule: {
    backgroundColor: "#24b59d",
    borderRadius: 15,
    padding: 15,
    width: "65%",
  },
  bpTO: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  topPartPercent: {
    width: 93,
    height: 93,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  middlePart: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    height: "95%",
  },
  header: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topPart: {
    backgroundColor: "#F7E15C",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: 351,
    height: 110,
    borderRadius: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "Roboto",
    marginVertical: 15,
  },
  scheduleItem: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
  },
  subject: {
    fontSize: 16,
    fontFamily: "Roboto",
  },
  time: {
    color: "#666",
    fontFamily: "Roboto",
  },
  debtItem: {
    padding: 5,
    width: 100,
    height: 100,
    backgroundColor: "#b8c3c2",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    margin: 5,
    borderRadius: 26,
  },
  debtTitle: {
    fontFamily: "Roboto",
    fontSize: 13,
  },
});

export default MainScreen;
