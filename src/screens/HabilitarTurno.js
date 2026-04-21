import { View, Text, StyleSheet, ScrollView, ToastAndroid } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { Button, TextInput } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getToken, mergeStorage } from "../utils/Utils";
import Loader from "../components/Loader";
import instance from "../utils/Instance";
import { useDeviceOrientation } from "@react-native-community/hooks";
import CustomAppBar from "../components/CustomAppBar";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../components/CustomAlert";

export default function HabilitarTurno({ imprimir, status = "I", closeModal }) {
  const navigation = useNavigation();
  const [turnoActivo, setTurnoActivo] = useState();
  const [estaciones, setEstaciones] = useState([]);
  const [surtidores, setSurtidores] = useState([]);
  const [listArrSurtidores, setListArrSurtidores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const orientation = useDeviceOrientation();
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
      const estId =
        parseInt(localstorage.establecimientoId ?? 0) > 0
          ? localstorage.establecimientoId
          : configUser.establecimiento_id;
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

  const renderEstacion = (item, surtidores) => (
    <View style={styles.estacionContainer}>
      <Text style={{ fontWeight: "bold", textAlign: "center" }}>
        {item.nombre}
      </Text>
      <View style={styles.surtidoresContainer}>
        <View style={styles.surtidorColumn}>
          <Button
            style={{
              padding: 0,
              borderRadius: 10,
              marginHorizontal: 10,
              marginVertical: 5,
            }}
            icon="reload"
            mode="contained-tonal"
            onPress={() => getGalonajeLado(item, "R")}
          >
            {"Cargar Lecturas"}
          </Button>
          {surtidores
            .filter((z) => z.estacion_id === item.id && z.posicion === "R")
            .map((sur, idx) => (
              <View key={idx}>
                <Text>{sur.nombre}</Text>
                <TextInput
                  mode={"outlined"}
                  keyboardType={"numeric"}
                  onChangeText={(text) => changeValorManual(text, sur)}
                  disabled={sur.disabled ?? true}
                  name={`galonaje+${sur.id}`}
                  placeholder={"000.0000"}
                  value={sur.galonaje ?? ""}
                />
              </View>
            ))}
        </View>
        <View style={styles.surtidorColumn}>
          <Button
            style={{
              padding: 0,
              borderRadius: 10,
              marginHorizontal: 10,
              marginVertical: 5,
            }}
            icon="reload"
            mode="contained-tonal"
            onPress={() => getGalonajeLado(item, "L")}
          >
            {"Cargar Lecturas"}
          </Button>
          {surtidores
            .filter((z) => z.estacion_id === item.id && z.posicion === "L")
            .map((sur, idx) => (
              <View key={idx}>
                <Text>{sur.nombre}</Text>
                <TextInput
                  onChangeText={(text) => changeValorManual(text, sur)}
                  keyboardType={"numeric"}
                  mode={"outlined"}
                  disabled={sur.disabled ?? true}
                  name={`galonaje+${sur.id}`}
                  placeholder={"000.0000"}
                  value={sur.galonaje ?? ""}
                />
              </View>
            ))}
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
      <ScrollView style={{ flex: 1 }}>
        {estaciones.length > 0 && (
          <>
            <>
              {estaciones.map((item, index) => {
                const stationsPerRow = orientation === "portrait" ? 1 : 3;
                if (index % stationsPerRow !== 0) {
                  return null;
                }
                const rowItems = estaciones.slice(
                  index,
                  index + stationsPerRow,
                );
                return (
                  <View key={index} style={styles.row}>
                    {rowItems.map((rowItem, rowIndex) => (
                      <View key={rowIndex} style={styles.estacionContainer}>
                        {renderEstacion(rowItem, surtidores)}
                      </View>
                    ))}
                  </View>
                );
              })}
            </>
            <View style={{ marginHorizontal: 15, marginBottom: 20 }}>
              <Button mode="contained" onPress={() => saveGalonajeSurtidores()}>
                {status === "I" ? "Activar Turno" : "Cerrar Turno"}
              </Button>
            </View>
          </>
        )}
        {estaciones.length === 0 && (
          <View style={{ marginHorizontal: 15 }}>
            <View
              style={{
                borderRadius: 10,
                backgroundColor: "#f0f0f0",
                marginTop: 30,
                paddingVertical: 20,
              }}
            >
              <Text
                style={{ textAlign: "center", fontWeight: "500", fontSize: 16 }}
              >
                LAS ESTACIONES CONFIGURADAS NO COINCIDEN CON EL TURNO ASIGNADO,
                VERIFIQUE LA ASIGNACION DEL TURNO
              </Text>
            </View>
            <View style={{ marginTop: 30 }}>
              <Button
                mode="contained"
                onPress={() => {
                  closeModal();
                  navigation.navigate("Configuration");
                }}
              >
                Configurar Estaciones
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  estacionContainer: {
    flex: 1,
    margin: 10,
  },
  surtidoresContainer: {
    flexDirection: "row",
  },
  surtidorColumn: {
    flex: 1,
    margin: 5,
  },
});
