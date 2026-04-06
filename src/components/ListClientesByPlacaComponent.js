import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useEffect, useState } from "react";
import instance from "../utils/Instance";
import CustomAppBar from "./CustomAppBar";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { showAlert } from "./CustomAlert";
import { Colors } from "../utils/Colors";

export default function ListClientesByPlacaComponent({
  periodofiscal_id,
  setIsLoading,
  objHeadBilling,
  setSearchListModal,
  actionClick,
}) {
  const [clientes, setClientes] = useState([]);
  const insets = useSafeAreaInsets();
  const keyExtractor = (item, index) => index.toString();

  useEffect(() => {
    async function getInformation() {
      setIsLoading(true);
      const numeroplaca = objHeadBilling.placa.replace(/[-]/g, "");

      instance
        .get(
          `api/v1/cartera/cliente/search/placa/list/${periodofiscal_id}/${numeroplaca.toUpperCase()}`,
        )
        .then((resp) => {
          if (!resp.data.item || resp.data.item.length === 0) {
            showAlert({
              title: "Información",
              message: "No se encontró ningún cliente con esa placa.",
            });
            setSearchListModal(false);
          } else {
            setClientes(resp.data.item);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);

          showAlert({
            title: "Error",
            message:
              "La consulta no se pudo realizar correctamente, por favor intente nuevamente.",
          });
        });
    }

    getInformation();
  }, []);

  const renderClientes = ({ item, index }) => {
    const isFirst = index === 0;
    const isLast = index === clientes.length - 1;
    return (
      <>
        <Pressable
          onPress={() => actionClick(item)}
          style={({ pressed }) => ({
            backgroundColor: "white",
            borderTopLeftRadius: isFirst ? 18 : 5,
            borderTopRightRadius: isFirst ? 18 : 5,
            borderBottomLeftRadius: isLast ? 18 : 5,
            borderBottomRightRadius: isLast ? 18 : 5,
            marginBottom: 5,
            paddingVertical: 14,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <View style={{ marginHorizontal: 10 }}>
            <Ionicons
              name="person-circle-outline"
              size={30}
              color={Colors.primary}
              style={styles.searchIcon}
            />
          </View>
          <View>
            <Text>
              {item.codigo} | {item.nombrecompleto}
            </Text>
            <Text>Ruc: {item.numeroidentificacion}</Text>
          </View>
        </Pressable>
      </>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: insets.bottom,
        backgroundColor: "#F2F2F2",
      }}
    >
      <CustomAppBar
        center={true}
        bold={true}
        rightIcon="close"
        onRightPress={() => {
          setSearchListModal(false);
        }}
        title={"Lista de Clientes por Placa"}
      />
      <SafeAreaView
        style={{
          flex: 1,
          marginTop: 5,
          paddingHorizontal: 10,
          backgroundColor: "#F2F2F2",
        }}
      >
        <FlatList
          keyExtractor={keyExtractor}
          data={clientes}
          renderItem={renderClientes}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    marginLeft: 7,
    paddingTop: 7,
  },
});
