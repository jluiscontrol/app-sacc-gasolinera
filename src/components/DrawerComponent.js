import { DrawerContentScrollView } from "@react-navigation/drawer";
import React, { useEffect, useState } from "react";
import { Drawer, Text, useTheme } from "react-native-paper";
import useAuthStore from "../stores/AuthStore";
import { StyleSheet, View } from "react-native";
import { getToken } from "../utils/Utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../utils/Colors";
import { Image } from "expo-image";

const DrawerComponent = (props) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const useToken = useAuthStore((state) => state.userToken);
  const [usuario, setUsuario] = useState([]);
  const [errorImage, setErrorImage] = useState(true);
  const [periodofiscal_id, setPeriodofiscal_id] = useState(0);
  const [objLicensed, setObjLicensed] = useState({});

  useEffect(() => {
    async function handleLogout() {
      const data = await getToken("configuration");
      if (!data) return;
      setUsuario(data.userData);
      setObjLicensed(data.licensed);
      if ("periodofiscal_id" in data) {
        setPeriodofiscal_id(data.periodofiscal_id);
      }
    }

    handleLogout();
  }, [useToken]);

  return (
    <DrawerContentScrollView
      contentContainerStyle={{
        flex: 1,
        backgroundColor: "#f5f5f5",
        paddingTop: 0,
        paddingHorizontal: 0,
        paddingStart: 0,
        paddingEnd: 0,
      }}
      {...props}
    >
      <View style={{ padding: 0, margin: 0, width: "100%" }}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.avatarContainer}>
            {periodofiscal_id > 0 && !errorImage && (
              <Image
                source={{
                  uri: `${objLicensed.route}assets/images/${usuario.periodosfiscales.find((x) => x.id === periodofiscal_id).contribuyente_id}/logo_empresa.png`,
                }}
                style={styles.avatar}
                onError={() => setErrorImage(true)}
              />
            )}

            {(periodofiscal_id === 0 || errorImage) && (
              <Image
                style={styles.avatar}
                contentFit="contain"
                source={require("../../assets/images/logo_solo.png")}
              />
            )}
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.name}>{usuario.username}</Text>
            <Text style={styles.username}>{usuario.nombreCompleto}</Text>
          </View>
        </View>
        <View style={styles.menuSection}>
          <Drawer.Section>
            <Drawer.Item
              icon={"gas-station"}
              label="Inicio"
              active={props.state.index === 0}
              onPress={() => props.navigation.navigate("Home")}
            />
            <View style={{ height: 10 }} />
            <Drawer.Item
              icon={"cog"}
              label="Configuracion"
              active={props.state.index === 1}
              onPress={() => props.navigation.navigate("Configuration")}
            />
            <View style={{ height: 10 }} />
          </Drawer.Section>
        </View>
      </View>
      <View style={styles.footer}>
        <View>
          <Drawer.Section>
            <Drawer.Item
              icon={"logout"}
              label="Cerrar Sesion"
              onPress={() => {
                logout();
              }}
            />
          </Drawer.Section>
        </View>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.appBarBackground,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },
  avatarContainer: {
    backgroundColor: "white",
    borderRadius: 60,
    padding: 10,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
  },
  name: {
    marginTop: 5,
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  username: {
    marginTop: 5,
    color: "white",
    textAlign: "center",
    fontSize: 14,
  },

  menuSection: {
    marginTop: 20,
  },

  footer: {
    marginTop: "auto",
  },
});

export default DrawerComponent;
