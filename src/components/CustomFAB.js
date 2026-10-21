import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { sharedStyles } from "../styles/SharedStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../utils/Colors";

export default function CustomFAB(props) {
  const {
    onPress,
    color = "#6200ee",
    text,
    icon = "add",
    align = "right",
  } = props;

  return (
    <SafeAreaView
      style={[
        styles.container,
        align === "left"
          ? { left: 20, right: "auto", alignItems: "flex-start" }
          : { right: 20, left: "auto" },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && sharedStyles.pressed,
          { backgroundColor: Colors.primary },
        ]}
        onPress={onPress}
      >
        <Ionicons name={icon} size={25} color="#fff" />
        {text && (
          <View>
            <View style={{ width: 5 }} />
            <Text style={styles.fabText}>{text}</Text>
          </View>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 10,
    zIndex: 999,
  },
  fab: {
    paddingHorizontal: 20,
    flexDirection: "row",
    height: 60,
    borderRadius: 15,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 2.5,
    elevation: 5,
  },
  fabText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
});
