import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

const ProgressCircle = ({ percentage = 91, radius = 45, strokeWidth = 15 }) => {
  const containerSize = radius * 2 + strokeWidth * 2;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const color = getColor(percentage);

  const circleCircumference = 2 * Math.PI * (radius - strokeWidth / 2);
  const maxOffset =
    circleCircumference -
    (circleCircumference * Math.min(percentage, 100)) / 100;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circleCircumference, maxOffset],
  });

  function getColor(percent: any) {
    if (percent > 76) {
      return "#1FCB13";
    } else {
      if (percent > 40) {
        return "#ED5300";
      } else {
        return "#CB1313";
      }
    }
  }

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: containerSize,
        height: containerSize,
        backgroundColor: "rgba(0,255,0,0.1",
      }}
    >
      <Svg
        height={radius * 2}
        width={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        style={{
          overflow: "visible",
        }}
      >
        <G rotation="-90" origin={`${radius}, ${radius}`}>
          <Circle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            stroke="#e6e6e6"
            fill="transparent"
            strokeWidth={strokeWidth}
          />
          <AnimatedCircle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circleCircumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={{ position: "absolute" }}>
        <Text
          style={{
            fontSize: radius * 0.35,
            color: "black",
            fontFamily: "Roboto",
          }}
        >
          {percentage}%
        </Text>
      </View>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default ProgressCircle;
