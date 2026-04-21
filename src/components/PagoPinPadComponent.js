import { TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { Button, Text } from "react-native-paper";
import { Image } from "expo-image";
import { Colors } from "../utils/Colors";
import { SkypeIndicator } from "react-native-indicators";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
} from "react-native-reanimated";
import { showAlert } from "./CustomAlert";
import { formatSecuencia } from "../utils/Utils";
import instance from "../utils/Instance";

export default function PagoPinPadComponent(props) {
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
    establecimientoSRI,
    puntoEmision,
    vendedor_id,
  } = props;

  const [tiposDiferidos, setTiposDiferidos] = useState([]);
  const [listdetallepago, setListdetallepago] = useState(
    (listSpendingPurchase ?? []).map((x) => x),
  );

  const [datosPago, setDatosPago] = useState({
    tipopago_id: 0,
    subcero: 0,
    subiva: 0,
    iva: 0,
  });

  useEffect(() => {
    if (parseInt(datosPago?.tipopago_id) > 0) {
      const objTipoPago = parametrizacionObj.listTransaccionesPinPad.find(
        (x) => x.id === parseInt(datosPago?.tipopago_id),
      );
      const isDiferido =
        JSON.parse(
          (objTipoPago?.valoradicional ?? "") !== ""
            ? objTipoPago?.valoradicional
            : "{}",
        )?.diferido ?? false;
      setTiposDiferidos(objTipoPago?.detallescatalogo ?? []);
      setDatosPago((prev) => ({
        ...prev,
        tipodiferido_id: 0,
        meses_id: 0,
        diferido: isDiferido,
      }));
      if (isDiferido) {
        setEstado({ ...estado, diferido: true, tipopago: false });
      } else {
        setEstado({ ...estado, procesando: true, tipopago: false });
        actionPinPad({
          ...datosPago,
          tipodiferido_id: 0,
          meses_id: 0,
          diferido: isDiferido,
        });
      }
    }
  }, [datosPago?.tipopago_id]);

  useEffect(() => {
    if (parseInt(datosPago?.tipodiferido_id) > 0) {
      const objTipoDiferido = tiposDiferidos.find(
        (x) => x.id === parseInt(datosPago?.tipodiferido_id),
      );
      const arrMeses =
        JSON.parse(
          (objTipoDiferido?.valoradicional ?? "") !== ""
            ? objTipoDiferido?.valoradicional
            : "{}",
        )?.meses ?? [];
      setDatosPago((prev) => ({
        ...prev,
        meses_id: 0,
        meses: arrMeses,
      }));
      if (arrMeses.length > 0) {
        setEstado({ ...estado, meses: true, diferido: false });
      } else {
        setEstado({ ...estado, procesando: true, diferido: false });
        actionPinPad({ ...datosPago, meses_id: 0 });
      }
    }
  }, [datosPago?.tipodiferido_id]);

  useEffect(() => {
    async function getSecuencia() {
      const numeroEstablecimiento = parametrizacionObj.establecimientos.find(
        (x) => x.id === parseInt(establecimientoId),
      ).numeroestablecimiento;

      const dataSend = {
        vendedor_id: vendedor_id,
        caja_id: cajaId,
        establecimiento_id: establecimientoId,
      };
      try {
        const getData = await instance.get(
          `api/v1/facturacion/comprobante/secuencia/${periodofiscal}/${headComprobante.tipo_documento}/FAE/${numeroEstablecimiento}/${puntoEmision}`,
          { params: dataSend },
        );
        const data = getData.data;

        if (data?.item) {
          setFormHeadFields({
            ...headComprobante,
            secuencialfactura: data.item.secuencia,
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
    getSecuencia();
  }, []);

  const totalPago = listdetallepago.reduce(
    (pago, item) =>
      item.pago !== undefined &&
      isNaN(parseFloat(item.pago)) !== true &&
      item.delete !== true
        ? pago + parseFloat(item.pago)
        : pago + 0,
    0,
  );

  async function actionPinPad(datosPinPad) {
    const datosServicios = JSON.parse(
      JSON.parse(
        informacion.establecimientos.find(
          (x) => x.id === parseInt(establecimientoId),
        ).additional_services ?? "{}",
      ).api_pagos_pinpad ?? "{}",
    );
    const configCaja =
      informacion.cajas.find((x) => x.id === parseInt(cajaId))
        .configuracion_pinpad ?? "";
    const configCajaObj = JSON.parse(configCaja !== "" ? configCaja : "{}");
    const urlapidatos = datosServicios?.url ?? "";
    const configuracionPinPadGeneral = parametrizacionObj?.configuracionPINPAD;
    const objTipoPago = parametrizacionObj.listTransaccionesPinPad.find(
      (x) => x.id === parseInt(datosPinPad?.tipopago_id),
    );
    const listDiferidos = objTipoPago?.detallescatalogo ?? [];
    const objDiferido = listDiferidos.find(
      (x) => x.id === parseInt(datosPinPad?.tipodiferido_id),
    );
    const saldo = valoresTotalesFactura.total.toFixed(2) - totalPago.toFixed(2);

    if (urlapidatos === "") {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, no se ha configurado una ruta de conexión con el api del PindPad",
      });
    } else if (Object(configCajaObj).keys === 0) {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, no se ha configurado los datos de configuracion del PindPad",
      });
      setEstado({
        ...estado,
        procesando: false,
        tipopago: true,
        diferido: false,
        meses: false,
      });
      setDatosPago({ tipopago_id: 0 });
      setTiposDiferidos([]);
      return;
    } else if (Object(configuracionPinPadGeneral).keys === 0) {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, no se ha configurado los datos principales del PindPad",
      });
      setEstado({
        ...estado,
        procesando: false,
        tipopago: true,
        diferido: false,
        meses: false,
      });
      setDatosPago({ tipopago_id: 0 });
      setTiposDiferidos([]);
      return;
    }

    if (parametrizacionObj.pagoOmisionPinPad === 0) {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, No se ha configurado la forma de pago por defecto",
      });
      setEstado({
        ...estado,
        procesando: false,
        tipopago: true,
        diferido: false,
        meses: false,
      });
      setDatosPago({ tipopago_id: 0 });
      setTiposDiferidos([]);
      return;
    }

    const valorTotal = valoresTotalesFactura.total.toFixed(2);

    const postDataLocal = {
      lanConfig: {
        direccionIP: configCajaObj?.direccion_ip ?? "",
        puertoEscucha: configCajaObj?.puerto ?? 0,
        timeOut: configuracionPinPadGeneral?.timeOut ?? 100,
        version: configuracionPinPadGeneral?.version ?? 2,
        sha: configuracionPinPadGeneral?.sha ?? 2,
        cajaID: configCajaObj?.caja_id ?? "",
        mid: configuracionPinPadGeneral?.merchant_id ?? "",
        tid: configCajaObj?.terminal_id ?? "",
      },
      tipoTransaccion: objTipoPago?.valor ?? 0,
      redAdquirente: parametrizacionObj.redAdquirientePinPad,
      codigoDiferido: objDiferido?.valor ?? 0,
      plazoDiferido: objDiferido ? (datosPinPad?.meses_id ?? "") : "",
      mesesGracia: "",
      montoTotal: valorTotal,
      baseImponible: parseFloat(valoresTotalesFactura.subIva).toFixed(2),
      base0: parseFloat(valoresTotalesFactura.subCero).toFixed(2) ?? 0,
      iva: parseFloat(valoresTotalesFactura.iva).toFixed(2),
      montoFijo: "",
      servicio: "",
      propina:
        parseFloat(valoresTotalesFactura.propina) > 0 &&
        parseFloat(valoresTotalesFactura.propina).toFixed(2),
      hora: new Date().toISOString(),
      fecha: headComprobante.fechaemision + "T00:00:00-05",
      ott: "",
      ottProveedor: "",
      factura:
        establecimientoSRI +
        puntoEmision +
        formatSecuencia(headComprobante?.secuencialfactura, 9),
    };

    try {
      const getDataLocal = await instance.post(
        `${urlapidatos}/processPayment`,
        postDataLocal,
      );
      if (getDataLocal.data.status === 200) {
        const dataLocal = getDataLocal.data;
        if (
          (dataLocal?.response?.codigoRespuesta ?? "") === "00" &&
          (dataLocal?.response?.codigoRespuestaAut ?? "") === "00"
        ) {
          setEstado({ ...estado, procesando: false, confirmado: true });
          const dataResponseComplete = {
            ...(dataLocal?.response ?? {}),
            dataEnviadaControl: postDataLocal,
          };
          actions.confirmacionpago(
            dataResponseComplete,
            selectedDatoAdicional,
            listdetallepago,
            valorTotal,
            selectedDatoAdicional === 0 ? valoresTotalesFactura.propina : 0,
          );
        } else {
          /* if (((dataLocal?.response?.codigoRespuesta ?? "") === '20') || ((dataLocal?.response?.codigoRespuesta ?? "") === '91') || ((dataLocal?.response?.codigoRespuesta ?? "") === '12') || ((dataLocal?.response?.codigoRespuesta ?? "") === '57')   ){
                    reversePinPad(postDataLocal)
                }*/
          setEstado({
            ...estado,
            tipopago: true,
            procesando: false,
            diferido: false,
            meses: false,
          });
          setDatosPago({
            tipopago_id: 0,
            subcero: datosPago.subcero,
            subiva: datosPago.subiva,
            iva: datosPago.iva,
          });
          setTiposDiferidos([]);
          showAlert({
            title: "Información",
            message:
              dataLocal?.response?.mensajeRespuestaAut ??
              "Estimado usuario, ocurrio un error al ejecutar la consulta!",
          });
        }
      } else {
        setEstado({
          ...estado,
          tipopago: true,
          procesando: false,
          diferido: false,
          meses: false,
        });
        setDatosPago({
          tipopago_id: 0,
          subcero: datosPago.subcero,
          subiva: datosPago.subiva,
          iva: datosPago.iva,
        });
        setTiposDiferidos([]);
        showAlert({
          title: "Información",
          message: "Hubo un problema al enviar el pago",
        });
      }
    } catch (error) {
      setEstado({
        ...estado,
        tipopago: true,
        procesando: false,
        diferido: false,
        meses: false,
      });
      setDatosPago({
        tipopago_id: 0,
        subcero: datosPago.subcero,
        subiva: datosPago.subiva,
        iva: datosPago.iva,
      });
      setTiposDiferidos([]);
      showAlert({
        title: "Información",
        message: "Hubo un problema al enviar el pago",
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
      {estado.tipopago && (
        <Animated.View
          entering={FadeInRight}
          exiting={FadeOutLeft}
          layout={LinearTransition}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 15,
            justifyContent: "space-around",
          }}
        >
          {parametrizacionObj.listTransaccionesPinPad
            .filter(
              (x) =>
                !(
                  JSON.parse(
                    (x.valoradicional ?? "") !== "" ? x.valoradicional : "{}",
                  )?.anulacion ?? false
                ),
            )
            .map((choose, index) => (
              <View key={index}>
                <TouchableOpacity
                  onPress={() => {
                    setDatosPago((prev) => ({
                      ...prev,
                      tipopago_id: choose.id,
                    }));
                  }}
                  style={{
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 15,
                    borderRadius: 10,
                    backgroundColor: "#55ab7e",
                    width: "100%",
                  }}
                >
                  <Image
                    source={require("./../../assets/images/datafast.png")}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 100,
                      backgroundColor: "white",
                    }}
                  />
                  <Text
                    style={{
                      marginTop: 8,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {choose.descripcion}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
        </Animated.View>
      )}
      {estado.diferido && (
        <Animated.View
          entering={FadeInRight.delay(100)}
          exiting={FadeOutLeft}
          layout={LinearTransition}
          style={{ marginTop: 15 }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {tiposDiferidos.map((choose, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setDatosPago((prev) => ({
                      ...prev,
                      tipodiferido_id: choose.id,
                    }));
                  }}
                  style={{
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: "#55ab7e",
                    width: "100%",
                  }}
                >
                  <Image
                    source={require("./../../assets/images/datafast.png")}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 100,
                      backgroundColor: "white",
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 8,
                      fontWeight: "bold",
                      textAlign: "center",
                      fontSize: 12,
                    }}
                  >
                    {choose.descripcion}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Button
              onPress={() => {
                setTiposDiferidos([]);
                setDatosPago((prev) => ({
                  ...prev,
                  tipopago_id: 0,
                  tipodiferido_id: 0,
                  meses_id: 0,
                  diferido: false,
                }));
                setEstado({ ...estado, diferido: false, tipopago: true });
              }}
              textColor="white"
              style={{ width: "90%", backgroundColor: Colors.red }}
            >
              REGRESAR
            </Button>
          </View>
        </Animated.View>
      )}
      {estado.meses && (
        <Animated.View
          entering={FadeInRight.delay(100)}
          exiting={FadeOutLeft}
          layout={LinearTransition}
          style={{ marginTop: 15 }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {(datosPago?.meses ?? []).map((choose, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    const nuevosDatos = { ...datosPago, meses_id: choose };
                    setDatosPago(nuevosDatos);
                    setEstado({ ...estado, procesando: true, meses: false });
                    actionPinPad(nuevosDatos);
                  }}
                  style={{
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 10,
                    width: 100,
                    borderRadius: 10,
                    backgroundColor: "#55ab7e",
                  }}
                >
                  <Image
                    source={require("./../../assets/images/datafast.png")}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 100,
                      backgroundColor: "white",
                    }}
                  />
                  <Text
                    style={{
                      marginTop: 8,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {choose} Meses
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Button
              onPress={() => {
                setDatosPago((prev) => ({
                  ...prev,
                  tipodiferido_id: 0,
                  meses_id: 0,
                  diferido: false,
                }));
                setEstado({ ...estado, meses: false, diferido: true });
              }}
              textColor="white"
              style={{ width: "90%", backgroundColor: Colors.red }}
            >
              REGRESAR
            </Button>
          </View>
        </Animated.View>
      )}

      {estado.procesando && (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginTop: 30,
          }}
        >
          <SkypeIndicator
            color={Colors.primary}
            size={60}
            style={{ marginTop: 10, marginBottom: 10 }}
          />
          <Text
            style={{
              marginTop: 15,
              fontSize: 18,
              fontWeight: "bold",
              color: "#334e5f",
            }}
          >
            Procesando pago...
          </Text>
        </View>
      )}
    </View>
  );
}
