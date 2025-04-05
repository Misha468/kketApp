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
import { useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HambMenu from "@/components/HambMenu";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { parseISO, isSameMonth, format, isValid } from "date-fns";
import { ru, te } from "date-fns/locale";
import { useUser } from "../config/UserContext";
const gradeBackgrounds = {
  "2": require("../assets/images/grades/bad.png"),
  "3": require("../assets/images/grades/bad.png"),
  "4": require("../assets/images/grades/ok.png"),
  "5": require("../assets/images/grades/best.png"),
  Н: require("../assets/images/grades/h.png"),
  УП: require("../assets/images/grades/yp.png"),
};
LocaleConfig.locales.ru = {
  monthNames: [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ],
  monthNamesShort: [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ],
  dayNames: [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье",
  ],
  dayNamesShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
};
LocaleConfig.defaultLocale = "ru";
const SubjectDetailsScreen = () => {
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const [hambVis, setHambVis] = useState(false);
  const [hambPh, setHambPh] = useState("hamb");
  const { user } = useUser();
  const route = useRoute();
  const { subject } = route.params || {};
  const [grades, setGrades] = useState({});
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const uniqueid = await AsyncStorage.getItem("uniqueid");
        if (!uniqueid || !subject?.id) return;

        const gradesRef = ref(db, `grades/${uniqueid}/${subject.id}`);
        const snapshot = await get(gradesRef);

        const gradesData = snapshot.exists() ? snapshot.val() : {};
        const formattedGrades = Object.entries(gradesData).reduce(
          (acc, [date, grade]) => {
            if (isValid(parseISO(date))) {
              acc[date] = {
                customStyles: { container: { backgroundColor: "transparent" } },
                grade: grade.toString(),
              };
            }
            return acc;
          },
          {}
        );

        setGrades(formattedGrades);
      } catch (error) {
        console.error("Ошибка загрузки оценок:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [subject?.id]);
  const handleMonthChange = (month) => {
    if (month?.dateString) {
      setCurrentMonth(parseISO(month.dateString));
    }
  };
  const DayComponent = ({ date, state, marking }: any) => {
    const safeDate = date?.dateString ? parseISO(date.dateString) : new Date();
    const isCurrentMonth = isSameMonth(safeDate, currentMonth);
    const grade = marking?.grade;
    const imageSource = grade && gradeBackgrounds[grade];
    return (
      <View
        style={[styles.dayContainer, !isCurrentMonth && styles.nonCurrentMonth]}
      >
        {imageSource ? (
          <ImageBackground
            source={imageSource}
            style={styles.backgroundImage}
            imageStyle={styles.imageStyle}
          >
            <Text
              style={[
                styles.dayText,
                state === "today" && styles.today,
                !isCurrentMonth && styles.nonCurrentMonthText,
              ]}
            >
              {date?.day || ""}
            </Text>
            {grade && (
              <Text
                style={[
                  styles.gradeBadge,
                  !["2", "3", "4", "5"].includes(grade) && styles.specialGrade,
                ]}
              >
                {grade}
              </Text>
            )}
          </ImageBackground>
        ) : (
          <Text
            style={[
              styles.dayText,
              state === "today" && styles.today,
              !isCurrentMonth && styles.nonCurrentMonthText,
            ]}
          >
            {date?.day || ""}
          </Text>
        )}
      </View>
    );
  };
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
          <Text style={styles.title}>{subject?.name}</Text>
          <Calendar
            current={currentMonth.toISOString().split("T")[0]}
            onMonthChange={handleMonthChange}
            dayComponent={DayComponent}
            markedDates={grades}
            firstDay={1}
            markingType="custom"
            theme={{
              calendarBackground: "white",
              textSectionTitleColor: "#black",
              textSectionTitleFontFamily: "Roboto",
              textMonthFontFamily: "Roboto",
              textMonthFontSize: 24,
              textweekFontFamily: "Roboto",
              textDayFontFamily: "Roboto",
              textDayFontSize: 16,
              monthTextColor: "#black",
              dayTextColor: "#black",
              textDisabledColor: "#555555",
              todayTextColor: "#FFD700",
              arrowColor: "black",
            }}
          />
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
  monthHeader: {
    color: "black",
    fontFamily: "Roboto",
    fontSize: 24,
    marginVertical: 10,
    textAlign: "center",
  },
  dayContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageStyle: {
    borderRadius: 8,
  },
  dayText: {
    fontSize: 24,
    color: "black",
    fontFamily: "Roboto",
  },
  today: {
    color: "red",
  },
  nonCurrentMonth: {
    opacity: 0.4,
  },
  nonCurrentMonthText: {
    color: "#AAAAAA",
  },
  gradeBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    paddingHorizontal: 4,
    fontFamily: "Roboto",
    fontSize: 12,
  },
  specialGrade: {
    backgroundColor: "transparent",
    color: "white",
    fontSize: 14,
    bottom: 0,
    right: 0,
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
  title: {
    fontFamily: "Roboto",
    fontSize: 24,
  },
});

export default SubjectDetailsScreen;
