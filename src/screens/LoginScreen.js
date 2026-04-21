import { useState, useCallback } from "react";
import {
  View,
  Text,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import WhatsappSVG from "../../assets/images/misc/whatsapp.svg";
import FacebookSVG from "../../assets/images/misc/facebook.svg";
import InstagramSVG from "../../assets/images/misc/instagram.svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Loader from "../components/Loader";
import { getToken, mergeStorage } from "../utils/Utils";
import useAuthStore from "../stores/AuthStore";
import instance from "../utils/Instance";
import { Button, TextInput } from "react-native-paper";
import { sharedStyles } from "../styles/SharedStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/CustomAlert";
import { Colors } from "../utils/Colors";
import { Image } from "expo-image";

export default function LoginScreen() {
  const navigation = useNavigation();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isloading, setIsLoading] = useState(false);
  const [objLicensed, setObjLicensed] = useState({});
  const [periodofiscal_id, setPeriodofiscal_id] = useState(0);
  const [usuario, setUsuario] = useState({
    username: "",
    email: "",
    periodosfiscales: [],
  });
  const [isOpenPeriodoFiscal, setIsOpenPeriodoFiscal] = useState(false);
  const [seePassword, setSeePassword] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getLicensed();
      return () => {};
    }, []),
  );

  const groupedData = usuario.periodosfiscales.reduce((acc, obj) => {
    const objContribuyente = obj;
    const key = `${objContribuyente.contribuyente_id} - ${objContribuyente.razonsocial}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});

  const getLicensed = async () => {
    const configuration = await getToken("configuration");
    if (!(configuration && "licensed" in configuration)) {
      showAlert({
        title: "INFORMACIÓN",
        message:
          "No se ha obtenido una licencia, a continuacion será redirigido a esta ventana para que la obtenga",
        actions: [
          {
            label: "Ok",
            onPress: () => navigation.navigate("Licensed"),
          },
        ],
      });
      return;
    } else {
      setObjLicensed(configuration.licensed);
    }
    if (configuration && "periodofiscal_id" in configuration) {
      setPeriodofiscal_id(configuration.periodofiscal_id);
    }
  };

  const actionLogin = async () => {
    if (username === "" || password === "") {
      showAlert({
        title: "INFORMACIÓN",
        message: "Campos incompletos, por favor verifique",
      });
      return;
    }
    setIsLoading(true);

    const data = {
      grant_type: "password",
      client_id: objLicensed.client_id,
      client_secret: objLicensed.client_password,
      username,
      password,
    };

    const LOGIN_ENDPOINT = "token";

    try {
      const res = await instance.post(LOGIN_ENDPOINT, data);

      const response = res.data;
      mergeStorage(
        { encodetoken: response.access_token, userData: response.user },
        "configuration",
      );
      setIsLoading(false);
      setUsuario(response.user);
      if (periodofiscal_id !== 0) {
        await loginDatosMaestros(periodofiscal_id, response.user);
      } else {
        setIsOpenPeriodoFiscal(true);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      showAlert({
        title: "Alerta",
        message:
          "Ha ocurrido un problema de conexión con el servidor, por favor verifique su conexión a internet",
      });
    }
  };

  const loginDatosMaestros = async (
    periodofiscal = periodofiscal_id,
    usuarioData = usuario,
  ) => {
    setIsLoading(true);
    try {
      const resp = await instance.get(
        `api/v1/general/datos/maestros/configuracion/usuario/${periodofiscal}`,
      );
      if (resp.data.status === 200) {
        const {
          items: configurationUser,
          porcentajeImpuesto: porcentajeIVA,
          ...resto
        } = resp.data;

        mergeStorage(
          {
            configurationUser,
            porcentajeIVA,
            periodofiscal_id: periodofiscal,
            ...resto,
          },
          "configuration",
        );
        try {
          let socketParam = {};
          socketParam = JSON.parse(resp.data.contribuyente?.apisocket ?? "{}");
          await instance.post(
            `${socketParam.url}/${socketParam?.pathapi ?? ""}/activarUsuario`,
            {
              usuarioId: usuarioData.user_id,
              rucContribuyente: resp.data.contribuyente.ruc,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        } catch (error) {}
        await login();
      } else {
        showAlert({
          title: "INFORMACIÓN",
          message:
            "Hubo un problema al consultar la configuración opcional del usuario en el servidor",
        });
        await logout();
      }
    } catch (error) {
      let messageError = "";
      if (error.response && error.response.data) {
        messageError =
          error.response.data.detail ||
          error.response.data.error.message ||
          "Error desconocido";
      }
      showAlert({
        title: "INFORMACIÓN",
        message: `Hubo un problema al consultar la configuración opcional del usuario en el servidor: ${messageError}`,
      });
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const openSelectPeriodoFiscal = () => {
    return (
      <View
        style={{ backgroundColor: "#d6d9da", width: "90%", borderRadius: 20 }}
      >
        <View
          style={{
            paddingVertical: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
          }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 15 }}>
            SELECCIONE UN PERIODO FISCAL
          </Text>
        </View>
        {Object.keys(groupedData).map((key) => {
          return (
            <View
              key={key}
              style={{
                margin: 10,
                backgroundColor: "#fff",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  color: Colors.primary,
                  fontSize: 15,
                }}
              >
                &bull; {key}
              </Text>
              <View>
                {groupedData[key].map((item, index) => {
                  return (
                    <Pressable
                      key={index}
                      onPress={() => {
                        setIsOpenPeriodoFiscal(false);
                        loginDatosMaestros(item.id, usuario);
                      }}
                      style={({ pressed }) => ({
                        padding: 10,
                        paddingVertical: 15,
                        flexDirection: "row",
                        backgroundColor: "#fff",
                        alignItems: "center",
                        opacity: pressed ? 0.5 : 1,
                      })}
                    >
                      <Ionicons
                        name="arrow-forward-outline"
                        size={20}
                        color="#666"
                        style={{ marginRight: 5 }}
                      />
                      <Text>{item.nombre}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <>
      <Modal transparent={true} visible={isOpenPeriodoFiscal}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          {openSelectPeriodoFiscal()}
        </View>
      </Modal>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        behavior={"padding"}
      >
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Loader loading={isloading} />
          <View style={{ paddingHorizontal: 15 }}>
            <View style={{ alignItems: "center" }}>
              <Image
                source={require("../../assets/images/logo_gasolinera.png")}
                style={{
                  height: 300,
                  marginBottom: 20,
                  width: 500,
                  resizeMode: "contain",
                }}
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
              Inicio de Sesion
            </Text>
            <TextInput
              label={"Usuario"}
              mode={"outlined"}
              autoCapitalize={"none"}
              left={<TextInput.Icon icon="account-outline" />}
              value={username}
              onChangeText={setUsername}
              style={sharedStyles.textInput}
            />
            <View style={{ height: 5 }} />
            <TextInput
              label={"Contraseña"}
              mode={"outlined"}
              autoCapitalize={"none"}
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
            <View style={{ height: 15 }} />
            <Button
              buttonColor={Colors.primary}
              mode="contained"
              onPress={actionLogin}
            >
              Iniciar Sesion
            </Button>
          </View>
          <View
            style={{
              flexDirection: "row",
              paddingVertical: 10,
              paddingHorizontal: 35,
              marginBottom: 10,
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#495157" }}>¿No has activado Licencia?</Text>
            <Pressable
              onPress={() => navigation.navigate("Licensed")}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ color: Colors.primary, fontWeight: "700" }}>
                Activar
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: "#ccc",
              marginHorizontal: 15,
              marginBottom: 7,
            }}
          />
          <Text
            style={{ textAlign: "center", color: "#495157", marginBottom: 15 }}
          >
            Contacto y nuestras redes ...
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 25,
              backgroundColor: "#FFFFFF",
              paddingBottom: 30,
            }}
          >
            <Pressable
              onPress={() =>
                Linking.openURL(
                  `https://api.whatsapp.com/send?phone=593992671556`,
                )
              }
              style={({ pressed }) => [
                styles.iconButton,
                pressed && sharedStyles.pressed,
              ]}
            >
              <WhatsappSVG height={24} width={24} />
            </Pressable>

            <Pressable
              onPress={() =>
                Linking.openURL(`https://www.facebook.com/controlsistemasjl`)
              }
              style={({ pressed }) => [
                styles.iconButton,
                pressed && sharedStyles.pressed,
              ]}
            >
              <FacebookSVG height={24} width={24} />
            </Pressable>

            <Pressable
              onPress={() =>
                Linking.openURL(`https://www.instagram.com/controlsistemasjl/`)
              }
              style={({ pressed }) => [
                styles.iconButton,
                pressed && sharedStyles.pressed,
              ]}
            >
              <InstagramSVG height={24} width={24} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    borderColor: "#ddd",
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
});
