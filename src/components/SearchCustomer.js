import {
  View,
  Text,
  Alert,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { getToken } from "../utils/Utils";
import Loader from "./Loader";
import instance from "../utils/Instance";
import { SegmentedButtons, TextInput } from "react-native-paper";
import CustomAppBar from "./CustomAppBar";
import { sharedStyles } from "../styles/SharedStyles";
import GlobalIcon from "./GlobalIcon";
import { Colors } from "../utils/Colors";

export default function SearchCustomer(props) {
  const insets = useSafeAreaInsets();
  const { actionCloseModal, actionClick, navigation } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOption, setSelectedOption] = useState("nombre");
  const [isloading, setIsLoading] = useState(false);
  const [periodofiscal_id, setPeriodofiscal_id] = useState(0);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    callDataInitial();
  }, []);

  useEffect(() => {
    setSearchQuery("");
  }, [selectedOption]);

  const callDataInitial = async () => {
    setSelectedOption("Nombre");
    const localstorage = await getToken("configuration");
    if (localstorage && "periodofiscal_id" in localstorage) {
      setPeriodofiscal_id(localstorage.periodofiscal_id);
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const searchCustomer = async () => {
    setIsLoading(true);
    try {
      const searchInPath = searchQuery
        .replaceAll("%", "&&")
        .replaceAll("/", "~~");
      const parameterSearch =
        selectedOption === "all"
          ? searchInPath
          : selectedOption + ":" + searchInPath;
      const response = await instance.get(
        `api/v1/cartera/cliente/search/${periodofiscal_id}/${selectedOption.toLowerCase()}:${
          parameterSearch !== "" ? searchInPath : "&&"
        }`,
        {
          params: {
            type_search: selectedOption,
            ismobile: true,
          },
        },
      );
      if (response.data.status === 200) {
        setClientes(response.data.items);
      } else {
        Alert.alert(
          "Información",
          "Hubo un problema al consultar los clientes",
        );
      }
    } catch (error) {
      Alert.alert(
        "Alerta",
        "Hubo un problema al consultar los clientes en el servidor",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            <GlobalIcon
              color={Colors.primary}
              family="ion"
              name="person-circle-outline"
              size={30}
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
    <SafeAreaView
      style={[styles.contentModal, { paddingBottom: insets.bottom + 10 }]}
    >
      <CustomAppBar
        center={true}
        rightIcon="close"
        onRightPress={() => actionCloseModal()}
        title={"BUSQUEDA DE CLIENTE"}
        bold={true}
      />
      <Loader loading={isloading} />
      <View
        style={{
          flex: 1,
          backgroundColor: "#F2F2F2",
        }}
      >
        <View style={styles.containerBarSearch}>
          <SegmentedButtons
            theme={{
              colors: {
                outline: "#E0E0E0",
              },
            }}
            style={{
              marginHorizontal: 25,
              borderWidth: 0,
              elevation: 0,
            }}
            value={selectedOption}
            onValueChange={(value, index) => {
              handleOptionSelect(value);
            }}
            buttons={[
              { label: "Codigo", value: "Codigo" },
              { label: "Nombre", value: "Nombre" },
              { label: "Ruc", value: "Ruc" },
            ]}
          />
          <TextInput
            mode={"outlined"}
            right={<TextInput.Icon icon="magnify" onPress={searchCustomer} />}
            returnKeyType="search"
            style={[sharedStyles.textInput]}
            label={`Digite el ${selectedOption}...`}
            placeholderTextColor="#a8a8a8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchCustomer}
            keyboardType={selectedOption === "Nombre" ? "text" : "number-pad"}
          />
        </View>
        <SafeAreaView
          style={{
            flex: 1,
            marginTop: 5,
            paddingHorizontal: 10,
            backgroundColor: "#F2F2F2",
          }}
        >
          <FlatList
            keyExtractor={(item, index) => index.toString()}
            data={clientes}
            renderItem={renderClientes}
          />
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerBarSearch: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 10,
    margin: 10,
  },
  contentModal: {
    flex: 1,
    backgroundColor: "white",
  },
});
