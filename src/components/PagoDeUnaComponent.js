import { StyleSheet, TouchableOpacity, View } from "react-native";

import Animated, {
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
} from "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { Button, Text } from "react-native-paper";
import { Image } from "expo-image";
import { SkypeIndicator } from "react-native-indicators";
import { Colors } from "../utils/Colors";
import GlobalIcon from "./GlobalIcon";
import instance from "../utils/Instance";
import { showAlert } from "./CustomAlert";
import { encryptData } from "../utils/cryptoHelper";

export default function PagoDeUnaComponent(props) {
  const {
    informacion,
    valoresTotalesFactura,
    actions,
    menu,
    periodofiscal,
    headComprobante,
    setFormHeadFields,
    parametrizacionObj,
    setEstado,
    estado,
    listSpendingPurchase,
    permissKey,
    codigomovil,
    hiddenparcial = false,
    establecimientoId,
    cajaId,
    bodegaId,
    config,
  } = props;

  const [tiempoRestante, setTiempoRestante] = useState(180);
  const [contador, setContador] = useState(0);
  const [deshabilitado, setDeshabilitado] = useState(false);
  const [isRefreshTransactor, setRefreshTransactor] = useState(false);
  const [listdetallepago, setListdetallepago] = useState(
    (listSpendingPurchase ?? []).map((x) => x),
  );

  const totalPago = listdetallepago.reduce(
    (pago, item) =>
      item.pago !== undefined &&
      isNaN(parseFloat(item.pago)) !== true &&
      item.delete !== true
        ? pago + parseFloat(item.pago)
        : pago + 0,
    0,
  );

  useEffect(() => {
    let intervalId;

    if (estado.escaneando) {
      intervalId = setInterval(() => {
        setTiempoRestante((prevTiempo) => {
          if (prevTiempo <= 0) {
            setEstado({ ...estado, escaneando: false, timeout: true });
            clearInterval(intervalId);
            return 0;
          } else {
            setRefreshTransactor(
              (prevRefreshTransactor) => !prevRefreshTransactor,
            );
          }
          return prevTiempo - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(intervalId);
      setTiempoRestante(180);
    };
  }, [estado.escaneando]);

  useEffect(() => {
    async function getInformation() {
      if (estado.escaneando) {
        const getData = await instance.get(
          `api/v1/consultar/transaccion/estado/${periodofiscal}/${headComprobante.transaccionDeuna}`,
        );
        const data = getData.data;
        if (data?.response) {
          const response = JSON.parse(data?.response ?? "{}");
          if (response.status === "APPROVED" || response.status === "SUCCESS") {
            setEstado({
              ...estado,
              escaneando: false,
              confirmado: true,
              enviado: false,
            });
            await sleep(3000);
            actions.confirmacionpago(
              response,
              selectedDatoAdicional,
              listdetallepago,
            );
          }
        }
      }
    }
    getInformation();
  }, [isRefreshTransactor]);

  useEffect(() => {
    let intervalo;
    if (deshabilitado && contador > 0) {
      intervalo = setInterval(() => {
        setContador((prev) => prev - 1);
      }, 1000);
    } else if (contador === 0 && deshabilitado) {
      setDeshabilitado(false);
    }

    return () => clearInterval(intervalo);
  }, [contador, deshabilitado]);

  const manejarClick = async () => {
    if (!deshabilitado) {
      setDeshabilitado(true);
      setContador(15);
      const datosServicios = JSON.parse(
        JSON.parse(
          informacion.establecimientos.find(
            (x) => x.id === parseInt(establecimientoId),
          ).additional_services ?? "{}",
        ).api_pagos_deuna ?? "{}",
      );
      const urlapidatos = datosServicios?.url ?? "";
      const codigodeuna = datosServicios?.codigodeuna ?? "";
      const api_secret = datosServicios?.api_secret ?? "";
      const api_key = datosServicios?.api_key ?? "";
      const codigodeuna_caja =
        informacion.cajas.find(
          (x) => x.id === parseInt(parametrizacionObj.cajaVenta),
        ).codigodeuna ?? "";
      if (urlapidatos === "" || codigodeuna === "") {
        showAlert({
          title: "Información",
          message:
            "Estimado usuario, no se ha configurado una ruta de conexión con el api de DeUna",
        });
        return;
      } else if (codigodeuna_caja === "") {
        showAlert({
          title: "Información",
          message:
            "Estimado usuario, No se ha configurado el codigo de DeUna para la caja seleccionada",
        });
        return;
      } else if (api_secret === "" || api_key === "") {
        showAlert({
          title: "Información",
          message:
            "Estimado usuario, No se ha configurado el api_secret o api_key del establecimiento seleccionado",
        });
        return;
      }

      const dataenvio = {
        ruta: urlapidatos,
        caja: codigodeuna_caja,
        codigodeuna: codigodeuna,
        api_key: api_key,
        api_secret: api_secret,
        codigomovil: headComprobante.codigomovil,
        transactionId: headComprobante.transaccionDeuna,
        menu_id: menu,
      };

      const dataEncriptada = encryptData(dataenvio);
      const getData = await instance.post(
        `api/v1/sale/consulta/pagodeuna/byapi/${periodofiscal}/${headComprobante.transaccionDeuna}`,
        dataEncriptada,
        config,
      );

      const data = getData.data;

      if (data?.response) {
        const response = JSON.parse(data?.response ?? "{}");
        if (response.status === "APPROVED" || response.status === "SUCCESS") {
          setEstado({
            ...estado,
            escaneando: false,
            confirmado: true,
            enviado: false,
            timeout: false,
          });
          await sleep(3000);
          actions.confirmacionpago(
            response,
            selectedDatoAdicional,
            listdetallepago,
          );
        } else if (response.status === "PENDING") {
          showAlert({
            title: "Información",
            message:
              "Estimado usuario, El Pago está en estado Pendiente, por favor espere y vuelva a consultar.",
          });
        } else if (response.status === "REVERSED") {
          showAlert({
            title: "Información",
            message:
              "Estimado usuario, Este pago ha sido reversado, comuniquese con el administrador del sistema.",
          });
        }
      }
    }
  };

  async function actionDeUna() {
    const datosServicios = JSON.parse(
      JSON.parse(
        informacion.establecimientos.find(
          (x) => x.id === parseInt(establecimientoId),
        ).additional_services ?? "{}",
      ).api_pagos_deuna ?? "{}",
    );

    const urlapidatos = datosServicios?.url ?? "";
    const codigodeuna = datosServicios?.codigodeuna ?? "";
    const api_secret = datosServicios?.api_secret ?? "";
    const api_key = datosServicios?.api_key ?? "";

    const codigodeuna_caja =
      informacion.cajas.find((x) => x.id === parseInt(cajaId)).codigodeuna ??
      "";

    const saldo =
      (valoresTotalesFactura.total + valoresTotalesFactura.propina).toFixed(2) -
      totalPago.toFixed(2);
    /*if (selectedDatoAdicional === 1) {
      if (
        !(
          (valoresTotalesFactura.total + valoresTotalesFactura.propina).toFixed(
            2,
          ) -
            totalPago.toFixed(2) >
          0
        )
      ) {
        showAlert({
          title: "Información",
          message:
            "Estimado usuario, El total a cancelar debe ser mayor a cero para poder continuar con el pago con DeUna",
        });
        return;
      } else if (
        totalPago === 0 ||
        (valoresTotalesFactura.total + valoresTotalesFactura.propina).toFixed(
          2,
        ) <
          totalPago + saldo
      ) {
        showAlert({
          title: "Información",
          message:
            "Estimado usuario, El total de los pagos con el saldo no puede superar el valor total de la factura.",
        });
        return;
      }
    }*/
    if (urlapidatos === "" || codigodeuna === "") {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, no se ha configurado una ruta de conexión con el api de DeUna",
      });
      return;
    } else if (codigodeuna_caja === "") {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, No se ha configurado el codigo de DeUna para la caja seleccionada",
      });
      return;
    } else if (api_secret === "" || api_key === "") {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, No se ha configurado el api_secret o api_key del establecimiento seleccionado",
      });
      return;
    }
    if (parametrizacionObj.pagoOmisionDeUna === 0) {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, No se ha configurado la forma de pago por defecto de DeUna",
      });
      return;
    }
    if (parametrizacionObj.bancoOmisionDeUna === 0) {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, No se ha configurado el banco por defecto de DeUna",
      });
      return;
    }

    setEstado({ ...estado, procesando: true, enviado: false });

    const data = {
      ruta: urlapidatos,
      caja: codigodeuna_caja,
      codigodeuna: codigodeuna,
      api_key: api_key,
      api_secret: api_secret,
      codigomovil: codigomovil,
      monto: (
        valoresTotalesFactura.total + valoresTotalesFactura.propina
      ).toFixed(2),
      menu_id: menu,
    };

    const dataEncriptada = encryptData(data);

    try {
      const getData = await instance.post(
        `api/v1/sale/send/pagodeuna/${periodofiscal}`,
        dataEncriptada,
        config,
      );
      const status = getData.status;
      if (status === 200) {
        const data = getData.data;
        const { transactionId } = data;
        setFormHeadFields({
          ...headComprobante,
          transaccionDeuna: transactionId,
        });
        setEstado({
          ...estado,
          procesando: false,
          escaneando: true,
          enviado: false,
        });
      } else {
        setEstado({ ...estado, enviado: true, procesando: false });
      }
    } catch (e) {
      setEstado({ ...estado, enviado: true, procesando: false });
      showAlert({
        title: "Información",
        message: "Hubo un problema al enviar el pago",
      });
    }
  }

  async function cancelarSolicitudDeUna() {
    const datosServicios = JSON.parse(
      JSON.parse(
        informacion.establecimientos.find(
          (x) => x.id === parseInt(establecimientoId),
        ).additional_services ?? "{}",
      ).api_pagos_deuna ?? "{}",
    );
    const urlapidatos = datosServicios?.url ?? "";
    const codigodeuna = datosServicios?.codigodeuna ?? "";
    const api_secret = datosServicios?.api_secret ?? "";
    const api_key = datosServicios?.api_key ?? "";
    const codigodeuna_caja =
      informacion.cajas.find((x) => x.id === parseInt(cajaId)).codigodeuna ??
      "";

    if (urlapidatos === "" || codigodeuna === "") {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, no se ha configurado una ruta de conexión con el api de DeUna",
      });
      return;
    } else if (codigodeuna_caja === "") {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, No se ha configurado el codigo de DeUna para la caja seleccionada",
      });
      return;
    } else if (api_secret === "" || api_key === "") {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, No se ha configurado el api_secret o api_key del establecimiento seleccionado",
      });
      return;
    }
    const data = {
      ruta: urlapidatos,
      caja: codigodeuna_caja,
      codigodeuna: codigodeuna,
      api_key: api_key,
      api_secret: api_secret,
      codigomovil: headComprobante.codigomovil,
      transactionId: headComprobante.transaccionDeuna,
      menu_id: menu,
    };

    try {
      const dataEncriptada = encryptData(data);
      const getData = await instance.post(
        `api/v1/sale/cancel/pagodeuna/${periodofiscal}`,
        dataEncriptada,
        config,
      );
      const status = getData.status;
      if (status === 200) {
        const data = getData.data;
        const { item } = data;
        showAlert({
          title: "Información",
          message:
            "Estimado usuario, Se cancelo la solicitud de pago con Deuna.",
        });
        setFormHeadFields({ ...headComprobante, transaccionDeuna: null });
        setEstado({
          ...estado,
          enviado: true,
          escaneando: false,
          timeout: false,
          procesando: false,
          confirmado: false,
        });
      } else {
        if (estado.timeout) {
          setEstado({
            ...estado,
            enviado: false,
            escaneando: false,
            timeout: true,
            confirmado: false,
            procesando: false,
          });
        } else {
          setEstado({
            ...estado,
            enviado: false,
            escaneando: true,
            timeout: false,
            confirmado: false,
            procesando: false,
          });
        }
      }
    } catch (e) {
      if (estado.timeout) {
        setEstado({
          ...estado,
          enviado: false,
          escaneando: false,
          timeout: true,
          confirmado: false,
          procesando: false,
        });
      } else {
        setEstado({
          ...estado,
          enviado: false,
          escaneando: true,
          timeout: false,
          confirmado: false,
          procesando: false,
        });
      }
      showAlert({
        title: "Información",
        message: "Hubo un problema al cancelar la solicitud",
      });
    }
  }

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>
        Total a cancelar:{" "}
        {(valoresTotalesFactura.total + valoresTotalesFactura.propina).toFixed(
          2,
        )}
      </Text>
      <View style={styles.containerDeUna}>
        {estado.enviado && (
          <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            layout={LinearTransition}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={actionDeUna}
              style={styles.buttonDeUna}
            >
              <Image
                source={require("./../../assets/images/deuna.png")}
                style={styles.imageDeUna}
                contentFit="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        )}
        {estado.procesando && (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SkypeIndicator
              color={Colors.primary}
              size={60}
              style={{ marginTop: 10, marginBottom: 10 }}
            />
            <Text
              style={{
                marginBottom: 40,
                fontSize: 18,
                fontWeight: "bold",
                color: "#334e5f",
              }}
            >
              Procesando pago...
            </Text>
          </View>
        )}
        {estado.escaneando && (
          <Animated.View
            entering={FadeInRight.delay(100)}
            exiting={FadeOutLeft}
            layout={LinearTransition}
            style={styles.stateContainer}
          >
            <GlobalIcon
              family="materialC"
              name="qrcode-scan"
              size={100}
              color={Colors.primary}
            />
            <Text style={styles.titleText}>Esperando Escaneo...</Text>
            <Text style={styles.timerText}>
              Tiempo restante: {Math.floor(tiempoRestante / 60)}:
              {(tiempoRestante % 60).toString().padStart(2, "0")}
            </Text>
            <Button
              style={{ marginTop: 10, paddingHorizontal: 10 }}
              buttonColor={Colors.red}
              textColor="white"
              onPress={cancelarSolicitudDeUna}
            >
              Anular Solicitud
            </Button>
          </Animated.View>
        )}

        {estado.timeout && (
          <Animated.View
            entering={FadeInRight.delay(100)}
            exiting={FadeOutLeft}
            layout={LinearTransition}
            style={styles.stateContainer}
          >
            <GlobalIcon
              family="ion"
              name="time-outline"
              size={100}
              color="#E67E22"
            />
            <Text style={styles.titleText}>Tiempo Agotado</Text>

            <Button
              onPress={manejarClick}
              disabled={deshabilitado}
              loading={deshabilitado}
              style={{ marginTop: 10, paddingHorizontal: 10 }}
              buttonColor="#E67E22"
              textColor="white"
            >
              {deshabilitado
                ? `Reintentar en ${contador}s`
                : "Consultar Estado del pago"}
            </Button>

            <Button
              onPress={cancelarSolicitudDeUna}
              style={{ marginTop: 10, paddingHorizontal: 10 }}
              buttonColor={Colors.red}
              textColor="white"
            >
              Anular Solicitud
            </Button>
          </Animated.View>
        )}

        {estado.confirmado && (
          <Animated.View
            entering={FadeInRight.delay(100)}
            exiting={FadeOutLeft}
            layout={LinearTransition}
          >
            <GlobalIcon
              family="ion"
              name="checkmark-circle"
              size={120}
              color="#2ECC71"
            />
            <Text style={[styles.titleText, { color: "#2ECC71" }]}>
              Pago Confirmado
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerDeUna: {
    marginHorizontal: 16,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDeUna: {
    padding: 5,
    backgroundColor: "#fff",
    borderRadius: 15,
  },
  imageDeUna: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: "hidden",
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  timerText: {
    fontSize: 18,
    marginTop: 10,
    color: "#555",
  },
});
