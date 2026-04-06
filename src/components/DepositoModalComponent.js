import { View, Text, StyleSheet } from "react-native";
import { useState } from "react";
import { Button, TextInput } from "react-native-paper";
import { currentDate } from "../utils/Utils";
import instance from "../utils/Instance";
import { showAlert } from "./CustomAlert";

export default function DepositoModalComponent(props) {
  const {
    setSearchDepositoModal,
    actionButtons,
    establecimientoid,
    periodofiscal_id,
    cajaId,
    usuario,
    turnoActivo,
    menuId,
    token,
  } = props;
  const [valorDeposito, setValorDeposito] = useState("0");
  const [comentariodeposito, setComentariodeposito] = useState("");

  const saveDeposito = async () => {
    if (
      valorDeposito !== "" &&
      !isNaN(parseFloat(valorDeposito)) &&
      parseFloat(valorDeposito) > 0
    ) {
      actionButtons.setIsLoading(true);
      const dataComprobante = {
        tipo_documento: "EGR",
        periodofiscal_id,
        caja_id: cajaId,
        fechaemision: currentDate(),
        establecimiento_id: establecimientoid,
        usuariovendedor_id: usuario.user_id,
        valor: valorDeposito,
        comentario: comentariodeposito,
        asignacionturno_id: turnoActivo?.asignacionturno_id ?? 0,
        grupomenu_id: 0,
        menu_id: menuId,
        isMobile: true,
        isla_id: turnoActivo?.isla_id ?? 0,
        asignacionturnoapoyo_id: turnoActivo?.asignacionturnoapoyo_id ?? 0,
      };
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      instance
        .post(
          "api/v1/facturacion/comprobante/ingresoegreso",
          dataComprobante,
          config,
        )
        .then((resp) => {
          actionButtons.printerDeposito(resp.data.id);
        })
        .catch((err) => {});
    } else {
      showAlert({
        title: "Información",
        message: "Debe ingresar un valor de deposito valido",
      });
    }
  };

  return (
    <View>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ alignItems: "center" }}>
          <Text>Ingrese el valor a depositar:</Text>

          <TextInput
            mode="outlined"
            underlineColor="transparent"
            activeUnderlineColor="green"
            keyboardType={"numeric"}
            selectTextOnFocus={true}
            outlineColor="#95f995"
            activeOutlineColor="black"
            style={[styles.amountInput, { backgroundColor: "#95f995" }]}
            contentStyle={styles.amountContent}
            placeholder={"0"}
            onChangeText={(value) => setValorDeposito(value)}
            value={valorDeposito === "0" ? "" : valorDeposito}
          />
          <TextInput
            style={{
              width: "80%",
              paddingVertical: 10,
              marginTop: 10,
            }}
            mode={"outlined"}
            placeholder={"Concepto"}
            placeholderTextColor={"#e3e6e8"}
            onChangeText={(value) => setComentariodeposito(value)}
            value={comentariodeposito}
          />
        </View>
        <View
          style={{
            marginTop: 10,
            alignItems: "center",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <Button mode="contained" onPress={saveDeposito}>
            Guardar Deposito
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    alignItems: "center",
    fontSize: 30,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    margin: 0,
    color: "#000",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  amountInput: {
    width: 160,
    height: 70,
    borderRadius: 10,
  },
  amountContent: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "600",
    paddingVertical: 0,
  },
});
