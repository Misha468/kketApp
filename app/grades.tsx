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
const gradeImages = {
  low: require("../assets/images/grades/bad.png"),
  medium: require("../assets/images/grades/ok.png"),
  high: require("../assets/images/grades/best.png"),
};
const GradesScreen = () => {
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const [hambVis, setHambVis] = useState(false);
  const [hambPh, setHambPh] = useState("hamb");
  const [subjects, setSubjects] = useState([]);
  const [average, setAverage] = useState(0);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await AsyncStorage.getItem("uniqueid");
        const userRef = ref(db, `users/${user}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        const groupRef = ref(db, `groups/${userData.groupId}`);
        const groupSnapshot = await get(groupRef);
        const groupData = groupSnapshot.val();
        const gradesRef = ref(db, `grades/${user}`);
        const gradesSnapshot = await get(gradesRef);
        const gradesData = gradesSnapshot.val();
        const processedSubjects = groupData.subjects.map((subjectId) => {
          const subjectGrades = gradesData?.[subjectId] || {};
          const numericGrades = Object.values(subjectGrades)
            .map((grade) => {
              const num = Number(grade);
              return isNaN(num) ? null : num;
            })
            .filter((grade) => grade !== null);

          const average =
            numericGrades.length > 0
              ? numericGrades.reduce((sum, grade) => sum + grade, 0) /
                numericGrades.length
              : 0;

          return {
            id: subjectId,
            name: subjectId,
            average: average.toFixed(1),
            image: getGradeImage(average),
          };
        });
        const validSubjects = processedSubjects.filter((s) => s.average > 0);
        const totalAverage =
          validSubjects.length > 0
            ? validSubjects.reduce((sum, s) => sum + parseFloat(s.average), 0) /
              validSubjects.length
            : 0;

        setSubjects(processedSubjects);
        setAverage(totalAverage.toFixed(1));
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  const getGradeImage = (average) => {
    if (average < 3.6) return gradeImages.low;
    if (average >= 3.6 && average <= 4.5) return gradeImages.medium;
    if (average > 4.5) return gradeImages.high;
    return gradeImages.low;
  };
  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setLoading(false);
        nav.navigate("subjectdetails", {
          subject: {
            id: item.id,
            name: item.name,
          },
        });
      }}
    >
      <View style={styles.subjectCard}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <ImageBackground
          source={item.image}
          style={styles.subject}
          imageStyle={styles.cardImage}
        >
          <Text style={styles.subjectAverage}>{item.average}</Text>
        </ImageBackground>
      </View>
    </TouchableOpacity>
  );
  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }
  const hambHandler = () => {
    setHambVis(!hambVis);
    setHambPh(hambPh == "hamb" ? "cross" : "hamb");
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
            <Text style={{ fontFamily: "Roboto", fontSize: 30 }}>
              Итоговые оценки
            </Text>
            <FlatList
              data={subjects}
              renderItem={renderSubjectItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Нет данных об оценках</Text>
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
    width: "100%",
    height: "100%",
  },
  listContent: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: 10,
  },
  subjectName: {
    fontFamily: "Roboto",
    fontSize: 20,
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
  subjectCard: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e3e3e3",
    height: 60,
    alignItems: "center",
    borderRadius: 15,
    padding: 10,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  subject: {
    width: 50,
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImage: {
    borderRadius: 10,
  },
  subjectAverage: {
    fontFamily: "Roboto",
    fontSize: 25,
    color: "white",
  },
});

export default GradesScreen;
