import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  Modal,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ref, onValue, set } from "firebase/database";
import { db } from "../config/firebase";
import HambMenu from "../components/HambMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Group = { id: string; name: string };
type Subject = { id: string; name: string };
type Student = { id: string; name: string; grade?: string };

const GradeBadge = ({ grade }: { grade?: string }) => {
  const getBackgroundColor = () => {
    switch (grade) {
      case "5":
        return "#2FA309";
      case "4":
        return "#ED8D06";
      case "3":
        return "#D93939";
      case "2":
        return "#D93939";
      case "Н":
        return "#527CB4";
      case "УП":
        return "#81B2E0";
      default:
        return "#E0E0E0";
    }
  };

  return (
    <View
      style={[styles.gradeBadge, { backgroundColor: getBackgroundColor() }]}
    >
      <Text style={styles.gradeText}>{grade || "-"}</Text>
    </View>
  );
};

const TeacherJournalScreen = () => {
  const navigation = useNavigation();
  const [hambVisible, setHambVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [hambPh, setHambPh] = useState("hamb");
  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        const id = await AsyncStorage.getItem("uniqueid");
        if (id) {
          setTeacherId(id);
          loadTeacherGroups(id);
        }
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTeacherData();
    if (selectedGroup && selectedSubject) {
      loadGroupStudents(selectedGroup.id);
    }
  }, [date, selectedSubject]);
  const loadTeacherGroups = (teacherId: string) => {
    const subjectsRef = ref(db, "subjects");
    onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const groups = new Set<string>();
        Object.values(data).forEach((subject: any) => {
          if (subject.teacher === teacherId && subject.groups) {
            subject.groups.forEach((group: string) => groups.add(group));
          }
        });
        setGroups(Array.from(groups).map((id) => ({ id, name: id })));
      }
    });
  };

  const loadGroupSubjects = (groupId: string) => {
    const subjectsRef = ref(db, "subjects");
    onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val();
      const subs = Object.entries(data)
        .filter(
          ([_, s]: any) =>
            s.groups?.includes(groupId) && s.teacher === teacherId
        )
        .map(([id, s]: any) => ({ id, name: s.name }));
      setSubjects(subs);
    });
  };

  const loadGroupStudents = (groupId: string) => {
    const usersRef = ref(db, "users");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const studs = Object.entries(data)
        .filter(([_, u]: any) => u.groupId === groupId && u.role === "Студент")
        .map(([id, u]: any) => ({ id, name: u.username }));
      setStudents(studs);
      loadGrades(studs);
    });
  };

  const loadGrades = (students: Student[]) => {
    if (!selectedSubject) return;
    const formattedDate = format(date, "yyyy-MM-dd");
    const gradesRef = ref(db, "grades");
    onValue(gradesRef, (snapshot) => {
      const data = snapshot.val();
      const updated = students.map((student) => {
        const grade = data[student.id]?.[selectedSubject.name]?.[formattedDate];
        return {
          ...student,
          grade: grade || undefined,
        };
      });
      setStudents(updated);
    });
  };

  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDate(selectedDate);
    if (selectedGroup && selectedSubject) {
      loadGroupStudents(selectedGroup.id);
    }
  };

  const saveGrade = (grade: string) => {
    if (!selectedStudent || !selectedSubject) return;

    const path = `grades/${selectedStudent.id}/${selectedSubject.name}/${format(
      date,
      "yyyy-MM-dd"
    )}`;
    set(ref(db, path), grade)
      .then(() => {
        setStudents(
          students.map((s) =>
            s.id === selectedStudent.id ? { ...s, grade } : s
          )
        );
        setGradeModalVisible(false);
      })
      .catch((error) => console.error("Ошибка:", error));
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={styles.studentItem}
      onPress={() => {
        setSelectedStudent(item);
        setGradeModalVisible(true);
      }}
    >
      <Text style={styles.studentName}>{item.name}</Text>
      <GradeBadge grade={item.grade} />
    </TouchableOpacity>
  );

  const renderGradeModal = () => (
    <Modal visible={gradeModalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Выберите оценку для {selectedStudent?.name}
          </Text>
          <View style={styles.gradesGrid}>
            {["5", "4", "3", "2", "УП", "Н"].map((grade) => (
              <TouchableOpacity
                key={grade}
                style={styles.gradeButton}
                onPress={() => saveGrade(grade)}
              >
                <GradeBadge grade={grade} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setGradeModalVisible(false)}
          >
            <Text style={styles.closeText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  const hambHandler = () => {
    setHambVisible(!hambVisible);
    setHambPh(hambPh == "hamb" ? "cross" : "hamb");
  };
  return (
    <ImageBackground
      source={require("../assets/images/bcg5.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => hambHandler()}>
            <Image
              source={
                hambPh == "hamb"
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

        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Журнал оценок</Text>
          {hambVisible == true ? <HambMenu /> : null}

          <View style={styles.selectionBlock}>
            {selectedGroup && (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>
                  {selectedGroup.name}
                </Text>
              </View>
            )}
            {selectedSubject && (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>
                  {selectedSubject.name}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{format(date, "dd.MM.yyyy")}</Text>
            </TouchableOpacity>
          </View>

          {selectedSubject ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedSubject(null)}
            >
              <Text style={styles.backButtonText}>← Назад</Text>
            </TouchableOpacity>
          ) : (
            selectedGroup && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedGroup(null)}
              >
                <Text style={styles.backButtonText}>← Назад</Text>
              </TouchableOpacity>
            )
          )}

          {!selectedGroup ? (
            <FlatList
              data={groups}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => {
                    setSelectedGroup(item);
                    loadGroupSubjects(item.id);
                    loadGroupStudents(item.id);
                  }}
                >
                  <Text style={styles.listItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          ) : !selectedSubject ? (
            <FlatList
              data={subjects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => setSelectedSubject(item)}
                >
                  <Text style={styles.listItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              renderItem={renderStudentItem}
            />
          )}

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={date}
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            locale="ru_RU"
            display="inline"
          />

          {renderGradeModal()}
        </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("schedule")}
          >
            <Image
              source={require("../assets/images/icons/schedule.png")}
              style={styles.navIcon}
            />
            <Text style={styles.navText}>Расписание</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("chats")}
          >
            <Image
              source={require("../assets/images/icons/chats.png")}
              style={styles.navIcon}
            />
            <Text style={styles.navText}>Чаты</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate("profile")}
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
    backgroundColor: "white",
    resizeMode: "cover",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
    width: "100%",
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
  },
  hambIcon: {
    width: 45,
    height: 45,
    objectFit: "contain",
  },
  logo: {
    width: 100,
    height: 75,
    objectFit: "contain",
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
    paddingBottom: 60,
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontFamily: "Roboto",
    marginBottom: 20,
  },
  selectionBlock: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    gap: 10,
  },
  selectedItem: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  selectedItemText: {
    fontFamily: "Roboto",
    color: "#fff",
    fontSize: 14,
  },
  dateButton: {
    backgroundColor: "#58DDCD",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  dateText: {
    fontFamily: "Roboto",
    color: "#fff",
    fontSize: 14,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontFamily: "Roboto",
    fontSize: 16,
  },
  listItem: {
    backgroundColor: "#ededeb",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  listItemText: {
    fontSize: 16,
    fontFamily: "Roboto",
  },
  studentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ededeb",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  studentName: {
    fontSize: 16,
    fontFamily: "Roboto",
    flex: 1,
  },
  gradeBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  gradeText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Roboto",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Roboto",
    textAlign: "center",
    marginBottom: 20,
  },
  gradesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
  },
  gradeButton: {
    padding: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#F44336",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontFamily: "Roboto",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: "center",
  },
  navIcon: {
    width: 28,
    objectFit: "contain",
    height: 28,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    fontFamily: "Roboto",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default TeacherJournalScreen;
