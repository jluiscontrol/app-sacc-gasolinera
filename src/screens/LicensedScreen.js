import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { mergeStorage } from "../utils/Utils";
import Loader from "../components/Loader";
import axios from "axios";
import { Button, TextInput } from "react-native-paper";
import { sharedStyles } from "../styles/SharedStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/CustomAlert";
import { Colors } from "../utils/Colors";
import { Image } from "expo-image";

export default function LicensedScreen() {
  const navigation = useNavigation();
  const [ruc, setRuc] = useState("");
  const [password, setPassword] = useState("");
  const [isloading, setIsLoading] = useState(false);
  const [seePassword, setSeePassword] = useState(false);

  const licensedAuth = async (data, token = "") => {
    const SERVER_URL = "https://sacc.sistemascontrol.ec";
    const formData = new URLSearchParams();
    formData.append("clave", data.clave);
    formData.append("ruc", data.ruc);
    formData.append("referencia", "GASOLINERA");

    const LICENSED_ENDPOINT = `${SERVER_URL}/api_control_identificaciones/public/licencia/obtener`;

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Authorization:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjMzMjMwMDM5MTc3LCJhdWQiOiJkMTM5MjhlYzAwMDg4Nzg0ZWMyOTA5MWNmMWM4OWJiN2JlMzAwOGE2IiwiZGF0YSI6eyJ1c3VhcmlvSWQiOiIxIiwibm9tYnJlIjoiQ09OVFJPTCJ9fQ.JcCt-17CJa8KZLWK1BzetcgReAksrlHFXoDug0fNaVk",
        "Accept-X-Control-Y": "controlsistemasjl.com",
      },
    };

    try {
      const response = await axios.post(
        LICENSED_ENDPOINT,
        formData.toString(),
        config,
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener licencia:", error);
      throw error;
    }
  };

  const handleLicensed = async () => {
    setIsLoading(true);

    if (ruc.trim() === "") {
      showAlert({
        title: "Información",
        message: "Debe ingresar un RUC válido!",
      });
      setIsLoading(false);
      return;
    }

    if (password.trim() === "") {
      showAlert({
        title: "Información",
        message: "Debe ingresar una contraseña, por favor verifique!",
      });
      setIsLoading(false);
      return;
    }

    const licensedData = {
      ruc: ruc.trim(),
      clave: password,
      referencia: "GASOLINERA",
    };

    try {
      const res = await licensedAuth(licensedData);

      if (res.statusCode === 200 && Object.keys(res.data).length > 0) {
        const url = res.data.ruta;
        const decodeUrl = url.replace(/\*/g, "/");
        const { client_id, client_password } = res.data;

        mergeStorage(
          {
            licensed: {
              route: decodeUrl,
              client_id,
              client_password,
            },
          },
          "configuration",
        );

        showAlert({
          title: "Confirmación",
          message: "Su licencia se validó de manera satisfactoria!",
          actions: [
            {
              label: "Ok",
              onPress: () => navigation.navigate("Login"),
            },
          ],
        });
      } else {
        showAlert({
          title: "Información",
          message: "Datos de licencia no válidos, por favor digite nuevamente!",
        });
      }
    } catch (error) {
      showAlert({
        title: "Error",
        message:
          "Upps, ha ocurrido un error. Contacte con el administrador o verifique su conexión a internet.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <Loader loading={isloading} />
          <View style={{ paddingHorizontal: 15 }}>
            <View style={{ alignItems: "center" }}>
              <Image
                style={{ width: 350, height: 300 }}
                contentFit="contain"
                source={require("../../assets/images/logo_control.png")}
              />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "500",
                color: "#333",
                marginBottom: 20,
              }}
            >
              Obtener Licencia
            </Text>
            <TextInput
              label={"RUC del contribuyente"}
              autoCapitalize={"none"}
              mode={"outlined"}
              left={<TextInput.Icon icon="account-outline" />}
              value={ruc}
              onChangeText={setRuc}
              style={sharedStyles.textInput}
            />
            <View style={{ height: 5 }} />
            <TextInput
              label={"Contraseña"}
              autoCapitalize={"none"}
              mode={"outlined"}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={seePassword ? "eye-off-outline" : "eye-outline"}
                  onPress={() => setSeePassword(!seePassword)}
                />
              }
              secureTextEntry={!seePassword}
              value={password}
              onChangeText={setPassword}
              style={sharedStyles.textInput}
            />
            <View style={{ height: 20 }} />
            <Button mode="contained" onPress={handleLicensed}>
              Verificar Licencia
            </Button>

            <View
              style={{
                flexDirection: "row",
                paddingVertical: 10,
                paddingHorizontal: 15,
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: "#495157" }}>
                ¿Ya activaste la licencia?
              </Text>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{ color: Colors.primary, fontWeight: "700" }}>
                  Iniciar sesión
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
