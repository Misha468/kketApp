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
const daysOrder = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const daysTranslation = {
  monday: "Понедельник",
  tuesday: "Вторник",
  wednesday: "Среда",
  thursday: "Четверг",
  friday: "Пятница",
};
const ScheduleScreen = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const [hambVis, setHambVis] = useState(false);
  const [hambPh, setHambPh] = useState("hamb");
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const group = await AsyncStorage.getItem("group");
        const scheduleRef = ref(db, `schedule/${group}/days`);
        const snapshot = await get(scheduleRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const orderedData = daysOrder.map((day) => ({
            dayKey: day,
            dayName: daysTranslation[day],
            lessons: data[day] || [],
          }));
          setSchedule(orderedData);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchSchedule();
  });

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
          <View
            style={{
              backgroundColor: "#24B59D",
              padding: 5,
              borderRadius: 15,
              width: "100%",
              marginBottom: 15,
            }}
          >
            <Text
              style={{
                fontFamily: "Roboto",
                fontSize: 22,
                textAlign: "center",
                marginBottom: 25,
              }}
            >
              Расписание занятий
            </Text>
            <FlatList
              data={schedule}
              keyExtractor={(item) => item.dayKey}
              style={{ overflow: "hidden", maxHeight: 540 }}
              renderItem={({ item }) => (
                <View style={styles.dayContainer}>
                  <Text style={styles.dayHeader}>{item.dayName}</Text>
                  <View
                    style={{
                      borderRadius: 25,
                      padding: 20,
                      overflow: "hidden",
                      display: "flex",
                      backgroundColor: "white",
                      flexDirection: "column",
                      gap: 5,
                    }}
                  >
                    {item.lessons.length > 0
                      ? item.lessons.map((lesson: any, index: any) => (
                          <View key={index}>
                            <Text style={styles.subject}>{lesson.subject}</Text>
                            <Text style={styles.time}>{lesson.time}</Text>
                          </View>
                        ))
                      : null}
                  </View>
                </View>
              )}
            />
          </View>
          <View style={styles.bottomPart}>
            <TouchableOpacity style={styles.bpTO}>
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
    justifyContent: "space-around",
    width: "100%",
  },
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayContainer: {
    marginBottom: 25,
  },
  dayHeader: {
    fontSize: 20,
    marginBottom: 15,
    paddingLeft: 10,
    fontFamily: "Roboto",
  },
  time: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: "Roboto",
  },
  subject: {
    fontSize: 20,
    fontFamily: "Roboto",
    marginBottom: 5,
  },
});

export default ScheduleScreen;
