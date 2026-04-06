import useAuthStore from "../stores/AuthStore";
import AppStackNavigator from "./AppDrawerNavigator";
import AuthStackNavigator from "./AuthStackNavigator";
import { useEffect, useState, useRef } from "react";
import {
  decodeJWTFechaexp,
  getToken,
  removeStoragePropFromObject,
} from "../utils/Utils";
import Loader from "../components/Loader";
import { connectSocket, getSocket } from "../utils/socket";
import { AppState } from "react-native";
import { showAlert } from "../components/CustomAlert";

export default function Navigator() {
  const userToken = useAuthStore((state) => state.userToken);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const [isLoading, setIsLoading] = useState(true);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const configuration = await getToken("configuration");
        const socket = getSocket();
        if (socket && userToken) {
          socket.emit("checkUserStatus", {
            usuarioId: configuration?.userData?.user_id,
            rucContribuyente: configuration?.contribuyente?.ruc,
          });
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const configuration = await getToken("configuration");

      let socketParam = {};
      try {
        socketParam = JSON.parse(
          configuration?.contribuyente?.apisocket ?? "{}",
        );
      } catch (e) {}
      const socket = getSocket();

      if (!socket && Object.keys(socketParam).length > 0) {
        connectSocket(socketParam);
      }

      if (socket && userToken) {
        socket.emit("checkUserStatus", {
          usuarioId: configuration?.userData?.user_id,
          rucContribuyente: configuration?.contribuyente?.ruc,
        });

        socket.on("logoutUser", ({ usuarioId, rucContribuyente }) => {
          if (
            usuarioId === configuration?.userData?.user_id &&
            rucContribuyente === configuration?.contribuyente?.ruc
          ) {
            showAlert({
              title: "Sesión cerrada",
              message: "Se cerró sesión desde otro dispositivo",
            });
            logout();
          }
        });
      }
      if (configuration && "encodetoken" in configuration) {
        const fechaExpToken = decodeJWTFechaexp(configuration.encodetoken);
        if (fechaExpToken.exp < Date.now() / 1000) {
          const removed = removeStoragePropFromObject(
            "configuration",
            "encodetoken",
          ).then((removed) => {
            return true;
          });
          if (removed) {
            logout();
          }
        } else {
          login();
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [userToken]);

  return (
    <>
      <Loader loading={isLoading} />
      {userToken === null || userToken === undefined ? (
        <AuthStackNavigator />
      ) : (
        <AppStackNavigator />
      )}
    </>
  );
}
