import { Text, Pressable, StyleSheet } from "react-native";
import GlobalIcon from "./GlobalIcon";
import { Colors } from "../utils/Colors";

const CustomCheckBox = (props) => {
  const { checked, onPress, title } = props;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={onPress}
    >
      <GlobalIcon
        family="ion"
        name={checked ? "checkbox" : "square-outline"}
        size={24}
        color={checked ? Colors.primary : "#757575"}
      />
      <Text style={{ paddingLeft: 5, fontWeight: "bold" }}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default CustomCheckBox;
