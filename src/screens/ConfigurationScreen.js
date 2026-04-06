import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import useAuthStore from "../stores/AuthStore";
import { getToken, mergeStorage } from "../utils/Utils";
import instance from "../utils/Instance";
import Loader from "../components/Loader";
import CustomAppBar from "../components/CustomAppBar";
import CustomCheckBox from "../components/CustomCheckBox";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showAlert } from "../components/CustomAlert";
import GlobalIcon from "../components/GlobalIcon";
import { Colors } from "../utils/Colors";
import { Button } from "react-native-paper";
import CustomModalContainer from "../components/CustomModalContainer";

export default function ConfigurationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const logout = useAuthStore((state) => state.logout);
  const [isloading, setIsLoading] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const [usuario, setUsuario] = useState({
    username: "",
    email: "",
    periodosfiscales: [],
  });
  const [modalPeriodo, setModalPeriodo] = useState(false);
  const [modalEstaciones, setModalEstaciones] = useState(false);
  const [respIdPeriodoSelect, setRespIdPeriodoSelect] = useState(0);
  const [idPeriodoSelect, setIdPeriodoSelect] = useState(0);
  const [datosEstaciones, setdatosEstaciones] = useState([]);
  const [selectedEstaciones, setSelectedEstaciones] = useState([]);

  useEffect(() => {
    callDataInitial();
  }, [refreshData]);

  const callDataInitial = async () => {
    const localstorage = await getToken("configuration");
    setUsuario(localstorage.userData);
    if (localstorage && "periodofiscal_id" in localstorage) {
      setIdPeriodoSelect(localstorage.periodofiscal_id);
      setRespIdPeriodoSelect(localstorage.periodofiscal_id);
      setIsLoading(true);
      refreshParametrizacionApp(localstorage.periodofiscal_id);
      if ("listEstaciones" in localstorage) {
        setSelectedEstaciones(localstorage.listEstaciones);
      }
    }
    if (localstorage && "data" in localstorage) {
      setdatosEstaciones(localstorage.data);
    }
  };

  const toggleSurtidorSelection = (surtidorId) => {
    setSelectedEstaciones((prevSelected) => {
      if (prevSelected.includes(surtidorId)) {
        return prevSelected.filter((id) => id !== surtidorId);
      } else {
        return [...prevSelected, surtidorId];
      }
    });
  };

  const groupedData = usuario.periodosfiscales.reduce((acc, obj) => {
    const objContribuyente = obj;
    const key = `${objContribuyente.contribuyente_id} - ${objContribuyente.razonsocial}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});

  const saveSelectedPeriodo = () => {
    if (idPeriodoSelect !== respIdPeriodoSelect) {
      setModalPeriodo(false);
      mergeStorage({ periodofiscal_id: idPeriodoSelect }, "configuration");
      showAlert({
        title: "INFORMACIÓN",
        message:
          "Se ha cambiado el periodo satisfactoriamente, a continuacion se cerrara sesion para actualizar sus configuraciones",
        actions: [
          {
            label: "Ok",
            onPress: () => logout(),
          },
        ],
      });
    } else {
      setModalPeriodo(false);
    }
  };

  const saveSelectedEstaciones = () => {
    if (selectedEstaciones.length === 0) {
      showAlert({
        title: "INFORMACIÓN",
        message: "Debe seleccionar al menos una estacion",
      });
      return;
    }
    setModalEstaciones(false);
    mergeStorage({ listEstaciones: selectedEstaciones }, "configuration");
    showAlert({
      title: "INFORMACIÓN",
      message: "Se han guardado las Estaciones satisfactoriamente",
      actions: [
        {
          label: "Ok",
          onPress: () => navigation.navigate("Home"),
        },
      ],
    });
  };

  const refreshParametrizacionApp = async (periodoFiscal) => {
    if (periodoFiscal > 0) {
      setIsLoading(true);

      try {
        const resp = await instance.get(
          `api/v1/general/datos/maestros/configuracion/usuario/${periodoFiscal}`,
        );
        if (resp.data.status === 200) {
          const uniqueStations = new Map();

          resp.data.estaciones.forEach((item) => {
            const id = item.id;
            if (!uniqueStations.has(id)) {
              uniqueStations.set(id, { id: id, nombre: item.nombre });
            }
          });

          const data = Array.from(uniqueStations.values());
          mergeStorage(
            {
              configurationUser: resp.data.items,
              porcentajeIVA: resp.data.porcentajeImpuesto,
              parametrizacion: resp.data.parametrizacion,
              turnoActivo: resp.data.turnoActivo,
              surtidores: resp.data.surtidores,
              data: data,
              establecimiento: resp.data.establecimiento,
              estaciones: resp.data.estaciones,
              impresora: resp.data.impresora,
              menuId: resp.data.menuId,
              tipoPago: resp.data.tipoPago,
              bancos: resp.data.bancos,
              tarjetas: resp.data.tarjetas,
              tipo_identificacion: resp.data.tipo_identificacion,
              estados_civil: resp.data.estados_civil,
              sexos: resp.data.sexos,
              establecimientoContable: resp.data.establecimientoContable,
              defaultEstado: resp.data.defaultEstado,
              defaultCiudad: resp.data.defaultCiudad,
              defaultPais: resp.data.defaultPais,
            },
            "configuration",
          );

          setdatosEstaciones(data);
        } else {
          showAlert({
            title: "Información",
            message:
              "Hubo un problema al consultar la configuración opcional del usuario en el servidor",
          });
        }
      } catch (error) {
        showAlert({
          title: "Alerta",
          message:
            "Hubo un problema al consultar la configuración opcional del usuario en el servidor",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      showAlert({
        title: "Información",
        message:
          "Debe Seleccionar un periodo fiscal para poder recargar la configuración",
      });
    }
  };

  const opciones = [
    {
      icon: { family: "ion", name: "refresh" },
      text: "Recargar Parametrizacion",
      noArrow: true,
      onPress: () => refreshParametrizacionApp(respIdPeriodoSelect),
    },
    {
      icon: { family: "fa5", name: "building" },
      text: "Definir Periodo",
      onPress: () => setModalPeriodo(true),
    },
    {
      icon: { family: "material", name: "apartment" },
      text: "Configurar Estaciones",
      onPress: () => setModalEstaciones(true),
    },
    {
      icon: { family: "ion", name: "log-out" },
      text: "Cerrar sesión",
      onPress: () => logout(),
      noArrow: true,
      destructive: true,
    },
  ];

  const renderModalPeriodo = () => {
    return (
      <>
        <View>
          {Object.keys(groupedData).map((key) => {
            return (
              <View key={key} style={styles.sectionBox}>
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
                      <CustomCheckBox
                        key={index}
                        checked={item.id === idPeriodoSelect}
                        onPress={() => setIdPeriodoSelect(item.id)}
                        title={item.nombre}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
          <View>
            <Button mode="contained" onPress={() => saveSelectedPeriodo()}>
              Guardar Periodo
            </Button>
          </View>
        </View>
      </>
    );
  };

  const renderModalEstacion = () => {
    return (
      <>
        <View style={styles.sectionBox}>
          {datosEstaciones.map((surtidor, index) => {
            const isSelected = selectedEstaciones.includes(surtidor.id);
            return (
              <CustomCheckBox
                key={index}
                checked={isSelected}
                onPress={() => toggleSurtidorSelection(surtidor.id)}
                title={surtidor.nombre}
              />
            );
          })}
        </View>
        <View>
          <Button mode="contained" onPress={() => saveSelectedEstaciones()}>
            Guardar Estaciones
          </Button>
        </View>
      </>
    );
  };

  const renderItem = ({ item, index }) => {
    const isFirst = index === 0;
    const isLast = index === opciones.length - 1;
    return (
      <Pressable
        onPress={() => item.onPress()}
        style={({ pressed }) => ({
          backgroundColor: "white",
          borderTopLeftRadius: isFirst ? 18 : 0,
          borderTopRightRadius: isFirst ? 18 : 0,
          borderBottomLeftRadius: isLast ? 18 : 0,
          borderBottomRightRadius: isLast ? 18 : 0,
          paddingVertical: 16,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={{
            width: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GlobalIcon
            family={item.icon.family}
            name={item.icon.name}
            size={25}
            color={item.destructive ? "#F44336" : Colors.primary}
          />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: item.destructive ? "#F44336" : "#000",
            }}
          >
            {item.text}
          </Text>
        </View>
        <View
          style={{
            width: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!item.noArrow && (
            <GlobalIcon family="material" name="chevron-right" size={28} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <CustomModalContainer
        visible={modalPeriodo}
        title={"Periodo Activo"}
        onClose={() => setModalPeriodo(false)}
      >
        {renderModalPeriodo()}
      </CustomModalContainer>

      <CustomModalContainer
        visible={modalEstaciones}
        title={"Configuracion de Estaciones"}
        onClose={() => setModalEstaciones(false)}
      >
        {renderModalEstacion()}
      </CustomModalContainer>

      <CustomAppBar
        leftIcon="menu"
        onLeftPress={() => navigation.openDrawer()}
        /*rightIcon={isDarkTheme ? "sunny" : "moon"}
        onRightPress={() => toggleTheme()}*/
        center={true}
        bold={true}
        title={"Configuracion"}
      />
      <Loader loading={isloading} />
      <FlatList
        data={opciones}
        contentContainerStyle={{ padding: 10, flexGrow: 1 }}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBox: {
    marginBottom: 30,
    borderRadius: 18,
    backgroundColor: "white",
  },
});
