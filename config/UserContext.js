import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Ошибка загрузки пользователя:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#09041C",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }
  const login = async (userData, uniqueid, groupId) => {
    setUser(userData);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    await AsyncStorage.setItem("uniqueid", uniqueid);
    await AsyncStorage.setItem("group", groupId);
  };
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };
  const subjectAdd = async (subject) => {
    await AsyncStorage.setItem("subject", subject);
  };
  return (
    <UserContext.Provider value={{ user, login, logout, loading, subjectAdd }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
