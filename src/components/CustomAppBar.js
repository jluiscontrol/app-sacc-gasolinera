import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { sharedStyles } from "../styles/SharedStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import useThemeStore from "../stores/ThemeStore";

const CustomAppBar = (props) => {
  const {
    title,
    leftIcon,
    rightIcon,
    onLeftPress,
    onRightPress,
    center,
    titleColor,
    bold = false,
  } = props;

  const isDarkTheme = useThemeStore((state) => state.isDarkTheme);

  const backgroundColor = isDarkTheme ? "#181919" : "#ffffff";
  const contentColor = titleColor || (isDarkTheme ? "#f5f5f5" : "#1a1a1a");

  return (
    <SafeAreaView style={{ backgroundColor }} edges={["top"]}>
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={backgroundColor}
      />
      <View style={[styles.appBar, { backgroundColor }]}>
        <Pressable
          onPress={onLeftPress}
          style={({ pressed }) => ({
            ...styles.iconContainer,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Ionicons name={leftIcon} size={24} color={contentColor} />
        </Pressable>

        <View
          style={{
            ...styles.titleContainer,
            ...(center && styles.centeredTitleContainer),
          }}
        >
          <Text
            style={{
              paddingHorizontal: 10,
              fontSize: 18,
              color: contentColor,
              fontWeight: bold ? "500" : "normal",
            }}
          >
            {title?.toUpperCase() || ""}
          </Text>
        </View>

        <Pressable
          onPress={onRightPress}
          style={({ pressed }) => [
            styles.iconContainer,
            pressed && sharedStyles.pressed,
          ]}
        >
          <Ionicons
            name={rightIcon}
            size={rightIcon === "close" ? 32 : 24}
            color={contentColor}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appBar: {
    height: Platform.OS === "ios" ? 44 : 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  centeredTitleContainer: {
    alignItems: "center",
  },
  iconContainer: {
    // padding: 8,
  },
});

export default CustomAppBar;
