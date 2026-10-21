import { NavigationContainer } from "@react-navigation/native";
import Navigator from "./src/navigators/Navigator";
import {
  MD3LightTheme as DefaultTheme,
  MD3DarkTheme as DefaultDarkTheme,
  PaperProvider,
} from "react-native-paper";
import "react-native-gesture-handler";
import ModalOption from "./src/components/AlertOptionsComponent";
import { StatusBar } from "react-native";
import useThemeStore from "./src/stores/ThemeStore";
import { SafeAreaProvider } from "react-native-safe-area-context";
import CustomAlert from "./src/components/CustomAlert";
import { Colors } from "./src/utils/Colors";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    secondary: "#03dac4",
    secondaryContainer: Colors.primary,
    onSecondaryContainer: "white",
    onBackground: "#d5a200",
    background: "#f0f0f0",
    onSurface: "black",
  },
};

const darkTheme = {
  ...DefaultDarkTheme,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: "#e6b31e",
    secondary: "#947415",
    secondaryContainer: "#e6b31e",
    onSecondaryContainer: "black",
    background: "#1e1e1e",
    surface: "#2a2a2a",
    onBackground: "#f5f5f5",
    onSurface: "#f5f5f5",
    outline: "#444",
  },
};

function App() {
  const isDarkTheme = useThemeStore((state) => state.isDarkTheme);
  const currentTheme = isDarkTheme ? darkTheme : theme;

  return (
    <PaperProvider theme={currentTheme}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkTheme ? "light-content" : "dark-content"}
          backgroundColor={currentTheme.colors.background}
        />
        <ModalOption />
        <NavigationContainer theme={currentTheme}>
          <Navigator />
        </NavigationContainer>
        <CustomAlert />
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default App;
