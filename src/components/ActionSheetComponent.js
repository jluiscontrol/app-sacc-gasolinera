import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { sharedStyles } from "../styles/SharedStyles";

export default function ActionSheetComponent(props) {
  const { setIsOpenModalAcciones, buttons } = props;

  return (
    <View style={styles.container}>
      {buttons.map((button, index) => (
        <Pressable
          key={index}
          onPress={() => {
            button.onPress?.();
            setIsOpenModalAcciones(false);
          }}
          style={({ pressed }) => [styles.row, pressed && sharedStyles.pressed]}
        >
          <View style={[styles.iconContainer]}>
            <MaterialIcons
              name={button.iconName}
              size={25}
              color={button.color}
            />
          </View>

          <Text style={styles.text}>{button.text}</Text>

          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
  },
});
