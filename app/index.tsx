import React, { useEffect } from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
const SplashScreen = () => {
  const navigation = useNavigation();
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate("auth");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <ImageBackground
      source={require("../assets/images/bcg.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Добро пожаловать!</Text>
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    color: "black",
    fontFamily: "Roboto",
  },
});

export default SplashScreen;
