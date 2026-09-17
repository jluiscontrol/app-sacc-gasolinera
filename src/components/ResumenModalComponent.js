import { useMemo, useState } from "react";
import CustomAppBar from "./CustomAppBar";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SkypeIndicator } from "react-native-indicators";
import { sharedStyles } from "../styles/SharedStyles";
import { Colors } from "../utils/Colors";

const TABS = [
  { key: "Tab1", label: "Depósitos", field: "egresos" },
  { key: "Tab2", label: "Facturas", field: "facturas" },
  { key: "Tab3", label: "Tickets", field: "tickets" },
  { key: "Tab4", label: "N. Entrega", field: "ordenesventas" },
];

export default function ResumenModalComponent(props) {
  const { dataResumen, printerDeposito, printDocument, closeModal, loading } =
    props;
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState("Tab2");

  const activeTab = TABS.find((tab) => tab.key === selectedTab) ?? TABS[1];

  const filteredData = useMemo(() => {
    const source = dataResumen?.[activeTab.field] ?? [];
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return source;
    }
    return source.filter((item) => {
      if (activeTab.field === "egresos") {
        return (
          String(item.id).includes(query) ||
          (item.comentario ?? "").toLowerCase().includes(query)
        );
      }
      return (
        String(item.id).includes(query) ||
        (item.cliente ?? "").toLowerCase().includes(query) ||
        (item.placa ?? "").toLowerCase().includes(query) ||
        String(item.valor ?? item.total ?? "").includes(query)
      );
    });
  }, [activeTab.field, dataResumen, searchText]);

  const totalTab = useMemo(
    () =>
      filteredData.reduce(
        (sum, item) => sum + parseFloat(item.valor ?? item.total ?? 0),
        0,
      ),
    [filteredData],
  );

  const renderItem = ({ item, index }) => {
    const isEgreso = activeTab.field === "egresos";
    const valor = parseFloat(item.valor ?? item.total ?? 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardId}>#{item.id}</Text>
            <Text style={styles.cardHour}>{item.hora ?? "--:--"}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.printButton,
              pressed && sharedStyles.pressed,
            ]}
            onPress={() => {
              if (isEgreso) {
                printerDeposito(item.id);
              } else {
                printDocument(item.id, item.tipo_documento, item.estacion_id);
              }
            }}
          >
            <Ionicons name="print-outline" color={Colors.primary} size={22} />
          </Pressable>
        </View>

        {!isEgreso && (
          <>
            <Text style={styles.cardClient} numberOfLines={1}>
              {item.cliente ?? "Sin cliente"}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardPlaca}>{item.placa ?? "—"}</Text>
              <Text style={styles.cardAmount}>${valor.toFixed(2)}</Text>
            </View>
          </>
        )}

        {isEgreso && item.comentario ? (
          <Text style={styles.cardComment} numberOfLines={2}>
            {item.comentario}
          </Text>
        ) : null}

        {isEgreso && (
          <Text style={[styles.cardAmount, styles.cardAmountRight]}>
            ${valor.toFixed(2)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <CustomAppBar
        bold
        center={true}
        rightIcon="close"
        onRightPress={closeModal}
        title={"Resumen transacciones"}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsBar}
      >
        {TABS.map((tab) => {
          const count = dataResumen?.[tab.field]?.length ?? 0;
          const active = selectedTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && sharedStyles.pressed,
              ]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                <Text
                  style={[
                    styles.tabBadgeText,
                    active && styles.tabBadgeTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>
          {activeTab.label}: {filteredData.length} registro
          {filteredData.length === 1 ? "" : "s"}
        </Text>
        <Text style={styles.summaryTotal}>${totalTab.toFixed(2)}</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por ID, cliente, placa..."
        value={searchText}
        onChangeText={setSearchText}
        mode="outlined"
        dense
        left={<TextInput.Icon icon="magnify" />}
      />

      <View style={styles.listWrap}>
        {loading ? (
          <View style={styles.centerState}>
            <SkypeIndicator color={Colors.primary} size={50} />
            <Text style={styles.stateText}>Cargando transacciones...</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
            <Text style={styles.stateText}>No hay registros en esta pestaña</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef1f4",
  },
  tabsBar: {
    maxHeight: 52,
    marginTop: 4,
  },
  tabsScroll: {
    paddingHorizontal: 10,
    gap: 8,
    alignItems: "center",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  tabBadgeTextActive: {
    color: "#fff",
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primary,
  },
  searchInput: {
    marginHorizontal: 10,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardId: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },
  cardHour: {
    fontSize: 12,
    color: "#64748b",
  },
  printButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  cardClient: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPlaca: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f766e",
  },
  cardAmountRight: {
    textAlign: "right",
    marginTop: 4,
  },
  cardComment: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});
