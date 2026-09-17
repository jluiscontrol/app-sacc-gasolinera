import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  Pressable,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { Button, TextInput } from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getLadoLabel } from "../utils/gasolineraLados";
import { Colors } from "../utils/Colors";
import { sharedStyles } from "../styles/SharedStyles";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getToken, mergeStorage } from "../utils/Utils";
import Loader from "../components/Loader";
import instance from "../utils/Instance";
import CustomAppBar from "../components/CustomAppBar";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/CustomAlert";
import { useGasolineraComandos } from "../hooks/useGasolineraComandos";

export default function HabilitarTurno({ imprimir, status = "I", closeModal }) {
  const { isDesarrollo } = useGasolineraComandos();
  const navigation = useNavigation();
  const [turnoActivo, setTurnoActivo] = useState();
  const [estaciones, setEstaciones] = useState([]);
  const [surtidores, setSurtidores] = useState([]);
  const [listArrSurtidores, setListArrSurtidores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [codigoMovil, setCodigoMovil] = useState("");
  const [config, setConfig] = useState(null);
  const [conexionTransactor, setConexionTransactor] = useState({
    conectado: false,
    isConected: false,
    url: "",
    conectionId: "",
  });

  useFocusEffect(
    useCallback(() => {
      callDataInitial();
      return () => {};
    }, []),
  );

  const callDataInitial = async () => {
    const data = await getToken("configuration");
    const localstorage = await getToken("configuration");
    const arrIdsEstaciones = localstorage.listEstaciones;
    const todasEstanIncluidas = validarEstacionesTurno(
      data.turnoActivo,
      arrIdsEstaciones,
    );

    if (!todasEstanIncluidas) {
      showAlert({
        title: "Información",
        message:
          "No se puede activar el turno. Algunas estaciones del usuario no están seleccionadas en la parametrización.",
        actions: [
          {
            label: "Ok",
            onPress: () => navigation.navigate("Configuration"),
          },
        ],
      });

      return;
    }
    const arrEstaciones = localstorage.estaciones.filter(
      (x) =>
        arrIdsEstaciones.includes(x.id) &&
        data.turnoActivo.estaciones.includes(x.id),
    );
    const arrSurtidoresS = localstorage.surtidores;
    setListArrSurtidores(localstorage.surtidores);
    const fechaActual = new Date();
    const codigoUnicoMovil = `${localstorage.userData.username.substring(
      0,
      4,
    )}${fechaActual.getTime()}`;

    setCodigoMovil(codigoUnicoMovil);
    setEstaciones(arrEstaciones);
    if (status === "I") {
      const arrId = arrEstaciones.map((objeto) => objeto.id);
      const ids = arrId.join(",");
      const arrSurtidores = arrSurtidoresS.filter((x) =>
        ids.includes(x.estacion_id),
      );
      const arrIdSurtidores = arrSurtidores.map((objeto) => objeto.id);
      const idsSurtidores = arrIdSurtidores.join(",");
      setIsLoading(true);
      instance
        .get(
          `api/v1/gasolinera/lectura/surtidores/list/${
            localstorage.periodofiscal_id
          }/${idsSurtidores !== "" ? idsSurtidores : 0}`,
        )
        .then((resp) => {
          if (resp.data.status === 200) {
            if (resp.data.items.length > 0) {
              const changeData = localstorage.surtidores.map((item) => {
                const informationTransactor = resp.data.items.find(
                  (x) => x.surtidor_id === item.id,
                );
                if (informationTransactor) {
                  return {
                    ...item,
                    galonaje: informationTransactor.lecturafinal,
                    disabled: true,
                  };
                } else {
                  return {
                    ...item,
                    disabled: true,
                  };
                }
              });
              setSurtidores(changeData);
            } else {
              setSurtidores(
                localstorage.surtidores.map((item) => ({
                  ...item,
                  galonaje: 0,
                })),
              );
            }
          }
          setIsLoading(false);
        })
        .catch((e) => {
          setIsLoading(false);
          showAlert({
            title: "Error",
            message: "Hubo un error",
          });
        });
    } else {
      setSurtidores(localstorage.surtidores);
    }
  };

  useEffect(() => {
    async function getData() {
      const data = await getToken("configuration");
      setTurnoActivo(data.turnoActivo);
      setConfig(data);
    }

    getData();
  }, []);

  useEffect(() => {
    async function getconexionTransactor() {
      const localstorage = await getToken("configuration");
      const configUser = localstorage?.configurationUser ?? {};
      const estId =
        parseInt(localstorage?.configurationUser?.establecimiento_id ?? 0) > 0
          ? localstorage?.configurationUser?.establecimiento_id
          : configUser?.establecimiento_id;
      if (!conexionTransactor.conectado && parseInt(estId) > 0) {
        const establecimientoObj =
          localstorage.parametrizacion.establecimientos.find(
            (x) => x.id === parseInt(estId),
          );

        const additional_services = JSON.parse(
          establecimientoObj?.additional_services ?? "{}",
        );
        const conexion_transactor = JSON.parse(
          additional_services?.conexion_transactor ?? "{}",
        );
        const url = conexion_transactor?.url ?? "";
        let objConexion = {
          conectado_get: true,
          conectado_post: true,
          url_get: url,
          url_post: url,
        };
        setConexionTransactor({
          ...conexionTransactor,
          ...objConexion,
        });
      }
    }

    getconexionTransactor();
  }, [conexionTransactor.isConected]);

  const validarEstacionesTurno = (turnoActivo, estacionesUsuario) => {
    const estacionesTurno = String(turnoActivo.estaciones)
      .split(",")
      .map((e) => Number(e.trim()));

    return estacionesTurno.every((estacion) =>
      estacionesUsuario.includes(estacion),
    );
  };

  const callDataLecturaTransactor = async (keyFila, url) => {
    if (isDesarrollo) {
      ToastAndroid.show(
        "Modo desarrollo: comandos al surtidor desactivados",
        ToastAndroid.SHORT,
      );
      return null;
    }
    setIsLoading(true);
    const dataPost = { comando: `GT ${keyFila}@#`, url };
    let data;
    await instance
      .post(url, dataPost, {
        //.post("http://192.168.100.25:3008/puente", dataPost, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      })
      .then((resp) => {
        if (resp.data?.title === "Lectura exitosa" && resp.data.data !== "") {
          const clearData = resp.data.data.split("\r\n");
          const arrData = (clearData[1] ?? "").split(",");
          const lastElement = arrData[arrData.length - 1];
          if (lastElement === "OK") {
            setIsLoading(false);
            data = clearData[1];
            return clearData[1];
          } else {
            setIsLoading(false);
            ToastAndroid.show(
              "Hubo un problema al obtener la informacion del comando,datos incompletos",
              ToastAndroid.SHORT,
            );
            return null;
          }
        } else {
          setIsLoading(false);
          ToastAndroid.show(
            "Hubo un problema al obtener la informacion del comando",
            ToastAndroid.SHORT,
          );
          return null;
        }
      })
      .catch((error) => {
        setIsLoading(false);

        let messageError = "";
        if (error.response?.data) {
          if (error.response.data.detail) {
            messageError = error.response.data.detail;
          } else if (error.response.data.error.message) {
            messageError = error.response.data.error.message;
          } else if (error.response.data.error) {
            messageError = error.response.data.error;
          }
        }
        ToastAndroid.show(
          "Hubo un problema al obtener la informacion del comando " +
            messageError,
          ToastAndroid.SHORT,
        );
      });
    return data;
  };

  const bloquearDesbloquearSurtidor = async (codigoFila, tipoComando) => {
    if (isDesarrollo) {
      return null;
    }
    setIsLoading(true);
    const url =
      (conexionTransactor?.url_post ?? "") +
      "/" +
      (conexionTransactor?.conectionId_post ?? "") +
      "/commands/";
    const dataPost = { comando: `${tipoComando} ${codigoFila}@#`, url };
    instance.get(url, dataPost).then((resp) => {
      if (resp.data?.title === "Lectura exitosa" && resp.data.data !== "") {
        const clearData = resp.data.data.split("\r\n");
        const arrData = (clearData[1] ?? "").split(",");
        const lastElement = arrData[arrData.length - 1];

        if (lastElement === "OK") {
          setIsLoading(false);
          return clearData[1];
        } else {
          setIsLoading(false);
          ToastAndroid.show(
            "Hubo un problema al obtener la informacion del comando,datos incompletos",
            ToastAndroid.SHORT,
          );
          return null;
        }
      } else {
        setIsLoading(false);
        ToastAndroid.show(
          "Hubo un problema al obtener la informacion del comando",
          ToastAndroid.SHORT,
        );
        return null;
      }
    });
  };

  const getGalonajeLado = async (estacion, lado) => {
    const arrFilterFilaSurtidor = listArrSurtidores.filter(
      (x) => x.estacion_id === estacion.id && x.posicion === lado,
    );
    if (arrFilterFilaSurtidor.length > 0) {
      const codigo_transactor =
        arrFilterFilaSurtidor[0].codigo_transactor.split(",");
      const url =
        (conexionTransactor?.url_post ?? "") +
        "/" +
        (conexionTransactor?.conectionId_post ?? "") +
        "/commands/";
      const responseTransactor = await callDataLecturaTransactor(
        codigo_transactor[0],
        url,
      );
      if (responseTransactor) {
        const arrResponseTransactor = responseTransactor.split(",");
        arrResponseTransactor.pop();
        let groupedArraysInformation = [];
        for (let i = 0; i < arrResponseTransactor.length; i += 4) {
          groupedArraysInformation.push(arrResponseTransactor.slice(i, i + 4));
        }
        const changeData = surtidores.map((item) => {
          const informationTransactor = groupedArraysInformation.find(
            (x) => codigo_transactor[0] + "," + x[1] === item.codigo_transactor,
          );
          if (informationTransactor) {
            return {
              ...item,
              galonaje: informationTransactor[2],
              ingresomanual_inicial: false,
              ingresomanual_final: false,
              disabled: parseFloat(informationTransactor[2]) > 0,
            };
          } else {
            return {
              ...item,
              ingresomanual_inicial: false,
              ingresomanual_final: false,
              disabled: true,
            };
          }
        });
        setSurtidores(changeData);
      } else {
        const arrFilterDataHabilitar = surtidores.map((item) => {
          if (
            (item.codigo_transactor.split(",")[0] ?? "") ===
            codigo_transactor[0]
          ) {
            return {
              ...item,
              disabled: false,
            };
          } else {
            return {
              ...item,
              disabled: true,
            };
          }
        });
        setSurtidores(arrFilterDataHabilitar);
      }
    }
  };

  const changeValorManual = (value, surtidor) => {
    let arrSurtidores = [...surtidores];
    const indice = arrSurtidores.findIndex(
      (objeto) => objeto.id === surtidor.id,
    );
    arrSurtidores[indice] = {
      ...arrSurtidores[indice],
      galonaje: value,
      ingresomanual_inicial: true,
      ingresomanual_final: true,
    };
    setSurtidores(arrSurtidores);
  };

  const saveGalonajeSurtidores = async () => {
    if (!config) return;

    const estacionesUsuario = config.listEstaciones;

    const esValido = validarEstacionesTurno(
      config.turnoActivo,
      estacionesUsuario,
    );

    if (!esValido) {
      showAlert({
        title: "Información",
        message:
          "Error. Algunas estaciones del usuario no están seleccionadas en la parametrización, cierre el turno en la máquina correspondiente!",
        actions: [
          {
            label: "Ok",
            onPress: () => navigation.navigate("Configuration"),
          },
        ],
      });
      return;
    }
    setIsLoading(true);
    let filtersurtidores = [];
    const uniqueFilaCodesTransactor = new Set();
    estaciones.forEach((x) => {
      const arrSurtidor = surtidores
        .filter((y) => y.estacion_id === x.id)
        .map((data) => {
          const { producto } = data;
          const listapvp = JSON.parse(producto.precios);
          const codigo_transactor = data.codigo_transactor.split(",")[0];
          uniqueFilaCodesTransactor.add(codigo_transactor);
          return {
            id: data.id,
            nombre: data.nombre,
            galonaje: data.galonaje ?? 0,
            valor: listapvp[1],
            ingresomanual_inicial: data.ingresomanual_inicial,
            ingresomanual_final: data.ingresomanual_final,
          };
        });
      if (arrSurtidor.length > 0) {
        filtersurtidores.push(...arrSurtidor);
      }
    });
    const arrUniqueFilaCodesTransactor = Array.from(
      uniqueFilaCodesTransactor,
    ).sort((a, b) => parseInt(a) - parseInt(b));
    const validateData = filtersurtidores.filter(
      (item) => item.galonaje === "" || parseFloat(item.galonaje) === 0,
    );
    if (validateData.length === 0) {
      const dataUpdate = {
        estado_turno: status,
        surtidores: filtersurtidores,
        codigomovil: codigoMovil,
      };
      instance
        .put(
          `api/v1/gasolinera/asignacion/turnos/update/status/${
            turnoActivo.asignacionturno_id ?? 0
          }`,
          JSON.stringify(dataUpdate),
        )
        .then((resp) => {
          if (resp.data.status === 202) {
            //if (parametrizacionObj.habilitarBloquearSurtidor) {
            //  arrUniqueFilaCodesTransactor.forEach(codigofila => {
            //bloquearDesbloquearSurtidor(codigofila,status === 'I' ? 'AY' : 'AN');
            //});
            //}

            const newTurno = { ...turnoActivo, estado_turno: status };
            mergeStorage({ turnoActivo: newTurno }, "configuration");
            setIsLoading(false);
            if (imprimir) {
              imprimir();
            }
            closeModal();
          } else {
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setIsLoading(false);
          const errorMessage =
            err.response?.data?.error?.message ||
            "Hubo un error inesperado. Intente nuevamente.";
          showAlert({
            title: "Error",
            message: errorMessage,
          });
        });
    } else {
      setIsLoading(false);
      showAlert({
        title: "Error",
        message: "Existen Lecturas con valor 0, por favor verifique",
      });
    }
  };

  const renderSurtidorInput = (sur) => {
    const fuelColor = sur?.tipo_combustible?.valor ?? "#cbd5e1";
    return (
      <View key={sur.id} style={styles.readingBlock}>
        <Text style={styles.readingLabel}>{sur.nombre}</Text>
        <TextInput
          mode="outlined"
          keyboardType="numeric"
          onChangeText={(text) => changeValorManual(text, sur)}
          disabled={sur.disabled ?? true}
          placeholder="000.0000"
          value={sur.galonaje ?? ""}
          style={styles.readingInput}
          contentStyle={styles.readingInputContent}
          outlineStyle={{ borderLeftWidth: 4, borderLeftColor: fuelColor }}
          dense
        />
      </View>
    );
  };

  const renderLado = (item, posicion) => {
    const ladoItems = surtidores.filter(
      (z) => z.estacion_id === item.id && z.posicion === posicion,
    );
    const ladoRef = ladoItems[0] ?? { posicion };
    return (
      <View style={styles.sideColumn} key={`${item.id}-${posicion}`}>
        <View style={styles.sideHeader}>
          <Text style={styles.sideLabel}>{getLadoLabel(ladoRef)}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.refreshBtn,
              pressed && sharedStyles.pressed,
            ]}
            onPress={() => getGalonajeLado(item, posicion)}
          >
            <Ionicons name="refresh" size={18} color="#c2410c" />
          </Pressable>
        </View>
        {ladoItems.map(renderSurtidorInput)}
      </View>
    );
  };

  const renderEstacion = (item) => (
    <View style={styles.stationCard} key={item.id}>
      <View style={styles.stationHeader}>
        <Text style={styles.stationTitle}>{item.nombre}</Text>
      </View>
      <View style={styles.stationBody}>
        <View style={styles.sidesRow}>
          {renderLado(item, "R")}
          {renderLado(item, "L")}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Loader loading={isLoading} />
      <CustomAppBar
        center={true}
        rightIcon="close"
        onRightPress={closeModal}
        title={status === "I" ? "Habilitacion de Turno" : "Cerrar el turno"}
        bold={true}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {estaciones.length > 0 ? (
          <>
            <Text style={styles.screenHint}>
              {status === "I"
                ? "Revise las lecturas iniciales antes de activar el turno."
                : "Confirme las lecturas finales antes de cerrar el turno."}
            </Text>
            {estaciones.map((item) => renderEstacion(item))}
            <View style={styles.footer}>
              <Button
                mode="contained"
                buttonColor={Colors.primary}
                textColor="#fff"
                style={styles.primaryBtn}
                onPress={() => saveGalonajeSurtidores()}
              >
                {status === "I" ? "Activar Turno" : "Cerrar Turno"}
              </Button>
            </View>
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={40} color="#b91c1c" />
              <Text style={styles.emptyText}>
                Las estaciones configuradas no coinciden con el turno asignado.
                Verifique la asignación del turno.
              </Text>
            </View>
            <Button
              mode="contained"
              buttonColor={Colors.primary}
              textColor="#fff"
              style={styles.primaryBtn}
              onPress={() => {
                closeModal();
                navigation.navigate("Configuration");
              }}
            >
              Configurar Estaciones
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#eef1f4",
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 24,
  },
  screenHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 10,
    marginHorizontal: 4,
  },
  stationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
    overflow: "hidden",
  },
  stationHeader: {
    backgroundColor: Colors.appBarBackground,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  stationTitle: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  stationBody: {
    backgroundColor: "#f8fafc",
    padding: 10,
  },
  sidesRow: {
    flexDirection: "row",
  },
  sideColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  sideHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sideLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 0.4,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fdba74",
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  readingBlock: {
    marginBottom: 8,
  },
  readingLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
    marginBottom: 4,
  },
  readingInput: {
    backgroundColor: "#fff",
  },
  readingInputContent: {
    textAlign: "right",
    fontWeight: "700",
  },
  footer: {
    marginTop: 4,
    alignItems: "flex-end",
  },
  primaryBtn: {
    minWidth: 180,
    borderRadius: 10,
  },
  emptyWrap: {
    marginTop: 20,
    gap: 16,
  },
  emptyCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#991b1b",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
