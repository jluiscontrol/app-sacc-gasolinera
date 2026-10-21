import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import React from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import DispensadorSVG from "../../assets/images/misc/dispensador.svg";
import DispensandoSVG from "../../assets/images/misc/dispensando.svg";
import PagandoSVG from "../../assets/images/misc/pagando.svg";
import { sharedStyles } from "../styles/SharedStyles";
import { Colors } from "../utils/Colors";
import {
  getLadoLabel,
  ordenarLadosLegacy,
  ordenarLadosNuevoDiseno,
} from "../utils/gasolineraLados";

function buildLadoContext(
  dataLado,
  arrDataTransactorSurtidores,
  arrsurtidores,
  estadosTransactor,
  activarBotonDesbloquearSurtidor,
) {
  const informationTransactor = arrDataTransactorSurtidores.find(
    (x) => x.codigofila_transactor === dataLado.codigo_transactor,
  );
  const objInfoSurtidor = arrsurtidores.find(
    (x) =>
      x.codigo_transactor ===
      (informationTransactor?.codigofila_transactor ?? "") +
        "," +
        (informationTransactor?.codigopistola_transactor ?? ""),
  );

  const arrFilaSurtidores = arrsurtidores.filter(
    (x) =>
      x.codigo_transactor.split(",")[0] ===
      (informationTransactor?.codigofila_transactor ?? ""),
  );
  const surtidoresFila_ids = arrFilaSurtidores.map((obj) => obj.id).join(",");

  let colorFondo = "#FFFFFF";
  let nombreGasolina = "";
  let surtidor = 0;
  let surtidor_id = 0;
  const estadoTransactor = informationTransactor?.estado_transactor ?? "";
  const isBilling = estadosTransactor.cobrando.includes(estadoTransactor);

  if (objInfoSurtidor && !isBilling) {
    colorFondo = objInfoSurtidor.tipo_combustible.valor;
    nombreGasolina = objInfoSurtidor.tipo_combustible.descripcion;
  } else if (objInfoSurtidor && isBilling) {
    colorFondo = "#BFB9B9";
  }

  if (!objInfoSurtidor) {
    const findFirstBoquilla = arrsurtidores.find(
      (x) =>
        x.codigo_transactor.split(",")[0] ===
        (informationTransactor?.codigofila_transactor ?? ""),
    );
    surtidor_id = findFirstBoquilla?.id ?? 0;
    surtidor = findFirstBoquilla ?? 0;
  } else {
    surtidor_id = objInfoSurtidor?.id ?? 0;
    surtidor = objInfoSurtidor ?? 0;
  }

  const mostrarBotonBloqueo =
    !dataLado.proforma &&
    (estadoTransactor === "Ci" || estadoTransactor === "Di") &&
    activarBotonDesbloquearSurtidor;

  return {
    informationTransactor,
    colorFondo,
    nombreGasolina,
    surtidor,
    surtidor_id,
    surtidoresFila_ids,
    mostrarBotonBloqueo,
    isBilling,
    estadoTransactor,
  };
}

function buildSelectPayload(dataLado, subItem, ctx) {
  return {
    ...dataLado,
    surtidor: ctx.surtidor,
    surtidoresFila_ids:
      ctx.surtidoresFila_ids && ctx.surtidoresFila_ids !== ""
        ? ctx.surtidoresFila_ids
        : ctx.surtidor_id,
    surtidor_id: ctx.surtidor_id,
    codigo_transactor: dataLado?.codigo_transactor ?? "",
    nombre: `${subItem.estacion.toUpperCase()}-${getLadoLabel(dataLado)}`,
    transaccion_transactor: ctx.informationTransactor?.transaccion_transactor ?? 0,
  };
}

function SurtidorEstacionCard({
  subItem,
  usarDisenoNuevo,
  arrDataTransactorSurtidores,
  arrsurtidores,
  estadosTransactor,
  parametrizacion,
  selectedSurtidor,
  selectSurtidor,
  desbloquearSurtidorActivo,
  findEstadoSurtidor,
}) {
  const ladosOrdenados = usarDisenoNuevo
    ? ordenarLadosNuevoDiseno(subItem.lados)
    : ordenarLadosLegacy(subItem.lados);

  const iconSizeNuevo = 54;
  const iconSizeLegacy = 80;

  const renderIcono = (ctx, usarDisenoNuevo) => {
    const size = usarDisenoNuevo ? iconSizeNuevo : iconSizeLegacy;
    if (ctx.isBilling) {
      return <PagandoSVG height={size} width={size} />;
    }
    if (estadosTransactor.dispensando.includes(ctx.estadoTransactor)) {
      return <DispensandoSVG height={size} width={size} />;
    }
    return <DispensadorSVG height={size} width={size} />;
  };

  const renderLadoLegacy = (dataLado, idx) => {
    const ctx = buildLadoContext(
      dataLado,
      arrDataTransactorSurtidores,
      arrsurtidores,
      estadosTransactor,
      parametrizacion.activarBotonDesbloquearSurtidor,
    );
    const selectPayload = buildSelectPayload(dataLado, subItem, ctx);

    return (
      <View key={idx} style={styles.legacyRow}>
        <Pressable
          style={({ pressed }) => [
            { borderRadius: 8, flexDirection: "row" },
            pressed && sharedStyles.pressed,
          ]}
          onPress={() => selectSurtidor(selectPayload)}
        >
          <View
            style={{
              backgroundColor: ctx.colorFondo,
              padding: 10,
              borderRadius: 12,
            }}
          >
            <Text style={styles.ladoLabelLegacy}>{getLadoLabel(dataLado)}</Text>
            {renderIcono(ctx, false)}
            <Text style={styles.fuelNameLegacy}>{ctx.nombreGasolina}</Text>
          </View>
          <View style={styles.metricsLegacy}>
            <Text style={styles.metricLabel}>Galones:</Text>
            <Text>{ctx.informationTransactor?.galones ?? "0.0000"}</Text>
            <Text style={styles.metricLabel}>Dolares:</Text>
            <Text>${ctx.informationTransactor?.dolares ?? "0.0000"} </Text>
            {dataLado.proforma && (
              <>
                <Text style={styles.docLabel}>DOC #</Text>
                <Text>{dataLado.proforma.id}</Text>
              </>
            )}
          </View>
        </Pressable>
        {ctx.mostrarBotonBloqueo && (
          <Pressable
            onPress={() => desbloquearSurtidorActivo(selectPayload)}
            style={({ pressed }) => [
              styles.botonBloqueado,
              pressed && sharedStyles.pressed,
            ]}
          >
            <Ionicons name="lock-closed" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
    );
  };

  const renderLadoNuevo = (dataLado, idx) => {
    const ctx = buildLadoContext(
      dataLado,
      arrDataTransactorSurtidores,
      arrsurtidores,
      estadosTransactor,
      parametrizacion.activarBotonDesbloquearSurtidor,
    );
    const selectPayload = buildSelectPayload(dataLado, subItem, ctx);
    const isSelected =
      selectedSurtidor &&
      selectedSurtidor.codigo_transactor === dataLado.codigo_transactor;

    const isSingleLado = ladosOrdenados.length === 1;

    return (
      <View
        key={`${dataLado.codigo_transactor}-${idx}`}
        style={[
          styles.ladoColumn,
          isSingleLado && styles.ladoColumnSingle,
        ]}
      >
        {ctx.mostrarBotonBloqueo && (
          <Pressable
            onPress={() => desbloquearSurtidorActivo(selectPayload)}
            style={({ pressed }) => [
              styles.botonBloqueadoNuevo,
              pressed && sharedStyles.pressed,
            ]}
          >
            <Ionicons name="lock-closed" size={26} color="#fff" />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.ladoCardNuevo,
            isSelected && styles.ladoCardNuevoSelected,
            pressed && sharedStyles.pressed,
          ]}
          onPress={() => selectSurtidor(selectPayload)}
        >
          <View
            style={[
              styles.dispenserCardInner,
              { backgroundColor: ctx.colorFondo },
              ctx.isBilling && styles.dispenserCardBilling,
            ]}
          >
            <Text style={styles.ladoLabelNuevo}>{getLadoLabel(dataLado)}</Text>
            <View style={styles.iconWrap}>{renderIcono(ctx, true)}</View>
            <View style={styles.fuelNameSlot}>
              <Text
                style={[
                  styles.fuelNameNuevo,
                  !ctx.nombreGasolina && styles.fuelNameEmpty,
                ]}
                numberOfLines={1}
              >
                {ctx.nombreGasolina || "\u00A0"}
              </Text>
            </View>
          </View>
          <View style={styles.metricsNuevo}>
            <View style={styles.metricsRowTop}>
              <View style={styles.metricGroupHalf}>
                <Text style={styles.metricLabelNuevo}>Galones</Text>
                <Text style={styles.metricValueNuevo} numberOfLines={1}>
                  {ctx.informationTransactor?.galones ?? "0.00"}
                </Text>
              </View>
              <View style={styles.metricDividerVertical} />
              <View style={styles.metricGroupHalf}>
                <Text style={styles.metricLabelNuevo}>Dólares</Text>
                <Text style={styles.metricValueNuevo} numberOfLines={1}>
                  {ctx.informationTransactor?.dolares ?? "0.00"}
                </Text>
              </View>
            </View>
            <View style={styles.metricsRowDoc}>
              <Text
                style={[
                  styles.metricLabelNuevo,
                  !dataLado.proforma && styles.metricDocEmpty,
                ]}
              >
                DOC #
              </Text>
              <Text
                style={[
                  styles.metricValueNuevo,
                  !dataLado.proforma && styles.metricDocEmpty,
                ]}
                numberOfLines={1}
              >
                {dataLado.proforma?.id ?? "\u00A0"}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  const singleLadoAlignment =
    ladosOrdenados.length === 1
      ? ladosOrdenados[0].posicion === "L"
        ? styles.ladosRowSingleB
        : styles.ladosRowSingleA
      : null;

  return (
    <View style={usarDisenoNuevo ? styles.surfaceNuevo : styles.surfaceLegacy}>
      <View style={usarDisenoNuevo ? styles.stationHeaderNuevo : null}>
        <Text
          style={
            usarDisenoNuevo ? styles.stationTitleNuevo : styles.stationTitle
          }
        >
          {subItem.estacion.toUpperCase()}
        </Text>
      </View>
      <View
        style={[
          usarDisenoNuevo ? styles.ladosRow : null,
          singleLadoAlignment,
        ]}
      >
        {ladosOrdenados.map((dataLado, idx) =>
          usarDisenoNuevo
            ? renderLadoNuevo(dataLado, idx)
            : renderLadoLegacy(dataLado, idx),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  surfaceLegacy: {
    flex: 1,
    margin: 5,
    marginBottom: 0,
    padding: 10,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  surfaceNuevo: {
    width: "100%",
    marginBottom: 6,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d8dce3",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stationHeaderNuevo: {
    backgroundColor: Colors.appBarBackground,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  stationTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  stationTitleNuevo: {
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  legacyRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  ladoLabelLegacy: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "bold",
  },
  fuelNameLegacy: {
    textAlign: "center",
    fontWeight: "500",
    fontSize: 10,
  },
  metricsLegacy: {
    marginLeft: 5,
    alignContent: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontWeight: "bold",
    fontSize: 12,
  },
  docLabel: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 12,
  },
  ladosRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  ladosRowSingleA: {
    justifyContent: "flex-start",
  },
  ladosRowSingleB: {
    justifyContent: "flex-end",
  },
  ladoColumn: {
    flex: 1,
    position: "relative",
    alignSelf: "stretch",
  },
  ladoColumnSingle: {
    flex: 0,
    width: "48%",
    maxWidth: 180,
  },
  ladoCardNuevo: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#c8cdd6",
  },
  ladoCardNuevoSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dispenserCardInner: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "flex-start",
    height: 98,
    width: "100%",
  },
  dispenserCard: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "flex-start",
    height: 98,
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#c8cdd6",
  },
  dispenserCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dispenserCardBilling: {
    opacity: 0.92,
  },
  ladoLabelNuevo: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    color: "#1f2937",
    height: 16,
  },
  iconWrap: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  fuelNameSlot: {
    height: 18,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  fuelNameNuevo: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
  fuelNameEmpty: {
    opacity: 0,
  },
  metricsNuevo: {
    flexDirection: "column",
    backgroundColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    height: 78,
    justifyContent: "space-between",
  },
  metricsRowTop: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 38,
  },
  metricsRowDoc: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    height: 26,
  },
  metricGroupHalf: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 2,
  },
  metricDividerVertical: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#d1d5db",
    marginVertical: 2,
  },
  metricLabelNuevo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 2,
  },
  metricValueNuevo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  metricDocEmpty: {
    opacity: 0,
  },
  botonBloqueadoNuevo: {
    position: "absolute",
    top: 2,
    right: 2,
    zIndex: 10,
    padding: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
  },
  botonBloqueado: {
    position: "absolute",
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
});

export default React.memo(SurtidorEstacionCard);
