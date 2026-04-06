import { useState } from "react";
import CustomAppBar from "./CustomAppBar";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "react-native-paper";
import { TextInput } from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SkypeIndicator } from "react-native-indicators";
import { sharedStyles } from "../styles/SharedStyles";
import { Colors } from "../utils/Colors";

export default function ResumenModalComponent(props) {
  const { dataResumen, printerDeposito, printDocument, closeModal } = props;
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState("Tab2");

  const filterData = (data, type) => {
    return (
      data?.filter((item) => {
        if (type === "egresos") {
          return (
            item.id.toString().includes(searchText) ||
            item.comentario?.toLowerCase().includes(searchText.toLowerCase())
          );
        } else {
          return (
            item.id.toString().includes(searchText) ||
            item.cliente?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.placa?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.valor?.toString().includes(searchText)
          );
        }
      }) ?? []
    );
  };

  const renderItem = (item, index, type, filteredData) => {
    const isFirst = index === 0;
    const isLast = index === filteredData?.length - 1;
    return (
      <Card
        key={index}
        style={[
          styles.card,
          {
            borderTopLeftRadius: isFirst ? 15 : 5,
            borderTopRightRadius: isFirst ? 15 : 5,
            borderBottomLeftRadius: isLast ? 15 : 5,
            borderBottomRightRadius: isLast ? 15 : 5,
          },
        ]}
      >
        <Card.Content>
          <Pressable
            style={({ pressed }) => [
              styles.botonImpresion,
              pressed && sharedStyles.pressed,
            ]}
            onPress={() => {
              if (type === "egresos") {
                printerDeposito(item.id);
              } else {
                printDocument(item.id, item.tipo_documento, item.estacion_id);
              }
            }}
          >
            <Ionicons name="print" color={"grey"} size={30} />
          </Pressable>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <Text>Transferencia: {item.id}</Text>
            <View style={{ width: 30 }} />
            <Text>Hora: {item.hora}</Text>
          </View>
          {type !== "egresos" && <Text>Cliente: {item.cliente}</Text>}
          {type !== "egresos" && (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text>Placa: {item.placa}</Text>
              <Text style={{ fontWeight: "bold" }}>
                ${item.valor ?? item.total}
              </Text>
            </View>
          )}
          {item.comentario && <Text>Comentario: {item.comentario}</Text>}
          {type === "egresos" && (
            <Text style={{ textAlign: "right", fontWeight: "bold" }}>
              ${item.valor ?? item.total}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderContent = () => {
    let filteredData;
    let dataType;

    switch (selectedTab) {
      case "Tab1":
        filteredData = filterData(dataResumen?.egresos, "egresos");
        dataType = "egresos";
        break;
      case "Tab2":
        filteredData = filterData(dataResumen?.facturas, "facturas");
        dataType = "facturas";
        break;
      case "Tab3":
        filteredData = filterData(dataResumen?.tickets, "tickets");
        dataType = "tickets";
        break;
      case "Tab4":
        filteredData = filterData(dataResumen?.ordenesventas, "ordenesventas");
        dataType = "ordenesventas";
        break;
      default:
        return null;
    }

    return (
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) =>
          renderItem(item, index, dataType, filteredData)
        }
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {dataResumen.length === 0 && (
        <View style={styles.loadingModal}>
          <View style={styles.loadingContainer}>
            <SkypeIndicator color={Colors.primary} size={60} />
          </View>
        </View>
      )}
      <CustomAppBar
        bold
        center={true}
        rightIcon="close"
        onRightPress={closeModal}
        title={"Resumen transacciones"}
      />
      <View style={{ height: 48 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          style={{ height: 48 }}
        >
          <View style={styles.tabContainer}>
            {[
              { key: "Tab1", label: "Depositos" },
              { key: "Tab2", label: "Facturas" },
              { key: "Tab3", label: "Ticket de Ventas" },
              { key: "Tab4", label: "N. Entrega" },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                style={({ pressed }) => [
                  styles.tab,
                  selectedTab === tab.key && styles.activeTab,
                  pressed && sharedStyles.pressed,
                ]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab.key && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.contentContainer}>{renderContent()}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "#ed9800",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  activeTabText: {
    color: "#FFF",
  },
  card: {
    elevation: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    marginTop: 7,
    marginHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  container: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  botonImpresion: {
    position: "absolute",
    zIndex: 100,
    right: 10,
    top: 10,
  },
  loadingModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000080",
    zIndex: 9999,
  },
  loadingContainer: {
    height: 100,
    width: 100,
    borderRadius: 10,
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  searchInput: {
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
  },
});
