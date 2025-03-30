import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  FlatList,
} from "react-native";
import React, { useCallback, useState } from "react";
import { ref, get } from "firebase/database";
import { useUser } from "../config/UserContext";
import { db, auth } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
const roleText = {
  Студент: "студента",
  Преподаватель: "преподавателя",
};
const AuthScreen = () => {
  const { login } = useUser();
  const [email, setEmail] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nxtButtonDisabled, setNextButtonDisabled] = useState(true);
  const [form, setForm] = useState("form1");
  const navigation = useNavigation();
  const getErrorMessage = (code: any) => {
    switch (code) {
      case "auth/invalid-email":
        return "Некорректный формат email";
      case "auth/user-disabled":
        return "Аккаунт заблокирован";
      case "auth/user-not-found":
        return "Пользователь не найден";
      case "auth/wrong-password":
        return "Неверный пароль";
      case "auth/too-many-requests":
        return "Слишком много попыток. Попробуйте позже";
      case "auth/network-request-failed":
        return "Ошибка сети. Проверьте подключение";
      case "auth/operation-not-allowed":
        return "Метод входа отключен";
      case "auth/missing-password":
        return "Введите пароль";
      case "database/permission-denied":
        return "Нет прав доступа";
      case "database/disconnected":
        return "Соединение с базой разорвано";
      case "database/unavailable":
        return "Сервис недоступен";
      case "invalid-input":
        return "Заполните все поля";
      case "user-data-not-found":
        return "Данные пользователя отсутствуют";
      default:
        return "Ошибка при входе. Попробуйте снова";
    }
  };
  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      setError(getErrorMessage("invalid-input"));
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error();
      }
      if (snapshot.val().role === role) {
        const userData = snapshot.val();
        const uniqueid = userCredential.user.uid;
        const groupId = userData.groupId;
        await login(userData, uniqueid, groupId);
        navigation.navigate("main");
      } else {
        throw new Error();
      }
    } catch (err: any) {
      const errorCode = err.code || err.message;
      setError(getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };
  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded), [];
  });
  const handleRoleSelect = (selectedRole: any) => {
    setRole(selectedRole);
    setExpanded(false);
    setNextButtonDisabled(false);
  };
  const goNext = () => {
    setForm("form2");
  };
  const goBack = () => {
    setForm("form1");
  };
  return (
    <ImageBackground
      source={require("../assets/images/bcg4.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <Image
          source={require("../assets/images/logo.png")}
          style={{ width: 200, height: 200, objectFit: "contain" }}
        />
        {form === "form1" ? (
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              alignItems: "flex-end",
            }}
          >
            <View style={styles.form1}>
              <Text
                style={{ color: "black", fontFamily: "Roboto", fontSize: 24 }}
              >
                Войти как
              </Text>
              <TouchableOpacity
                onPress={toggleExpanded}
                style={expanded ? styles.roleSelect2 : styles.roleSelect1}
              >
                <Image
                  source={require("../assets/images/icons/role.png")}
                  style={{ width: 24, height: 24, objectFit: "contain" }}
                />
                <View
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <Text style={expanded ? styles.haveText : styles.text}>
                    {role || ""}
                  </Text>
                  {expanded ? (
                    <View style={styles.roleList}>
                      <TouchableOpacity
                        onPress={() => handleRoleSelect("Студент")}
                      >
                        <Text
                          style={
                            role === "Студент"
                              ? styles.role
                              : styles.selectedRole
                          }
                        >
                          Студент
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRoleSelect("Преподаватель")}
                      >
                        <Text
                          style={
                            role === "Преподаватель"
                              ? styles.role
                              : styles.selectedRole
                          }
                        >
                          Преподаватель
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
            <View>
              {nxtButtonDisabled ? null : (
                <TouchableOpacity style={styles.nxt} onPress={goNext}>
                  <Text
                    style={{
                      color: "black",
                      fontFamily: "Roboto",
                      fontSize: 16,
                    }}
                  >
                    Далее
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}
        {form === "form2" ? (
          <View>
            <TouchableOpacity style={styles.bck} onPress={goBack}>
              <Image
                source={require("../assets/images/icons/back.png")}
                style={{ width: 24, height: 24, objectFit: "contain" }}
              />
            </TouchableOpacity>
            <View style={styles.form}>
              <View style={styles.titleWrap}>
                <Text style={styles.title}>Вход</Text>
                <Text style={styles.subtitle}>для {roleText[role]}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Логин"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={"gray"}
              />
              <TextInput
                placeholder="Пароль"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={"gray"}
              />
              {error ? (
                <Text style={{ color: "red", fontFamily: "Roboto" }}>
                  {error}
                </Text>
              ) : null}
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Войти</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  bck: {
    width: 40,
    height: 31,
    backgroundColor: "#C4D8D5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginBottom: 20,
  },
  nxt: {
    width: 99,
    height: 31,
    backgroundColor: "#C4D8D5",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  roleSelect1: {
    backgroundColor: "white",
    padding: 10,
    width: 269,
    borderRadius: 21,
    display: "flex",
    flexDirection: "row",
    borderWidth: 1,
    alignItems: "center",
    gap: 25,
  },
  selectedRole: {
    color: "black",
    fontSize: 15,
    fontFamily: "Roboto",
  },
  text: {
    fontFamily: "Roboto",
    color: "black",
    fontSize: 15,
  },
  haveText: {
    fontFamily: "Roboto",
    color: "black",
    fontSize: 15,
    borderBottomColor: "gray",
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  role: {
    display: "none",
    position: "absolute",
    color: "black",
    fontSize: 15,
    fontFamily: "Roboto",
  },
  roleSelect2: {
    backgroundColor: "white",
    padding: 10,
    width: 269,
    height: 110,
    borderRadius: 21,
    display: "flex",
    flexDirection: "row",
    borderWidth: 1,
    gap: 25,
  },
  roleList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxHeight: 75,
  },
  titleWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  subtitle: {
    fontFamily: "Roboto",
  },
  title: {
    fontFamily: "Roboto",
    fontSize: 24,
  },
  form: {
    backgroundColor: "#24b59d",
    padding: 20,
    borderRadius: 21,
    width: 280,
    display: "flex",
    gap: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  form1: {
    backgroundColor: "#24b59d",
    padding: 20,
    borderRadius: 21,
    width: 297,
    display: "flex",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    display: "flex",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    textAlign: "center",
    color: "white",
    marginBottom: 30,
    fontFamily: "Roboto",
  },
  input: {
    height: 29,
    backgroundColor: "white",
    width: 236,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontFamily: "Roboto",
    fontSize: 16,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#E5C83C",
    width: 99,
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "black",
    fontSize: 20,
    fontFamily: "Roboto",
  },
});

export default AuthScreen;
