import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  ToastAndroid,
  RefreshControl,
  Image,
  BackHandler,
  Pressable,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { currentDate, getToken, validateFormatPlaca } from "../utils/Utils";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { Button, Portal } from "react-native-paper";
import instance from "../utils/Instance";
import Loader from "../components/Loader";
import DispensadorSVG from "../../assets/images/misc/dispensador.svg";
import DispensandoSVG from "../../assets/images/misc/dispensando.svg";
import PagandoSVG from "../../assets/images/misc/pagando.svg";
import HabilitarTurno from "./HabilitarTurno";
import useAuthStore from "../stores/AuthStore";
import { useDeviceOrientation } from "@react-native-community/hooks";
import CustomAppBar from "../components/CustomAppBar";
import ActionSheetComponent from "../components/ActionSheetComponent";
import CustomFAB from "../components/CustomFAB";
import HabilitarModalComponent from "../components/HabilitarModalComponent";
import DepositoModalComponent from "../components/DepositoModalComponent";
import ResumenModalComponent from "../components/ResumenModalComponent";
import DispensarModalComponent from "../components/DispensarModalComponent";
import { io } from "socket.io-client";
import PruebasTecnicasModalComponent from "../components/PruebasTecnicasModalComponent";
import AddCustomerComponent from "../components/AddCustomerComponent";
import { getSocket } from "../utils/socket";
import { useModalStore } from "../stores/ModalStore";
import ListClientesByPlacaComponent from "../components/ListClientesByPlacaComponent";
import { useDrawerStatus } from "@react-navigation/drawer";
import Ionicons from "react-native-vector-icons/Ionicons";
import { sharedStyles } from "../styles/SharedStyles";
import { showAlert } from "../components/CustomAlert";
import { Colors } from "../utils/Colors";
import CustomModalContainer from "../components/CustomModalContainer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PagoDeUnaComponent from "../components/PagoDeUnaComponent";
import PagoPinPadComponent from "../components/PagoPinPadComponent";

export default function HomeScreen() {
  const isDesarrollo = true;

  const isDrawerOpen = useDrawerStatus() === "open";
  const showModal = useModalStore((state) => state.showModal);
  const orientation = useDeviceOrientation();
  const navigation = useNavigation();
  const socketGeneral = getSocket();
  const insets = useSafeAreaInsets();

  const sendingRef = useRef(false);
  const habilitarRef = useRef(false);

  const [isloading, setIsLoading] = useState(false);
  const [porcentajeIVA, setPorcentajeIVA] = useState(0);
  const logout = useAuthStore((ste) => ste.logout);
  const [dataResumen, setDataResumen] = useState([]);
  const [estaciones, setEstaciones] = useState([]);
  const [refreshData, setRefreshData] = useState(false);
  const [token, setToken] = useState("");
  const [surtidores, setSurtidores] = useState([]);
  const [parametrizacion, setParametrizacion] = useState();
  const [arrsurtidores, setArrsurtidores] = useState([]);
  const [isOpenCierreTurno, setIsOpenCierreTurno] = useState(false);
  const [isOpenOpenTurno, setIsOpenOpenTurno] = useState(false);
  const [selectedSurtidor, setSelectedSurtidor] = useState(null);
  const [contribuyente, setContribuyente] = useState({});
  const [valorDispensar, setValorDispensar] = useState({
    dolares: 0,
    galones: 0,
    boquilla: "",
  });
  const [facturasAnticipadas, setFacturasAnticipadas] = useState([]);
  const [establecimientoid, setEstablecimientoid] = useState(0);
  const [cajaId, setCajaId] = useState(0);
  const [bodegaId, setBodegaId] = useState(0);
  const [bancos, setBancos] = useState([]);
  const [tipoPago, setTipoPago] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [establecimientosContables, setEstablecimientosContables] = useState(
    [],
  );
  const [isconfirmado, setisconfirmado] = useState(false);
  const [isOpenModalPagarDeUna, setIsOpenModalPagarDeUna] = useState(false);
  const [isOpenModalPagarPinPad, setIsOpenModalPagarPinPad] = useState(false);
  const [codigomovil, setCodigomovil] = useState("");
  const [isconfirmadoPinPad, setisconfirmadoPinPad] = useState(false);
  const [estadodeuna, setEstadodeuna] = useState({
    procesando: false,
    escaneando: false,
    confirmado: false,
    enviado: true,
    timeout: false,
  });

  const [estadoPinPad, setEstadoPinPad] = useState({
    tipopago: true,
    diferido: false,
    meses: false,
    procesando: false,
    confirmado: false,
  });
  const [detallepagodeuna, setDetallepagodeuna] = useState({
    tipopago_id: 0,
    ct_banco: 0,
    banco: "",
    formapago: "",
    numerodocumentobancario: "",
    valorpago: "",
    transactionId: "",
    deuna_response: "",
  });
  const estadosDispensador = {
    BLOQUEADO: ["Ii", "Iu", "Zi"],
    HABILITADO: ["Ai", "Aa", "Au"],
    DISPENSANDO: ["Ap", "At", "As"],
    FACTURAR: ["Ci", "Cu", "Di"],
    DESCONECTADO: ["X"],
    ERROR: ["H*", "*e"],
  };
  const [error, setError] = useState("");
  const [objPago, setObjPago] = useState({
    formapago_id: 0,
    abreviatura: "",
    banco_id: 0,
    numerodocumentobancario: "",
    numerocuentabancaria: "",
    tarjeta_id: 0,
    lotevoucher: "",
    referenciavoucher: "",
    fechavencimiento: currentDate(),
  });
  const [usuario, setUsuario] = useState({
    username: "",
    email: "",
    nombreCompleto: "",
    tipousuario_valor: "",
    user_id: 0,
  });
  const [conexionTransactor, setConexionTransactor] = useState({
    conectado: false,
    isConected: false,
    url: "",
    conectionId: "",
  });
  const isFocused = useIsFocused();
  const [tipoDocumento, setTipoDocumento] = useState("FAC");
  const [isOpenModalHabilitarDispensador, setIsOpenModalHabilitarDispensador] =
    useState(false);
  const [periodofiscal_id, setPeriodofiscal_id] = useState(0);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [isRefreshFacturacion, setIsRefreshFacturacion] = useState(false);
  const [arrDataTransactorSurtidores, setArrDataTransactorSurtidores] =
    useState([]);
  const [searchPersonModal, setSearchPersonModal] = useState(false);
  const [searchDepositoModal, setSearchDepositoModal] = useState(false);
  const [searchListModal, setSearchListModal] = useState(false);
  const [searchResumenModal, setSearchResumenModal] = useState(false);
  const [valores, setValores] = useState({
    dolares: 0,
    galones: 0,
    estado_transactor: "",
  });
  const [establecimientoSRI, setEstablecimientoSRI] = useState(null);
  const [puntoEmision, setPuntoEmision] = useState(null);
  const [nodeImpresion, setNodeImpresion] = useState(null);
  const [nodeImpresion2, setNodeImpresion2] = useState(null);
  const [portImpresion, setPortImpresion] = useState(null);
  const [menuId, setMenuId] = useState(0);

  const [estadosTransactor, setEstadosTransactor] = useState({
    dispensando: ["Ap", "Aa", "At"],
    cobrando: ["Ci", "Cu"],
    cierrecaja: ["Ap", "Aa", "At", "Ci", "Cu"],
  });
  const [objHeadBilling, setObjHeadBilling] = useState({
    n_transaccion: 0,
    fechaemision: currentDate(),
    fechavencimiento: currentDate(),
    diasplazo: 0,
    tipo_documento: tipoDocumento,
    establecimiento_sri: "",
    puntoemision_sri: "",
    secuencialfactura: "",
    establecimiento_id: 0,
    autorizacionsri: "",
    cliente_id: 0,
    cliente_codigo: "",
    nombreCliente: "",
    n_identificacion: "",
    telefono: "",
    direccion: "",
    direccionFinal: "",
    correo: "",
    cupocredito: 0,
    permitir_orden_venta: false,
    vendedor_id: "",
    caja_id: 0,
    observacion: "",
    asiento: "",
    proformaacumulativo_id: "",
    estadolote: false,
    barcos: [],
    referenciacliente_id: 0,
    tipoventa: "CO",
    placas: [],
    placa: "",
    kilometraje: "",
    gasolina_lv: "",
    tipotrabajo: "",
    seccion: "",
    color: "",
    motor: "",
    chasis: "",
    datosadicionales: {},
    idsGuias: "",
    impresiondocumento: false,
    nombrecomercial: "",
    pagoanticipado: false,
    arrPagosanticipados: [],
    facturaanticipo_id: 0,
    pruebatecnica: false,
    establecimiento_contable_id: 0,
    autoconsumo: false,
    saldoFacturas: 0,
  });
  const [isEditData, setEditData] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isOpenModalPruebasTecnicas, setIsOpenModalPruebasTecnicas] =
    useState(false);
  const [isOpenModalAddCustomer, setIsOpenModalAddCustomer] = useState(false);
  const [isOpenModalAcciones, setIsOpenModalAcciones] = useState(false);

  const selectedBancoObj = bancos.find(
    (b) => b.id === Number(objPago.banco_id),
  );
  const selectedTarjetaObj = tarjetas.find(
    (t) => t.id === Number(objPago.tarjeta_id),
  );
  const selectedTipoPagoObj = tipoPago.find(
    (t) => t.id === Number(objPago.formapago_id),
  );
  const selectedEstablecimientoContable = establecimientosContables.find(
    (t) => t.id === Number(objHeadBilling.establecimiento_contable_id),
  );

  const closeModalClientes = () => {
    setSearchPersonModal(false);
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const openModalAddCustomer = () => {
    setIsOpenModalAddCustomer(true);
  };

  const closeModalAddCustomer = (isSelect) => {
    setIsOpenModalAddCustomer(false);
  };

  const openPagarDeunaModal = () => {
    const fechaActual = new Date();
    const codigoUnicoMovil = `${usuario.username.substring(0, 4)}${fechaActual.getTime()}`;

    setCodigomovil(codigoUnicoMovil);
    setEstadodeuna({
      ...estadodeuna,
      procesando: false,
      escaneando: false,
      confirmado: false,
      enviado: true,
      timeout: false,
    });

    sendFacturacion(true);
  };

  const closePagarDeunaModal = () => {
    if (estadodeuna?.escaneando) {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, Tiene pendiente un escaneo de DeUna por lo que no puede cerrar esta ventana, debe cancelar la solicitud.",
      });
    } else {
      setIsOpenModalPagarDeUna(false);
    }
  };

  const openPagarPinPadModal = () => {
    const fechaActual = new Date();
    const codigoUnicoMovil = `${usuario.username.substring(0, 4)}${fechaActual.getTime()}`;

    setCodigomovil(codigoUnicoMovil);
    setEstadoPinPad({
      ...estadoPinPad,
      tipopago: true,
      diferido: false,
      meses: false,
      procesando: false,
      confirmado: false,
    });
    sendFacturacion(false, true);
  };

  const closePagarPinPadModal = () => {
    setIsOpenModalPagarPinPad(false);
  };

  const confirmacionpagodeUna = async (
    response,
    selectedDatoAdicional,
    listdetallepago,
  ) => {
    setDetallepagodeuna({
      tipopago_id: tipoPago.find(
        (x) => x.id === parametrizacion.pagoOmisionDeUna,
      ).id,
      ct_banco: bancos.find((x) => x.id === parametrizacion.bancoOmisionDeUna)
        .id,
      banco: bancos.find((x) => x.id === parametrizacion.bancoOmisionDeUna)
        .name,
      formapago: tipoPago.find((x) => x.id === parametrizacion.pagoOmisionDeUna)
        .name,
      numerodocumentobancario: response.transferNumber,
      valorpago: response.amount,
      transactionId: response.transactionId,
      deuna_response: JSON.stringify(response),
    });

    setIsOpenModalPagarDeUna(false);
    setisconfirmado(true);
  };

  const confirmacionpagoPinPad = async (
    response,
    selectedDatoAdicional,
    listdetallepago,
    valorTotal,
    recargo,
  ) => {
    let bancoObj = bancos.find(
      (x) => x.valoradicional === response.codigoAdquirente,
    );

    if (Object.keys(bancoObj).length === 0) {
      bancoObj = bancos.find(
        (x) =>
          x.name.toLowerCase() ===
          (response?.nombreAdquirente ?? "").trim().toLowerCase(),
      );
    }
    const tarjetaObj = tarjetas.find(
      (x) =>
        x.name.toLowerCase() ===
        (response?.aplicacionEMV ?? "").trim().toLowerCase(),
    );

    setDetallepagodeuna({
      ...defaultDataPago,
      formapago_id: tipoPago.find(
        (x) => x.id === parametrizacion.pagoOmisionPinPad,
      ).id,
      formapago: tipoPago.find(
        (x) => x.id === parametrizacionObj.pagoOmisionPinPad,
      ).name,
      banco_id: bancoObj?.id,
      banco: bancoObj?.name,
      pago: valorTotal,
      recargo: recargo,
      referenciavoucher: response.referencia,
      voucher: response.lote,
      tarjeta_id: tarjetaObj?.id,
      tarjeta: tarjetaObj?.descripcion,
      deuna_response: JSON.stringify(response),
    });

    setIsOpenModalPagarPinPad(false);
    setisconfirmado(true);
  };

  useFocusEffect(
    useCallback(() => {
      callDataInitial();
      getInformation();
      return () => {};
    }, [refreshData]),
  );

  useEffect(() => {
    async function sendFacturacion() {
      const arrayTransactor = arrDataTransactorSurtidores.filter(
        (data) => data.estado_transactor === "Zi",
      );
      arrayTransactor.forEach((item) => {
        if (!isDesarrollo) {
          desbloqueoSurtidor(item[0]);
        }
      });
    }

    sendFacturacion();
  }, [isRefreshFacturacion]);

  useEffect(() => {
    if (socketGeneral) {
      socketGeneral.on("connect", () => {
        console.log("Socket conectado:", socketGeneral.id);
      });
      socketGeneral.on("logoutUser", (usuarioId) => {
        if (usuarioId === usuario.user_id) {
          console.log("Sesión cerrada en todos los dispositivos");
          logout();
        }
      });
    }

    return () => {
      if (socketGeneral) {
        socketGeneral.off("logoutUser");
      }
    };
  }, []);

  useEffect(() => {
    if (
      parametrizacion?.usarSocket &&
      conexionTransactor.url_get &&
      conexionTransactor.url_get !== ""
    ) {
      const urlBase = conexionTransactor.url_get.replace(/\/Transactor$/, "");
      const socket = io(urlBase);

      socket.on("actualizacion_datos", (data) => {
        verificarTurnoActivo();
        procesarDatos(data);
      });

      socket.on("connect", () => {
        setConexionTransactor((prevState) => ({
          ...prevState,
          isConected: true,
        }));
      });

      socket.on("disconnect", () => {
        setConexionTransactor((prevState) => ({
          ...prevState,
          isConected: false,
        }));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [parametrizacion, conexionTransactor.url_get]);

  useEffect(() => {
    if (
      !parametrizacion?.usarSocket &&
      conexionTransactor.url_get &&
      conexionTransactor.url_get !== ""
    ) {
      const interval = setInterval(() => {
        obtenerDatosHTTP();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [parametrizacion, conexionTransactor.url_get]);

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

  useEffect(() => {
    if (isconfirmado) {
      sendFacturacion();
      setisconfirmado(false);
    }
  }, [isconfirmado]);

  useEffect(() => {
    const intervalFacturacion = setInterval(() => {
      setIsRefreshFacturacion(
        (prevRefreshFacturacion) => !prevRefreshFacturacion,
      );
    }, 1000 * 5);
    return () => clearInterval(intervalFacturacion);
  }, []);

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const getInformation = async (refresh) => {
    const localstorage = await getToken("configuration");
    if (!localstorage.parametrizacion) {
      logout();
    }
    const estacionesLocalStorage = localstorage.listEstaciones;
    setPorcentajeIVA(localstorage.porcentajeIVA);
    setEstaciones(localstorage.estaciones);
    const estacionesTurnoLocalStorage =
      localstorage.turnoActivo?.estaciones ?? "";
    const arrEstacionesParam = estacionesLocalStorage;
    setMenuId(localstorage.menuId);
    setContribuyente(localstorage.contribuyente);
    setEstablecimientosContables(localstorage.establecimientoContable);
    const arrEstacionesTurno = estacionesTurnoLocalStorage
      .split(",")
      .map(Number);
    const arrEstacionesCoincidencias = arrEstacionesParam.filter((numero) =>
      arrEstacionesTurno.includes(numero),
    );
    const codigosEstaciones = arrEstacionesCoincidencias.join(",");
    if (!refresh) {
      setIsLoading(true);
    }
    instance
      .get(
        `api/v1/gasolinera/surtidor/findby/estacion/${
          codigosEstaciones !== "" ? codigosEstaciones : 0
        }`,
      )
      .then((resp) => {
        if (resp.data.status === 200) {
          setArrsurtidores(resp.data.surtidores);
          let arrayAgrupado = [];
          resp.data.surtidores
            .sort((a, b) => a.estacion.id - b.estacion.id)
            .forEach((item, idx) => {
              const indexValidate = arrayAgrupado.findIndex(
                (x) => x.id === item.estacion.id,
              );
              if (indexValidate > -1) {
                const arrDatalado = arrayAgrupado[indexValidate].lados;
                const validateIndexLado = arrDatalado.findIndex(
                  (x) =>
                    x.codigo_transactor ===
                    item.codigo_transactor.split(",")[0],
                );
                if (validateIndexLado < 0) {
                  arrDatalado.push({
                    codigo_transactor: item.codigo_transactor.split(",")[0],
                    posicion: item.posicion,
                    proforma: item.proforma,
                  });
                } else if (item.proforma) {
                  arrDatalado[validateIndexLado] = {
                    ...arrDatalado[validateIndexLado],
                    proforma: item.proforma,
                  };
                }
                arrayAgrupado[indexValidate] = {
                  ...arrayAgrupado[indexValidate],
                  lados: arrDatalado,
                };
              } else {
                arrayAgrupado.push({
                  id: item.estacion.id,
                  estacion: item.estacion.nombre,
                  lados: [
                    {
                      codigo_transactor: item.codigo_transactor.split(",")[0],
                      posicion: item.posicion,
                      proforma: item.proforma,
                    },
                  ],
                });
              }
            });

          setSurtidores(arrayAgrupado);

          if (selectedSurtidor) {
            const dataSurtidor = resp.data.surtidores.find(
              (x) =>
                x.codigo_transactor.split(",")[0] ===
                  selectedSurtidor.codigo_transactor && x.proforma,
            );
            if (dataSurtidor) {
              setSelectedSurtidor({
                ...dataSurtidor,
                proforma: dataSurtidor?.proforma ?? null,
                codigo_transactor: dataSurtidor.codigo_transactor.split(",")[0],
                surtidor_id: selectedSurtidor.surtidor_id,
              });
            }
          }

          setIsLoading(false);
          return;
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        showAlert({
          title: "Error",
          message: "Hubo un error",
        });
      });
  };

  useEffect(() => {
    if (selectedSurtidor) {
      const codigotransactorSelected =
        selectedSurtidor.codigo_transactor.split(",");
      const objTransactor = arrDataTransactorSurtidores.find(
        (data) =>
          data.codigofila_transactor === codigotransactorSelected[0] &&
          data.estado_transactor !== "Ii",
      );
      if (objTransactor) {
        setValores({
          dolares: parseFloat(objTransactor[4]).toFixed(2),
          galones: parseFloat(objTransactor[5]).toFixed(4),
          estado_transactor: objTransactor[2] + objTransactor[3],
        });
      } else {
        setValores({
          dolares: "0.00",
          galones: "0.0000",
          estado_transactor: "",
        });
      }
    }
  }, [selectedSurtidor, arrDataTransactorSurtidores]);

  useEffect(() => {
    if (
      selectedSurtidor &&
      selectedSurtidor?.proforma &&
      parametrizacion.activarAutoconsumo
    ) {
      if (contribuyente.ruc == objHeadBilling.n_identificacion) {
        setObjHeadBilling((prevState) => ({
          ...prevState,
          autoconsumo: true,
        }));
      } else {
        setObjHeadBilling((prevState) => ({
          ...prevState,
          autoconsumo: false,
        }));
      }
    }
  }, [objHeadBilling.cliente_id, selectedSurtidor]);

  /* useEffect(() => {
       if (selectedSurtidor && parametrizacionObj.dispensarmanual) {
           const producto = selectedSurtidor.producto;
           console.log(producto)
           const precios = JSON.parse(producto.precios);
           const precioIva = precios[1];
           const galones = valores.dolares / precioIva;
           setValores({...valores, galones: galones.toFixed(4)});
       }
   }, [valores.dolares]);*/

  /*useEffect(() => {
      if (estaciones.length > 0) {
          setSelectedEstacion(estaciones[firstSelected].id);
      }
  }, [estaciones.length]);*/

  useEffect(() => {
    if (isloading) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => true,
      );
      return () => backHandler.remove();
    }
  }, [isloading]);

  const verificarTurnoActivo = () => {
    if (turnoActivo) {
      const now = new Date();

      const [horaInicioStr, minutoInicioStr] = turnoActivo.hora_inicio
        .split(" ")[1]
        .split(":")
        .map(Number);
      const [horaFinStr, minutoFinStr] = turnoActivo.hora_fin
        .split(" ")[1]
        .split(":")
        .map(Number);

      const fechaBase = now.toISOString().split("T")[0];
      const horaInicio = new Date(
        `${fechaBase}T${horaInicioStr}:${minutoInicioStr}:00`,
      );
      let horaFin = new Date(`${fechaBase}T${horaFinStr}:${minutoFinStr}:00`);

      if (horaFin < horaInicio) {
        horaFin.setDate(horaFin.getDate() + 1);
      }
      const minuteplus = parametrizacion?.minutosCierreApp
        ? parseInt(parametrizacion?.minutosCierreApp)
        : 15;
      horaFin.setMinutes(horaFin.getMinutes() + minuteplus);
      const ahora = new Date();

      if (ahora > horaFin) {
        showAlert({
          title: "El Tiempo del Turno acabó",
          message: "Si no ha cerrado turno, puede hacerlo desde el Sistema Web",
        });
        logout();
      }
    }
  };

  const procesarDatos = (data) => {
    const dataSeparada = data.split("\r\n");
    const formatData = dataSeparada.map((x) => {
      return x.split(",");
    });
    const arrDispensadores = formatData
      .filter((x) => x.length === 14)
      .map((y) => {
        return {
          ...y,
          codigofila_transactor: y[0],
          codigopistola_transactor: y[8],
          estado_transactor: y[2] + y[3],
          transaccion_transactor: y[10],
          galones: parseFloat(y[5]).toFixed(4),
          dolares: parseFloat(y[4]).toFixed(2),
        };
      });
    setArrDataTransactorSurtidores(arrDispensadores);
  };

  const obtenerDatosHTTP = async () => {
    const url = (conexionTransactor?.url_get ?? "") + "/readlast";

    if (url !== "") {
      try {
        const response = await instance.get(url);
        /*const response = await instance.get(
          "http://192.168.100.25:3008/readlast"
        );*/

        const resp = response.data;
        verificarTurnoActivo();
        procesarDatos(resp.data);
      } catch (error) {
        setConexionTransactor({
          ...conexionTransactor,
          isConected: !conexionTransactor.isConected,
        });
      }
    }
  };

  const callDataInitial = async () => {
    setIsLoading(true);
    const localstorage = await getToken("configuration");
    const estacionesLocalStorage = localstorage.listEstaciones;
    setToken(localstorage.encodetoken);

    setParametrizacion(localstorage.parametrizacion);
    const configUser = localstorage.configurationUser;
    const estId =
      parseInt(localstorage.establecimientoId ?? 0) > 0
        ? localstorage.establecimientoId
        : configUser.establecimiento_id;

    setEstablecimientoid(estId);
    const establecimientoObj =
      localstorage.parametrizacion.establecimientos.find(
        (x) => x.id === parseInt(estId),
      );
    if (establecimientoObj) {
      setEstablecimientoSRI(establecimientoObj.numeroestablecimiento);
    }
    setPuntoEmision(configUser.p_emision_electronica);

    const additional_services = JSON.parse(
      establecimientoObj?.additional_services ?? "{}",
    );
    setNodeImpresion(
      JSON.parse(additional_services?.api_impresiones_node ?? "{}"),
    );
    setNodeImpresion2(
      JSON.parse(additional_services?.api_impresiones_node2 ?? "{}"),
    );
    setPortImpresion(localstorage.impresora);

    if (parseInt(localstorage.bodegaId ?? 0) > 0) {
      setBodegaId(localstorage.bodegaId);
    } else {
      setBodegaId(localstorage.configurationUser.bodega_id);
    }
    if (parseInt(localstorage.cajaId ?? 0) > 0) {
      setCajaId(localstorage.cajaId);
    } else {
      setCajaId(localstorage.configurationUser.caja_id);
    }

    setUsuario(localstorage.userData);
    setTurnoActivo(localstorage.turnoActivo);
    setBancos(localstorage.bancos);
    setTarjetas(localstorage.tarjetas);
    const listtipospago = localstorage.configurationUser.listtipospago
      ? localstorage.configurationUser.listtipospago.split(",").map(Number)
      : [];

    const filteredTipoPago = localstorage.parametrizacion
      .validarFiltroPagoUsuario
      ? listtipospago.length > 0
        ? localstorage.tipoPago.filter((tipo) =>
            listtipospago.includes(tipo.id),
          )
        : []
      : localstorage.tipoPago;
    setTipoPago(filteredTipoPago);
    if (localstorage.periodofiscal_id !== undefined) {
      if (estacionesLocalStorage === undefined) {
        showAlert({
          title: "INFORMACIÓN",
          message: "Debe escoger las Estaciones",
          actions: [
            {
              label: "Ok",
              onPress: () => navigation.navigate("Configuration"),
            },
          ],
        });
        return;
      }
      setPeriodofiscal_id(localstorage.periodofiscal_id);
    } else {
      setIsLoading(false);
      showAlert({
        title: "INFORMACIÓN",
        message:
          "Estimado usuario, debe asignar un contribuyente en el dispositivo para poder continuar con el uso de la APP",
        actions: [
          {
            label: "Ok",
            onPress: () => navigation.navigate("Configuration"),
          },
        ],
      });
    }
  };

  const openModalCierreTurno = () => {
    let arrCodigoSurtidores = [];
    surtidores.forEach((surtidor) => {
      surtidor.lados.forEach((lado) => {
        arrCodigoSurtidores.push(lado.codigo_transactor);
      });
    });

    const arrValidacion = arrDataTransactorSurtidores.filter(
      (x) =>
        estadosTransactor.cierrecaja.includes(x[2] + x[3]) &&
        arrCodigoSurtidores.includes(x[0]),
    );

    if (arrValidacion.length == 0) {
      setIsOpenCierreTurno(true);
    } else {
      showAlert({
        title: "Informacion!",
        message:
          "Dispensadores sin facturar, verifique que todos los dispensadores esten liberados!",
      });
    }
  };

  const openModalResumenDespacho = async () => {
    setSearchResumenModal(true);
    try {
      const res = await instance.get(
        `api/v1/gasolinera/resumen/despacho/turno/${periodofiscal_id}/${currentDate()}/${
          usuario.user_id
        }`,
      );
      if (res.data.status === 200) {
        setDataResumen(res.data.items);
      }
    } catch (err) {
      showAlert({
        title: "Información",
        message: "Error",
      });
    }
  };

  const openModalHabilitarDispensador = () => {
    if (selectedSurtidor) {
      liberarHabilitar(true);
      sendingRef.current = false;
      setIsOpenModalHabilitarDispensador(true);
    } else {
      ToastAndroid.show(
        "Estimado usuario debe seleccionar un surtidor",
        ToastAndroid.SHORT,
      );
    }
  };

  const closeModalHabilitarDispensador = () => {
    setValorDispensar({ dolares: 0, galones: 0, boquilla: "" });
    setIsOpenModalHabilitarDispensador(false);
  };

  const closeModalDispensar = () => {
    resetData();
    setModalVisible(false);
  };

  const resetData = () => {
    let defaultFormapago_id = 0;
    let defaultAbreviatura = "";
    const objTipoPagoDefault = tipoPago.find(
      (x) => x.id === parametrizacion.tipopago_efectivo_id,
    );

    if (objTipoPagoDefault) {
      defaultFormapago_id = objTipoPagoDefault.id;
      defaultAbreviatura = objTipoPagoDefault.abreviatura;
    }

    setObjPago({
      formapago_id: defaultFormapago_id,
      abreviatura: defaultAbreviatura,
      banco_id: 0,
      numerodocumentobancario: "",
      numerocuentabancaria: "",
      tarjeta_id: 0,
      lotevoucher: "",
      referenciavoucher: "",
      fechavencimiento: currentDate(),
    });
    setObjHeadBilling({
      n_transaccion: 0,
      fechaemision: currentDate(),
      fechavencimiento: currentDate(),
      diasplazo: 0,
      tipo_documento: tipoDocumento,
      establecimiento_sri: establecimientoSRI,
      puntoemision_sri: puntoEmision,
      secuencialfactura: "",
      establecimiento_id: establecimientoid,
      caja_id: cajaId,
      autorizacionsri: "",
      cliente_id: 0,
      cliente_codigo: "",
      nombreCliente: "",
      n_identificacion: "",
      telefono: "",
      direccion: "",
      direccionFinal: "",
      correo: "",
      cupocredito: 0,
      permitir_orden_venta: false,
      vendedor_id: "",
      observacion: "",
      asiento: "",
      proformaacumulativo_id: "",
      estadolote: false,
      barcos: [],
      referenciacliente_id: 0,
      tipoventa: "CO",
      placas: [],
      placa: "",
      kilometraje: "",
      gasolina_lv: "",
      tipotrabajo: "",
      seccion: "",
      color: "",
      motor: "",
      chasis: "",
      datosadicionales: {},
      idsGuias: "",
      impresiondocumento: false,
      nombrecomercial: "",
      pagoanticipado: false,
      arrPagosanticipados: [],
      facturaanticipo_id: 0,
      pruebatecnica: false,
      saldoFacturas: 0,
    });
  };

  const createChangeHandler = (name, value) => {
    setObjHeadBilling((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (name === "placa") {
      if (!validateFormatPlaca(value)) {
        setError("Formato de placa inválido");
      } else {
        setError("");
      }
    }
  };

  const selectBoquilla = (item) => {
    if (objHeadBilling.cliente_id > 0) {
      setValorDispensar({ ...valorDispensar, boquilla: item.codigo_boquilla });
      if (objHeadBilling.pagoanticipado) {
        const arrAnticipos = (objHeadBilling.arrPagosanticipados ?? []).filter(
          (x) => x.producto_id === item.producto_id,
        );

        if (arrAnticipos.length >= 1) {
          setObjHeadBilling({
            ...objHeadBilling,
            facturaanticipo_id:
              arrAnticipos[0].id + "," + arrAnticipos[0].tipo_documento,
          });
        }
        setFacturasAnticipadas(arrAnticipos);
      }
    } else {
      showAlert({
        title: "Información",
        message: "Debe cargar un cliente para poder seleccionar la boquilla",
      });
    }
  };

  const print = async (data, estacion_id = null) => {
    let impresora = null;

    if (estacion_id) {
      const estacion = estaciones.find((x) => x.id === estacion_id);

      if (estacion && estacion.impresora) {
        impresora = estacion.impresora;
      }
    }

    const impresionDataPort =
      impresora ||
      (selectedSurtidor?.impresora
        ? selectedSurtidor.impresora
        : portImpresion);

    if (nodeImpresion2 && impresionDataPort) {
      const url = nodeImpresion2?.url ?? "";
      let aditional;
      aditional = `${url}/${impresionDataPort.valor}/${impresionDataPort.valoradicional}`;

      /*if (nodeImpresion && impresionDataPort) {
        const url = nodeImpresion?.url ?? "";
        let aditional;
        if (impresionDataPort.valoradicional === "USB") {
          aditional = `${url}/thermalprinter/${impresionDataPort.valor}`;
        } else {
          aditional = `${url}/${impresionDataPort.valor}`;
        }
        instance.post(aditional, data, {
          headers: {
            "Content-Type": "text/plain",
          },
        })*/
      instance
        .post(aditional, data, config)
        .then((response) => {
          ToastAndroid.show("Se imprimió correctamente", ToastAndroid.SHORT);
        })
        .catch((error) => {
          showAlert({
            title: "Error",
            message: `Error al imprimir: ${error.message}`,
          });
        });
    } else {
      showAlert({
        title: "Error",
        message: "No hay url para impresion configurada",
      });
    }
  };

  const validatePlacaYEstablecimiento = (placa) => {
    setObjHeadBilling((prev) => {
      let headComprobante = {
        ...prev,
        placa,
      };

      if (
        parametrizacion.establecimientoContable ||
        parametrizacion.validarPlacaForCreditos
      ) {
        const arrPlacasCliente =
          prev.placas && typeof prev.placas === "string"
            ? JSON.parse(prev.placas)
            : (prev.placas ?? []);

        const objPlaca = arrPlacasCliente.find(
          (x) => x.placa?.toUpperCase() === placa?.toUpperCase(),
        );

        if (
          parametrizacion.establecimientoContable &&
          selectedSurtidor?.proforma &&
          objPlaca?.establecimiento > 0
        ) {
          headComprobante.establecimiento_contable_id = parseInt(
            objPlaca.establecimiento,
          );
        }

        if (parametrizacion.validarPlacaForCreditos) {
          if (objPlaca?.credito) {
            headComprobante = {
              ...headComprobante,
              cupocredito: prev.resp_cupocredito ?? 0,
              tipoventa:
                !prev.resp_permitir_orden_venta && prev.resp_cupocredito > 0
                  ? "CR"
                  : "CO",
              permitir_orden_venta: prev.resp_permitir_orden_venta ?? false,
              pagoanticipado:
                !prev.resp_permitir_orden_venta && prev.resp_pagoanticipado
                  ? prev.resp_pagoanticipado
                  : false,
              arrPagosanticipados: prev.resp_arrPagosanticipados ?? [],
            };
          } else {
            headComprobante = {
              ...headComprobante,
              cupocredito: 0,
              tipoventa: "CO",
              permitir_orden_venta: false,
              pagoanticipado: false,
              arrPagosanticipados: [],
            };
          }
        }
      }

      return headComprobante;
    });
  };

  const actionPruebasTecnicas = () => {
    if (
      valorDispensar.boquilla === "01" ||
      valorDispensar.boquilla === "02" ||
      valorDispensar.boquilla === "03"
    ) {
      searchPlaca(true, null, true);
    } else {
      setIsLoading(false);
      showAlert({
        title: "Información",
        message:
          "Debe seleccionar un tipo de combustible para habilitar el dispensador",
      });
    }
  };

  const selectSurtidor = async (data) => {
    if (data.surtidor_id && data.surtidor_id > 0) {
      const estacion = estaciones.find(
        (e) => data.surtidor.estacion?.id === e.id,
      );
      const arrBoquillasSurtidor = arrsurtidores
        .filter(
          (x) => x.codigo_transactor.split(",")[0] === data.codigo_transactor,
        )
        .map((x) => {
          return {
            codigo_boquilla: x.codigo_transactor.split(",")[1],
            tipo: x.tipo_combustible.descripcion,
            color: x.tipo_combustible.valor,
            producto_id: x.producto.id,
            pvp: parseFloat(JSON.parse(x.producto.precios)[1]),
          };
        });

      setIsLoading(true);
      setTipoDocumento("FAC");
      setValorDispensar({
        dolares: 0,
        galones: 0,
        boquilla:
          arrBoquillasSurtidor.length === 1
            ? arrBoquillasSurtidor[0].codigo_boquilla
            : "",
      });
      setValores({ dolares: 0, galones: 0, estado_transactor: "" });

      const dataSend = {
        surtidoresFila_ids: data.surtidoresFila_ids,
      };

      try {
        const resp = await instance.get(
          `api/v1/gasolinera/surtidor/find/proforma/${data.surtidor_id}/${periodofiscal_id}`,
          { params: dataSend },
        );

        const dataProforma = resp.data;
        if (dataProforma.status === 200) {
          if (dataProforma.turno) {
            const estadoTurno = dataProforma.turno?.estado_turno;
            if (estadoTurno === "C") {
              showAlert({
                title: "El turno ya está cerrado",
                message:
                  "El turno ha cerrado, se va a cerrar sesión para que inicie con el nuevo turno",
              });
              logout();
              return;
            }
          }

          let isFacturaAnticipo = false;

          if (dataProforma.item) {
            const {
              id,
              establecimiento_sri,
              puntoemision_sri,
              secuencialfactura,
              caja,
              fechaemision,
              fechavencimiento,
              cliente,
              establecimiento,
              usuariovendedor_id,
              observacion,
              placa,
              comentario,
              detallePagoAcumulativo,
              pruebatecnica,
              factura_id,
              tipo_factura,
            } = dataProforma.item;

            const nombreCliente = cliente.persona.nombrecompleto;
            const placasCliente = cliente.placas
              ? JSON.parse(cliente.placas)
              : [];
            const objPlaca = placasCliente.find(
              (x) => (x.placa ?? "").toUpperCase() === (placa ?? "").toUpperCase(),
            );
            let placaHabilitadaCredito = false;

            isFacturaAnticipo = factura_id && tipo_factura ? true : false;

            if (parametrizacion.validarPlacaForCreditos) {
              if (objPlaca && objPlaca.credito) {
                placaHabilitadaCredito = true;
              }
            } else {
              placaHabilitadaCredito = true;
            }

            let establecimiento_contable = 0;
            if (parametrizacion.establecimientoContable) {
              if (objPlaca && parseInt(objPlaca?.establecimiento) > 0) {
                establecimiento_contable = parseInt(objPlaca?.establecimiento);
              }
            }

            setObjHeadBilling({
              n_transaccion: id,
              fechaemision,
              fechavencimiento,
              diasplazo: 0,
              tipo_documento: tipoDocumento,
              establecimiento_sri,
              puntoemision_sri,
              secuencialfactura,
              establecimiento_id: establecimiento.id,
              caja_id: caja.id,
              cliente_codigo: cliente.codigo,
              cliente_id: cliente.id,
              nombreCliente: nombreCliente,
              n_identificacion: cliente.persona.numeroidentificacion,
              telefono: cliente.persona.telefonocelular,
              direccion: cliente.persona.direccion,
              direccionFinal: cliente.persona.direccion,
              correo: cliente.persona.correopersonal,
              vendedor_id: usuariovendedor_id,
              observacion: observacion,
              comentario: comentario,
              tipoventa:
                placaHabilitadaCredito && (cliente.cupocredito ?? 0 > 0)
                  ? "CR"
                  : "CO",
              placas: placasCliente,
              placa: placa,
              nombrecomercial: cliente.nombrecomercial,
              cupocredito: placaHabilitadaCredito && cliente.cupocredito,
              permitir_orden_venta:
                placaHabilitadaCredito && cliente.permitir_orden_venta,
              pruebatecnica,
              pagoanticipado:
                placaHabilitadaCredito && cliente.pagoanticipado
                  ? cliente.pagoanticipado
                  : false,
              arrPagosanticipados:
                placaHabilitadaCredito && cliente.pagosanticipados
                  ? cliente.pagosanticipados
                  : [],
              resp_permitir_orden_venta: cliente.permitir_orden_venta,
              resp_pagoanticipado: cliente.pagoanticipado ?? false,
              resp_cupocredito: cliente.cupocredito ?? 0,
              resp_arrPagosanticipados: cliente.pagosanticipados ?? [],
              establecimiento_contable_id: establecimiento_contable,
              saldoFacturas: dataProforma.saldoFacturas ?? 0,
            });

            if (detallePagoAcumulativo && detallePagoAcumulativo.length > 0) {
              setObjPago({
                formapago_id: detallePagoAcumulativo[0].tipopago
                  ? detallePagoAcumulativo[0].tipopago.id
                  : 0,
                abreviatura: detallePagoAcumulativo[0].tipopago
                  ? detallePagoAcumulativo[0].tipopago.abreviatura
                  : "",
                banco_id: detallePagoAcumulativo[0].banco
                  ? detallePagoAcumulativo[0].banco.id
                  : 0,
                numerodocumentobancario:
                  detallePagoAcumulativo[0].numerodocumentobancario ?? "",
                numerocuentabancaria:
                  detallePagoAcumulativo[0].numerocuentabancaria ?? "",
                tarjeta_id: detallePagoAcumulativo[0].tarjeta
                  ? detallePagoAcumulativo[0].tarjeta.id
                  : 0,
                lotevoucher: detallePagoAcumulativo[0].referenciavoucher ?? "",
                referenciavoucher:
                  detallePagoAcumulativo[0].referenciavoucher ?? "",
                fechavencimiento: detallePagoAcumulativo[0].fechavencimiento,
              });
            }
          } else {
            resetData();
          }

          setSelectedSurtidor({
            ...data,
            impresora: estacion?.impresora,
            boquillas: arrBoquillasSurtidor,
            proforma: dataProforma.item,
            isFacturaAnticipo,
          });
          liberarHabilitar(true);

          sendingRef.current = false;
          toggleModal();
          setIsLoading(false);
        } else {
          setIsLoading(false);
          showAlert({
            title: "Información",
            message:
              "Hubo un problema al consultar la proforma del surtidor, intente nuevamente!",
          });
        }
      } catch (error) {
        setIsLoading(false);
        showAlert({
          title: "Error",
          message: `Error al consultar la proforma del surtidor. \n${error}`,
        });
      }
    }
  };

  const desbloquearSurtidorActivo = async (data) => {
    const codigomoviltransactor = data.transaccion_transactor;

    const getData = await instance.get(
      `api/v1/gasolinera/surtidor/desbloqueo/despacho/${codigomoviltransactor}/${periodofiscal_id}`,
      config,
    );
    if (getData.data.status === 200) {
      if (getData.data.items === true) {
        if (!isDesarrollo) {
          desbloqueoSurtidor(data.codigo_transactor.split(",")[0]);
        }
      } else {
        setRefreshData((prev) => !prev);
      }
    }
  };

  function searchIdentificacion() {
    if (objHeadBilling.n_identificacion !== "") {
      setIsLoading(true);
      instance
        .get(
          `api/v1/cartera/cliente/search/advance/${periodofiscal_id}/${objHeadBilling.n_identificacion}`,
        )
        .then((resp) => {
          if (resp.data.status === 200) {
            const itemSupplier = resp.data.item;
            if (itemSupplier.estado) {
              const { persona } = itemSupplier;
              const nombreCliente = persona.nombrecompleto;
              const placas = itemSupplier.placas
                ? typeof itemSupplier.placas === "string"
                  ? JSON.parse(itemSupplier.placas)
                  : itemSupplier.placas
                : [];
              placas
                .filter((x) => x.placa === objHeadBilling.placa)
                .forEach((item) => {
                  if (
                    !placas.map((element) => element.placa).includes(item.placa)
                  ) {
                    placas.push(item);
                  }
                });

              let arrAnticipos = [];
              if (itemSupplier.pagoanticipado) {
                const objBoquilla = (selectedSurtidor?.boquillas ?? []).find(
                  (x) => x.codigo_boquilla === valorDispensar.boquilla,
                );
                if (objBoquilla) {
                  arrAnticipos = (resp.data.pagosanticipados ?? []).filter(
                    (x) =>
                      x.producto_id === objBoquilla.producto_id && x.total > 0,
                  );
                  setFacturasAnticipadas(arrAnticipos);
                }
              }

              let defaultTipoventa =
                (itemSupplier.cupocredito ?? 0) > 0 ? "CR" : "CO";
              let defaultCupocredito = itemSupplier.cupocredito ?? 0;
              let defaultPermitir_orden_venta =
                itemSupplier.permitir_orden_venta;
              let defaultPagoanticipado = itemSupplier.pagoanticipado ?? false;
              let defaultArrPagosanticipados = resp.data.pagosanticipados ?? [];
              let defaultFacturaanticipo_id =
                arrAnticipos.length >= 1
                  ? arrAnticipos[0].id + "," + arrAnticipos[0].tipo_documento
                  : 0;

              if (parametrizacion.validarPlacaForCreditos) {
                defaultTipoventa = "CO";
                defaultCupocredito = 0;
                defaultPermitir_orden_venta = false;
                defaultPagoanticipado = false;
                defaultArrPagosanticipados = [];
                defaultFacturaanticipo_id = 0;
              }

              setObjHeadBilling({
                ...objHeadBilling,
                cliente_codigo: itemSupplier.codigo,
                cliente_id: itemSupplier.id,
                nombreCliente: nombreCliente,
                telefono: persona.telefonocelular ?? "",
                direccion: persona.direccion ?? "",
                direccionFinal: "",
                correo: persona.correopersonal,
                porcentajedescuento: itemSupplier.porcentajedescuento ?? 0,
                diasplazo: 0,
                fechavencimiento: "",
                vendedor_id: usuario.user_id,
                placa: placas[0]?.placa ?? "",
                placas: placas,
                nombrecomercial: itemSupplier.nombrecomercial,
                tipoventa: defaultTipoventa,
                cupocredito: defaultCupocredito,
                permitir_orden_venta: defaultPermitir_orden_venta,
                pagoanticipado: defaultPagoanticipado,
                arrPagosanticipados: defaultArrPagosanticipados,
                facturaanticipo_id: defaultFacturaanticipo_id,
                resp_permitir_orden_venta: itemSupplier.permitir_orden_venta,
                resp_pagoanticipado: itemSupplier.pagoanticipado ?? false,
                resp_cupocredito: itemSupplier.cupocredito ?? 0,
                resp_arrPagosanticipados: resp.data.pagosanticipados ?? [],
                saldoFacturas: itemSupplier.saldoFacturas ?? 0,
              });
              ToastAndroid.show("Cliente Encontrado", ToastAndroid.SHORT);
              if (selectedSurtidor?.proforma) {
                searchPlaca(false, itemSupplier.id);
              }
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
            ToastAndroid.show(
              "Estimado usuario no existen datos relacionados a este número de identificación!",
              ToastAndroid.SHORT,
            );
          }
        })
        .catch((err) => {
          setIsLoading(false);
          ToastAndroid.show(
            "Estimado usuario no existen datos relacionados a este número de identificación!",
            ToastAndroid.SHORT,
          );
          openModalAddCustomer();
        });
    } else {
      showAlert({
        title: "Información",
        message: "Estimado usuario debe ingresar un numero de identificacion",
      });
    }
  }

  const liberarHabilitar = (status) => {
    if (status === true) {
      habilitarRef.current = false;
    }
  };

  const searchPlaca = async (
    status = null,
    cliente_id = null,
    isPrueba = false,
  ) => {
    const proformaEnProceso =
      (findEstadoSelectedSurtidor() === "HABILITADO" ||
        findEstadoSelectedSurtidor() === "DISPENSANDO") &&
      parametrizacion.habilitarPrimeroyFacturar;

    const numeroplaca = objHeadBilling.placa.replace(/[-]/g, "");
    if (status === true) {
      if (habilitarRef.current) return;
      habilitarRef.current = true;
    }
    if (
      isPrueba ||
      (!status && numeroplaca !== "") ||
      (numeroplaca !== "" && objHeadBilling.cliente_id > 0)
    ) {
      if (validateFormatPlaca(numeroplaca.toUpperCase())) {
        if (
          !status ||
          (status &&
            (valorDispensar.boquilla === "01" ||
              valorDispensar.boquilla === "02" ||
              valorDispensar.boquilla === "03" ||
              proformaEnProceso))
        ) {
          setIsLoading(true);
          let arrPlacas = [];
          arrPlacas =
            (objHeadBilling.placas ?? []).length > 0
              ? (typeof objHeadBilling.placas === "string"
                  ? JSON.parse(objHeadBilling.placas)
                  : objHeadBilling.placas
                ).filter((x) => x.placa.replace(/[_-]/g, "") !== "")
              : [];
          let existePlaca = arrPlacas.some(
            (data) =>
              data.placa.toLowerCase() === objHeadBilling.placa.toLowerCase(),
          );
          if (!existePlaca) {
            arrPlacas.push({
              codigo: arrPlacas.length + 1,
              placa: objHeadBilling.placa.toUpperCase(),
              modelo: "",
            });
          }
          let valorAnticipo = null;
          if (status && objHeadBilling.pagoanticipado) {
            if (
              objHeadBilling.facturaanticipo_id !== "" &&
              parseInt(objHeadBilling.facturaanticipo_id) > 0
            ) {
              const dataAnticipo = objHeadBilling.facturaanticipo_id.split(",");
              const objFacturaAnticipada = facturasAnticipadas.find(
                (x) =>
                  x.id === parseInt(dataAnticipo[0]) &&
                  x.tipo_documento === dataAnticipo[1],
              );
              if (
                objFacturaAnticipada &&
                parseFloat(objFacturaAnticipada.total) > 0
              ) {
                if (
                  (valorDispensar.galones === "" ||
                    parseFloat(valorDispensar.galones) === 0) &&
                  (valorDispensar.dolares === "" ||
                    parseFloat(valorDispensar.dolares) === 0)
                ) {
                  valorAnticipo = parseFloat(objFacturaAnticipada.total);
                } else {
                  if (parseFloat(valorDispensar.dolares) > 0) {
                    if (
                      parseFloat(valorDispensar.dolares) >
                      parseFloat(objFacturaAnticipada.total)
                    ) {
                      setIsLoading(false);
                      showAlert({
                        title: "Información",
                        message:
                          "Estimado usuario, El valor de dolares ingresado supera al valor del saldo disponible, saldo disponible: $" +
                          objFacturaAnticipada.total,
                      });
                      liberarHabilitar(status);
                      return;
                    }
                  } else {
                    const objBoquilla = (
                      selectedSurtidor?.boquillas ?? []
                    ).find(
                      (x) => x.codigo_boquilla === valorDispensar.boquilla,
                    );
                    if (objBoquilla) {
                      const valorDolares =
                        parseFloat(valorDispensar.galones) * objBoquilla.pvp;
                      if (
                        valorDolares.toFixedNew(2) >
                        parseFloat(objFacturaAnticipada.total)
                      ) {
                        setIsLoading(false);
                        showAlert({
                          title: "Información",
                          message:
                            "Estimado usuario, El galonaje ingresado supera al valor del saldo disponible, saldo disponible: $" +
                            objFacturaAnticipada.total,
                        });
                        liberarHabilitar(status);
                        return;
                      }
                    } else {
                      setIsLoading(false);
                      showAlert({
                        title: "Información",
                        message:
                          "Estimado usuario, No se pudo encontrar la boquilla para calcular el precio con los galones",
                      });
                      liberarHabilitar(status);
                      return;
                    }
                  }
                }
              } else {
                setIsLoading(false);
                showAlert({
                  title: "Información",
                  message:
                    "Estimado usuario, El cliente no posee cupo disponible para dispensar, por favor verifique",
                });
                liberarHabilitar(status);
                return;
              }
            } else {
              setIsLoading(false);
              showAlert({
                title: "Información",
                message:
                  "Estimado usuario, debe seleccionar un Anticipo para poder despachar",
              });
              liberarHabilitar(status);
              return;
            }
          } else if (
            status &&
            objHeadBilling.tipoventa === "CR" &&
            parametrizacion.isCupoCliente
          ) {
            if (objHeadBilling.saldoFacturas > 0) {
              if (
                (valorDispensar.galones === "" ||
                  parseFloat(valorDispensar.galones) === 0) &&
                (valorDispensar.dolares === "" ||
                  parseFloat(valorDispensar.dolares) === 0)
              ) {
                valorAnticipo = parseFloat(objHeadBilling.saldoFacturas);
              } else {
                if (parseFloat(valorDispensar.dolares) > 0) {
                  if (
                    parseFloat(valorDispensar.dolares) >
                    parseFloat(objHeadBilling.saldoFacturas)
                  ) {
                    setIsLoading(false);
                    const respuesta = await showModal({
                      title: "Información",
                      content:
                        "Estimado usuario, El valor de dolares ingresado supera al valor del cupo disponible, saldo disponible: $" +
                        objHeadBilling.saldoFacturas +
                        " ¿Desea continuar con la transacción?",
                    });
                    if (!respuesta) {
                      liberarHabilitar(status);
                      return;
                    } else {
                      setIsLoading(true);
                    }
                  }
                } else {
                  const objBoquilla = (selectedSurtidor?.boquillas ?? []).find(
                    (x) => x.codigo_boquilla === valorDispensar.boquilla,
                  );
                  if (objBoquilla) {
                    const valorDolares =
                      parseFloat(valorDispensar.galones) * objBoquilla.pvp;
                    if (
                      valorDolares.toFixedNew(2) >
                      parseFloat(objHeadBilling.saldoFacturas)
                    ) {
                      setIsLoading(false);
                      const respuesta = await showModal({
                        title: "Información",
                        content:
                          "Estimado usuario, El galonaje ingresado supera al valor del saldo disponible, saldo disponible: $" +
                          objHeadBilling.saldoFacturas +
                          " ¿Desea continuar con la transacción?",
                      });
                      if (!respuesta) {
                        liberarHabilitar(status);
                        return;
                      } else {
                        setIsLoading(true);
                      }
                    }
                  } else {
                    setIsLoading(false);
                    showAlert({
                      title: "Información",
                      message:
                        "Estimado usuario, No se pudo encontrar la boquilla para calcular el precio con los galones",
                    });
                    liberarHabilitar(status);
                    return;
                  }
                }
              }
            } else {
              setIsLoading(false);
              const respuesta = await showModal({
                title: "Información",
                content:
                  "Estimado usuario el cliente no posee cupo, ¿Desea continuar con la transacción?",
              });
              if (!respuesta) {
                liberarHabilitar(status);
                return;
              } else {
                setIsLoading(true);
              }
            }
          }
          const consumidorFinal = JSON.parse(parametrizacion.consumidorFinal);
          const dataSend = {
            searchAdvance: true,
            establecimiento_sri: establecimientoSRI,
            puntoemision_sri: puntoEmision,
            establecimiento_id: establecimientoid,
            fechaemision: currentDate(),
            caja_id: cajaId,
            usuariovendedor_id: usuario.user_id,
            surtidor_id: selectedSurtidor.surtidor_id,
            factura_id: 0,
            notaentrega_id: selectedSurtidor?.notaentrega?.id ?? 0,
            proforma_id: selectedSurtidor?.proforma?.id ?? 0,
            turno_id: turnoActivo?.id ?? 0,
            asignacionturno_id: turnoActivo?.asignacionturno_id ?? 0,
            grupomenu_id: 0,
            isMobile: true,
            menu_id: menuId,
            cliente_id: isPrueba
              ? consumidorFinal.id
              : parametrizacion.busquedaPlacaConProforma
                ? cliente_id != null
                  ? cliente_id
                  : status
                    ? objHeadBilling.cliente_id
                    : 0
                : (cliente_id ?? objHeadBilling.cliente_id),
            direccion: isPrueba
              ? consumidorFinal.direccion
              : objHeadBilling.direccion,
            correo: isPrueba ? consumidorFinal.email : objHeadBilling.correo,
            telefono: isPrueba
              ? consumidorFinal.telefono
              : objHeadBilling.telefono,
            generaproforma: status ?? false,
            bodega_id: bodegaId,
            placas: JSON.stringify(arrPlacas),
            pago: status ? JSON.stringify(objPago) : "",
            tipoventa: objHeadBilling.tipoventa ?? "CO",
            transaccion_transactor:
              selectedSurtidor?.transaccion_transactor ?? 0,
            facturaanticipo_id: objHeadBilling.pagoanticipado
              ? objHeadBilling.facturaanticipo_id
              : 0,
            pruebatecnica: isPrueba,
            verificarProforma: true,
          };

          let getData = null;
          let statusData = 0;
          const queryParams = new URLSearchParams(dataSend).toString();
          if ((conexionTransactor?.conectado_post ?? false) || !status) {
            if (
              !objHeadBilling.pagoanticipado &&
              (objHeadBilling?.arrPagosanticipados ?? []).length > 0 &&
              status
            ) {
              setIsLoading(false);

              const respuesta = await showModal({
                title: "Información",
                content:
                  "El cliente tiene pagos anticipados, ¿Desea realizar una factura normal o escoger un pago?",
              });
              if (!respuesta) {
                liberarHabilitar(status);
                return;
              } else {
                setIsLoading(true);
              }
            }

            instance
              .get(
                `api/v1/cartera/cliente/search/placa/${periodofiscal_id}/${
                  isPrueba ? "ZZZ9999" : numeroplaca.toUpperCase()
                }?${queryParams}`,
              )
              .then((resp) => {
                getData = resp.data;
                statusData = resp.data.status;
                if (resp.data.status === 200 && status) {
                  if (!isDesarrollo && !proformaEnProceso) {
                    despachoDispensador(valorAnticipo);
                  }
                  setSelectedSurtidor(null);
                  setIsOpenModalPruebasTecnicas(false);
                  setModalVisible(false);
                  setRefreshData((prev) => !prev);
                }
                if (statusData === 200) {
                  const data = getData;
                  if (status) {
                    setValorDispensar({ dolares: 0, galones: 0, boquilla: "" });
                    setObjHeadBilling({
                      ...objHeadBilling,
                      placa: "",
                      cliente_id: 0,
                      cliente_codigo: "",
                      n_identificacion: "",
                      nombreCliente: "",
                      telefono: "",
                      direccion: "",
                      direccionFinal: "",
                      correo: "",
                      diasplazo: 0,
                      nombrecomercial: "",
                      saldoFacturas: 0,
                    });
                  } else {
                    let arrAnticipos = [];
                    if (data.item.pagoanticipado) {
                      const objBoquilla = (
                        selectedSurtidor?.boquillas ?? []
                      ).find(
                        (x) => x.codigo_boquilla === valorDispensar.boquilla,
                      );
                      if (objBoquilla) {
                        arrAnticipos = (
                          data.item.pagosanticipados ?? []
                        ).filter(
                          (x) =>
                            x.producto_id === objBoquilla.producto_id &&
                            x.total > 0,
                        );
                        setFacturasAnticipadas(arrAnticipos);
                      }
                    }

                    const rawPlacas = data.item?.placas;

                    const strPlacas =
                      typeof rawPlacas === "string"
                        ? rawPlacas
                        : JSON.stringify(rawPlacas);

                    const responseArrPlacas = JSON.parse(strPlacas ?? "[]");
                    const objPlaca = responseArrPlacas.find(
                      (x) =>
                        x.placa.toUpperCase() ===
                        objHeadBilling.placa.toUpperCase(),
                    );
                    let placaHabilitadaCredito = false;

                    if (parametrizacion.validarPlacaForCreditos) {
                      if (objPlaca && objPlaca.credito) {
                        placaHabilitadaCredito = true;
                      }
                    } else {
                      placaHabilitadaCredito = true;
                    }

                    setObjHeadBilling((prevState) => ({
                      ...prevState,
                      cliente_codigo: data.item.codigo,
                      cliente_id: data.item.id,
                      n_identificacion: data.item.numeroidentificacion,
                      nombreCliente: data.item.nombrecompleto,
                      telefono: data.item.telefonocelular ?? "",
                      direccion: cliente_id
                        ? prevState.direccion
                        : (data.item.direccion ?? ""),
                      correo: cliente_id
                        ? prevState.correo
                        : data.item.correopersonal,
                      placas: data.item.placas,
                      placa: objHeadBilling.placa,
                      cupocredito:
                        !data.item.permitir_orden_venta &&
                        data.item.cupocredito &&
                        placaHabilitadaCredito
                          ? parseFloat(data.item.cupocredito)
                          : 0,
                      tipoventa:
                        !data.item.permitir_orden_venta &&
                        data.item.cupocredito &&
                        parseFloat(data.item.cupocredito) > 0 &&
                        placaHabilitadaCredito
                          ? "CR"
                          : "CO",
                      permitir_orden_venta:
                        data.item.permitir_orden_venta && placaHabilitadaCredito
                          ? data.item.permitir_orden_venta
                          : false,
                      pagoanticipado:
                        !data.item.permitir_orden_venta &&
                        data.item.pagoanticipado &&
                        placaHabilitadaCredito
                          ? data.item.pagoanticipado
                          : false,
                      arrPagosanticipados: data.item.pagosanticipados ?? [],
                      facturaanticipo_id:
                        arrAnticipos.length >= 1
                          ? arrAnticipos[0].id +
                            "," +
                            arrAnticipos[0].tipo_documento
                          : 0,
                      resp_permitir_orden_venta: data.item.permitir_orden_venta,
                      resp_pagoanticipado: data.item.pagoanticipado,
                      resp_cupocredito: data.item.cupocredito ?? 0,
                      resp_arrPagosanticipados:
                        data.item.pagosanticipados ?? [],
                      saldoFacturas: data.item.saldoFacturas ?? 0,
                    }));
                  }
                } else if (statusData === 203) {
                  //desbloqueoSurtidor(selectedSurtidor.codigo_transactor); //no descomentar
                } else if (statusData === 406) {
                  setSelectedSurtidor(null);
                  setIsOpenModalPruebasTecnicas(false);
                  setModalVisible(false);
                  setRefreshData((prev) => !prev);
                }
                setIsLoading(false);
              })
              .catch((error) => {
                let messageError = "";
                if (error.response?.data) {
                  if (error.response?.data?.detail) {
                    messageError = error.response?.data?.detail;
                  } else if (error.response?.data?.error?.message) {
                    messageError = error.response?.data?.error?.message;
                  }
                }
                setIsLoading(false);
                if (messageError.includes("Registro duplicado")) {
                  setSelectedSurtidor(null);
                  setIsOpenModalPruebasTecnicas(false);
                  setModalVisible(false);
                  setRefreshData((prev) => !prev);
                } else {
                  showAlert({
                    title: "Error",
                    message: "Error en la consulta: " + messageError,
                  });
                }
              })
              .finally(() => {
                if (status === true) {
                  habilitarRef.current = false;
                }
              });
          } else {
            setIsLoading(false);
            if (status) {
              showAlert({
                title: "Información",
                message: "Perdida de conexion del surtidor con el dispositivo!",
              });
            }
            liberarHabilitar(status);
            return;
          }
        } else {
          setIsLoading(false);
          showAlert({
            title: "Información",
            message:
              "Debe seleccionar un tipo de combustible para habilitar el dispensador",
          });
          liberarHabilitar(status);
        }
      } else {
        setIsLoading(false);
        showAlert({
          title: "Información",
          message:
            "Formato de placa invalida, verifique que tenga ingresado un formato valido",
        });
        liberarHabilitar(status);
      }
    } else {
      if (!status) {
        showAlert({
          title: "Información",
          message: "Debe ingresar una placa valida para poder buscar",
        });
      } else {
        showAlert({
          title: "Información",
          message:
            "Debe ingresar una placa y tener cargado un cliente para poder buscar",
        });
        liberarHabilitar(status);
      }
    }
  };

  function searchClientebyCodigo() {
    if (objHeadBilling.cliente_codigo !== "") {
      setIsLoading(true);
      instance
        .get(
          `api/v1/cartera/cliente/search/bycodigo/${periodofiscal_id}/${objHeadBilling.cliente_codigo}`,
        )
        .then((resp) => {
          if (resp.data.status === 200) {
            const itemSupplier = resp.data.item;
            if (itemSupplier.estado) {
              const { persona } = itemSupplier;
              const nombreCliente = persona.nombrecompleto;
              const placas = itemSupplier.placas
                ? JSON.parse(itemSupplier.placas)
                : [];
              placas
                .filter((x) => x.placa === objHeadBilling.placa)
                .forEach((item) => {
                  if (
                    !placas.map((element) => element.placa).includes(item.placa)
                  ) {
                    placas.push(item);
                  }
                });

              let arrAnticipos = [];
              if (itemSupplier.pagoanticipado) {
                const objBoquilla = (selectedSurtidor?.boquillas ?? []).find(
                  (x) => x.codigo_boquilla === valorDispensar.boquilla,
                );
                if (objBoquilla) {
                  arrAnticipos = (resp.data.pagosanticipados ?? []).filter(
                    (x) =>
                      x.producto_id === objBoquilla.producto_id && x.total > 0,
                  );
                  setFacturasAnticipadas(arrAnticipos);
                }
              }

              let defaultTipoventa =
                (itemSupplier.cupocredito ?? 0) > 0 ? "CR" : "CO";
              let defaultCupocredito = itemSupplier.cupocredito ?? 0;
              let defaultPermitir_orden_venta =
                itemSupplier.permitir_orden_venta;
              let defaultPagoanticipado = itemSupplier.pagoanticipado ?? false;
              let defaultArrPagosanticipados = resp.data.pagosanticipados ?? [];
              let defaultFacturaanticipo_id =
                arrAnticipos.length >= 1
                  ? arrAnticipos[0].id + "," + arrAnticipos[0].tipo_documento
                  : 0;

              if (parametrizacion.validarPlacaForCreditos) {
                defaultTipoventa = "CO";
                defaultCupocredito = 0;
                defaultPermitir_orden_venta = false;
                defaultPagoanticipado = false;
                defaultArrPagosanticipados = [];
                defaultFacturaanticipo_id = 0;
              }

              setObjHeadBilling((prevState) => ({
                ...prevState,
                n_identificacion: itemSupplier.persona.numeroidentificacion,
                cliente_codigo: itemSupplier.codigo,
                cliente_id: itemSupplier.id,
                nombreCliente: nombreCliente,
                telefono: persona.telefonocelular ?? "",
                direccion: persona.direccion ?? "",
                direccionFinal: "",
                correo: persona.correopersonal,
                porcentajedescuento: itemSupplier.porcentajedescuento ?? 0,
                diasplazo: 0,
                fechavencimiento: "",
                vendedor_id: 0,
                placa: placas[0]?.placa ?? "",
                placas: placas,
                nombrecomercial: itemSupplier.nombrecomercial,
                tipoventa: defaultTipoventa,
                cupocredito: defaultCupocredito,
                permitir_orden_venta: defaultPermitir_orden_venta,
                pagoanticipado: defaultPagoanticipado,
                arrPagosanticipados: defaultArrPagosanticipados,
                facturaanticipo_id: defaultFacturaanticipo_id,
                resp_permitir_orden_venta: itemSupplier.permitir_orden_venta,
                resp_pagoanticipado: itemSupplier.pagoanticipado ?? false,
                resp_cupocredito: itemSupplier.cupocredito ?? 0,
                resp_arrPagosanticipados: resp.data.pagosanticipados ?? [],
                saldoFacturas: itemSupplier.saldoFacturas ?? 0,
              }));
              ToastAndroid.show("Cliente Encontrado", ToastAndroid.SHORT);
              if (selectedSurtidor?.proforma) {
                searchPlaca(false, itemSupplier.id);
              }
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
            showAlert({
              title: "Información",
              message:
                "Estimado usuario no existen datos relacionados a este número de identificación!",
            });
          }
        })
        .catch((err) => {
          setIsLoading(false);
          showAlert({
            title: "Error",
            message: "Hubo un error",
          });
        });
    } else {
      showAlert({
        title: "Información",
        message: "Estimado usuario debe ingresar un numero de identificacion",
      });
    }
  }

  const handleOnSubmitEditing = (name) => {
    if (name === "n_identificacion") {
      searchIdentificacion();
    } else if (name === "placa") {
      searchPlaca();
    } else if (name === "cliente_codigo") {
      searchClientebyCodigo();
    }
  };

  const changeValoresDespache = (name, value, changeName) => {
    if (selectedSurtidor) {
      setValorDispensar((prev) => ({
        ...prev,
        [name]: value,
        [changeName]: "0.00",
      }));
    } else {
      ToastAndroid.show(
        "Estimado usuario debe seleccionar un surtidor",
        ToastAndroid.SHORT,
      );
    }
  };

  const createChangeHandlerPago = (name, value, selectedIndex) => {
    if (selectedSurtidor) {
      let idxObjSelectedChoose = {};
      if (
        name === "banco_id" ||
        name === "tarjeta_id" ||
        name === "formapago_id"
      ) {
        if (name === "formapago_id") {
          const objFormaPago = tipoPago.find((x) => x.id === parseInt(value));
          if (objFormaPago) {
            idxObjSelectedChoose.abreviatura = objFormaPago.abreviatura;
          }
        }
      }

      setObjPago((prev) => ({
        ...prev,
        [name]: value,
        ...idxObjSelectedChoose,
      }));
      setEditData(!isEditData);
    } else {
      showAlert({
        title: "Información",
        message:
          "Estimado usuario debe seleccionar un surtidor para cargar los datos",
      });
    }
  };

  const callCliente = (data) => {
    let arrAnticipos = [];
    if (data.pagoanticipado) {
      const objBoquilla = (selectedSurtidor?.boquillas ?? []).find(
        (x) => x.codigo_boquilla === valorDispensar.boquilla,
      );
      if (objBoquilla) {
        arrAnticipos = (data.pagosanticipados ?? []).filter(
          (x) => x.producto_id === objBoquilla.producto_id && x.total > 0,
        );
        setFacturasAnticipadas(arrAnticipos);
      }
    }

    let defaultTipoventa = (data.cupocredito ?? 0) > 0 ? "CR" : "CO";
    let defaultCupocredito = data.cupocredito ?? 0;
    let defaultPermitir_orden_venta = data.permitir_orden_venta;
    let defaultPagoanticipado = data.pagoanticipado ?? false;
    let defaultArrPagosanticipados = data.pagosanticipados ?? [];
    let defaultFacturaanticipo_id =
      arrAnticipos.length >= 1
        ? arrAnticipos[0].id + "," + arrAnticipos[0].tipo_documento
        : 0;

    if (parametrizacion.validarPlacaForCreditos) {
      defaultTipoventa = "CO";
      defaultCupocredito = 0;
      defaultPermitir_orden_venta = false;
      defaultPagoanticipado = false;
      defaultArrPagosanticipados = [];
      defaultFacturaanticipo_id = 0;
    }

    const placas = data.placas ? JSON.parse(data.placas) : [];
    placas
      .filter((x) => x.placa === objHeadBilling.placa)
      .forEach((item) => {
        if (!placas.map((element) => element.placa).includes(item.placa)) {
          placas.push(item);
        }
      });

    setObjHeadBilling({
      autorizacionsri: "",
      cliente_id: data.id,
      cliente_codigo: data.codigo,
      nombreCliente: data.nombrecompleto,
      n_identificacion: data.numeroidentificacion,
      telefono: data.telefonocelular ?? "",
      direccion: data.direccion,
      placas: placas,
      placa: "",
      correo: data.correopersonal,
      tipoventa: defaultTipoventa,
      cupocredito: defaultCupocredito,
      permitir_orden_venta: defaultPermitir_orden_venta,
      pagoanticipado: defaultPagoanticipado,
      arrPagosanticipados: defaultArrPagosanticipados ?? [],
      facturaanticipo_id: defaultFacturaanticipo_id,
      resp_permitir_orden_venta: data.permitir_orden_venta,
      resp_pagoanticipado: data.pagoanticipado ?? false,
      resp_cupocredito: data.cupocredito ?? 0,
      resp_arrPagosanticipados: data.pagosanticipados ?? [],
      saldoFacturas: data.saldoFacturas ?? 0,
    });
    if (selectedSurtidor?.proforma) {
      searchPlaca(false, data.id);
    }
    setSearchPersonModal(false);
  };

  const actionHabilitarModal = () => {
    if (
      valorDispensar.boquilla === "01" ||
      valorDispensar.boquilla === "02" ||
      valorDispensar.boquilla === "03"
    ) {
      if (!isDesarrollo) {
        despachoDispensador();
      }
    } else {
      setIsLoading(false);
      ToastAndroid.show(
        "Debe seleccionar un tipo de combustible para habilitar el dispensador",
        ToastAndroid.SHORT,
      );
    }
  };

  const despachoDispensador = async (saldodispensar = null) => {
    const url =
      (conexionTransactor?.url_post ?? "") +
      "/" +
      (conexionTransactor?.conectionId_post ?? "") +
      "/commands/";
    if (url !== "") {
      let dataPost = "";
      const informationTransactor = arrDataTransactorSurtidores.find(
        (x) => x.codigofila_transactor === selectedSurtidor.codigo_transactor,
      );
      if (informationTransactor && informationTransactor[2] === "I") {
        if (
          (valorDispensar.galones === "" ||
            parseFloat(valorDispensar.galones) === 0) &&
          (valorDispensar.dolares === "" ||
            parseFloat(valorDispensar.dolares) === 0)
        ) {
          if (saldodispensar) {
            const calcValue =
              parseFloat(saldodispensar) *
              (parametrizacion.valorMultiplicadorGasolinera ?? 100);
            const valorDolar = calcValue.toString().padStart(6, "0");
            dataPost = {
              comando: `OS ${selectedSurtidor.codigo_transactor} $${valorDolar} O${valorDispensar.boquilla}@#`,
            };
          } else {
            dataPost = {
              comando: `OS ${selectedSurtidor.codigo_transactor} $999999 O${valorDispensar.boquilla}@#`,
            };
          }
        } else if (parseFloat(valorDispensar.dolares) > 0) {
          const calcValue =
            parseFloat(valorDispensar.dolares) *
            (parametrizacion.valorMultiplicadorGasolinera ?? 100);
          const valorDolar = calcValue.toString().padStart(6, "0");
          dataPost = {
            comando: `OS ${selectedSurtidor.codigo_transactor} $${valorDolar} O${valorDispensar.boquilla}@#`,
          };
        } else if (parseFloat(valorDispensar.galones) > 0) {
          const calcValue = parseFloat(valorDispensar.galones) * 1000;
          const valorGalones = calcValue.toString().padStart(6, "0");
          dataPost = {
            comando: `OS ${selectedSurtidor.codigo_transactor} V${valorGalones} O${valorDispensar.boquilla}@#`,
          };
        }
        instance
          .post(url, dataPost, config)
          .then((resp) => {
            closeModalHabilitarDispensador();
            if (resp.data?.title === "Lectura exitosa") {
              const clearData = resp.data.data.split("\r\n");
              const dataTransactor = clearData[1] ?? "";
              if (dataTransactor !== "OK") {
                //  despachoDispensador(); ---> no descomentar
              }
              //closeModalHabilitarDispensador(); --> no descomentar
            } else {
              // despachoDispensador(); --> no descomentar
            }
          })
          .catch((err) => {
            setIsLoading(false);
            showAlert({
              title: "Error",
              message: "Hubo un error",
            });
          });
      }
    }
  };

  const desbloqueoSurtidor = async (codigo_fila) => {
    const url =
      (conexionTransactor?.url_post ?? "") +
      "/" +
      (conexionTransactor?.conectionId_post ?? "") +
      "/commands/";
    if (url !== "") {
      const dataPost = { comando: `CS ${codigo_fila}@#` };
      instance
        .post(url, dataPost, config)
        .then((resp) => {
          if (resp.data?.title === "Lectura exitosa") {
            const clearData = resp.data.data.split("\r\n");
            const dataTransactor = clearData[1] ?? "";
            if (dataTransactor !== "OK") {
              if (!isDesarrollo) {
                desbloqueoSurtidor(codigo_fila);
              }
            }
          } else {
            if (!isDesarrollo) {
              desbloqueoSurtidor(codigo_fila);
            }
          }
        })
        .catch((err) => {
          setIsLoading(false);
          showAlert({
            title: "Error",
            message: "Hubo un error",
          });
        });
    }
  };

  const saveEgresoInventario = async (objProforma, objSurtidor) => {
    setIsLoading(true);
    let surtidorSeleccionado = objSurtidor;
    const precios = JSON.parse(surtidorSeleccionado.producto.precios);
    const precioIva = precios[1];
    const cantidad = surtidorSeleccionado.dolares / precioIva;
    if (cantidad > 0) {
      const valorImpuestoIVA = surtidorSeleccionado.producto.ct_porcentajeiva
        ? parseFloat(surtidorSeleccionado.producto.ct_porcentajeiva.valor)
        : porcentajeIVA;
      const detalletransaccion = [
        {
          id: 0,
          producto_id: surtidorSeleccionado.producto.id,
          costo: surtidorSeleccionado.producto.impuesto
            ? precioIva / (valorImpuestoIVA / 100 + 1)
            : precioIva,
          cantidad: cantidad,
          bodega_id: bodegaId,
          impuesto: surtidorSeleccionado.producto.impuesto
            ? valorImpuestoIVA
            : 0,
          comentario: "",
          listaprecio_identificador: "1",
          porcentaje_descuento: 0,
          establecimiento_id: objProforma.establecimiento.id,
          new: true,
          update: false,
          delete: false,
        },
      ];

      const dataComprobante = {
        bodega_origen_id: bodegaId,
        bodega_destino_id: null,
        tipo_documento: "EGR",
        periodofiscal_id,
        fechaemision: currentDate(),
        fechavencimiento: currentDate(),
        usuariovendedor_id: objProforma.usuariovendedor_id,
        establecimiento_id: objProforma.establecimiento.id,
        pedido_id: 0,
        isMobile: true,
        encabezado_transaccion_id: 0,
        detalletransaccion: detalletransaccion,
        grupomenu_id: 0,
        menu_id: 0,
        validationStock: false,
        surtidor_id: surtidorSeleccionado.id,
        codigomovil: surtidorSeleccionado.transaccion_transactor,
        isla_id: turnoActivo?.isla_id ?? 0,
        asignacionturnoapoyo_id: turnoActivo?.asignacionturnoapoyo_id ?? 0,
      };
      instance
        .put(
          `api/v1/gasolinera/surtidor/save/prueba/tecnica/${objProforma.id}/${periodofiscal_id}/0/0`,
          dataComprobante,
          config,
        )
        .then((resp) => {
          if (resp.data.status === 202) {
            setIsLoading(false);
            if (resp.data.id > 0) {
              if (!isDesarrollo) {
                desbloqueoSurtidor(objSurtidor.codigo_transactor.split(",")[0]);
              }
              printEgreso(resp.data.id);
              setRefreshData((prev) => !prev);
            } else {
              showAlert({
                title: "Información",
                message: "El egreso no pudo ser generado",
              });
            }
          }
        })
        .catch((err) => {
          setIsLoading(false);
          showAlert({
            title: "Error",
            message: "Hubo un error",
          });
        });
      setIsLoading(false);
    } else {
      setIsLoading(false);
      showAlert({
        title: "Información",
        message:
          "Estimado usuario debe ingresar una cantidad mayor a 0 parea guardar la venta",
      });
    }
  };

  const sendEgreso = () => {
    setIsLoading(true);
    const objTransactor = arrDataTransactorSurtidores.find(
      (data) =>
        data.estado_transactor === "Ci" &&
        data.codigofila_transactor === selectedSurtidor.codigo_transactor,
    );
    if (objTransactor) {
      const arrSurtidorFacturar = arrsurtidores.filter(
        (x) => x.codigo_transactor.split(",")[0] === objTransactor["0"],
      );
      if (arrSurtidorFacturar.length > 0) {
        const objProforma = arrSurtidorFacturar.find((pro) => pro.proforma);
        let objSurtidor = arrSurtidorFacturar.find(
          (surt) =>
            surt.codigo_transactor ===
            objTransactor[0] + "," + objTransactor[8],
        );

        if (objProforma && objSurtidor) {
          setIsLoading(false);
          saveEgresoInventario(objProforma.proforma, {
            ...objSurtidor,
            dolares: parseFloat(objTransactor[4]).toFixed(2),
            galones: parseFloat(objTransactor[5]).toFixed(4),
            transaccion_transactor: objTransactor.transaccion_transactor,
          });
        }
      } else {
        setIsLoading(false);
        showAlert({
          title: "Información",
          message:
            "Estimado usuario, no se encontro dispensador enlazado disponible para guardar el egreso",
        });
      }
    } else {
      setIsLoading(false);
      showAlert({
        title: "Información",
        message:
          "Estimado usuario, el dispensador no ha terminado de despachar, verifique que la manguera este colgada",
      });
    }
  };

  const printEgreso = (idComprobante) => {
    setIsLoading(true);
    const dataPrint = {
      menu_id: menuId,
      periodofiscal_id: periodofiscal_id,
      esquema: "Inventory",
      entidad: "ComprobanteInventario",
      tipo: "PRUEBATECNICA",
      clave_primaria: [
        {
          "c.id": idComprobante,
          "c.periodofiscal_id": periodofiscal_id,
          "c.tipo_documento": "EGR",
          isHideHeader: "true",
        },
      ],
    };

    instance
      .post("api/v1/gasolinera/formatoimpresion/html/print", dataPrint)
      //.post("api/v1/formatoimpresion/html/print", dataPrint)
      .then((resp) => {
        if (resp.data.status === 200) {
          if (resp.data.item !== "") {
            print(resp.data.item);
            setSelectedSurtidor(null);
            setValores({ dolares: 0, galones: 0, estado_transactor: "" });
            resetData();
            setRefreshData((prev) => !prev);
          } else {
            setSelectedSurtidor(null);
            setValores({ dolares: 0, galones: 0, estado_transactor: "" });
            resetData();
            setRefreshData((prev) => !prev);
            showAlert({
              title: "Información",
              message:
                "Estimado usuario, no se ha encontrado un formato de impresión para esta ventana, por favor contacte con el proveedor del sistema!",
            });
          }
        }
        setIsLoading(false);
      })
      .catch((error) => {
        showAlert({
          title: "Información",
          message:
            "Hubo un problema al obtener los datos del registro para la impresion!",
        });
        setIsLoading(false);
      });
  };

  const printerDeposito = async (deposito_id) => {
    setIsLoading(true);
    ToastAndroid.show(
      "El deposito se ha ingresado correctamente",
      ToastAndroid.SHORT,
    );
    setSearchDepositoModal(false);
    const dataPrint = {
      menu_id: menuId,
      periodofiscal_id: periodofiscal_id,
      esquema: "Sale",
      entidad: "IngresoEgresoCaja",
      tipo: "DEPOSITO",
      getData: true,
      clave_primaria: [
        {
          "co.id": deposito_id,
          "co.periodofiscal_id": periodofiscal_id,
          "co.tipo_documento": "EGR",
          isHideHeader: "true",
        },
      ],
    };

    instance
      .post("api/v1/gasolinera/formatoimpresion/html/print", dataPrint, config)
      //.post("api/v1/formatoimpresion/html/print", dataPrint, config)
      .then(async (resp) => {
        if (resp.data.status === 200) {
          if (resp.data.item !== "") {
            print(resp.data.item);
          } else {
            showAlert({
              title: "Información",
              message:
                "Estimado usuario, no se ha encontrado un formato de impresión para esta ventana, por favor contacte con el proveedor del sistema!",
            });
          }
        }
        setIsLoading(false);
      })
      .catch((error) => {
        showAlert({
          title: "Información",
          message: "Hubo un problema al obtener los datos del registro!",
        });
        setIsLoading(false);
      });
  };

  const printerCierreCaja = async () => {
    setIsLoading(true);
    const fechaActual = currentDate();
    instance
      .get(
        `api/v1/gasolinera/surtidor/information/cierre/turno/${periodofiscal_id}/${
          turnoActivo.asignacionturno_id ?? 0
        }/${usuario.user_id}/${fechaActual}`,
      )
      .then((res) => {
        if (res.data.status === 200) {
          const userData = {
            ...usuario,
            nombre: usuario.nombreCompleto,
          };
          const dataPrint = {
            menu_id: menuId,
            periodofiscal_id: periodofiscal_id,
            tipo: "CIERRECAJA",
            object: {
              surtidores: res.data.surtidores,
              productos: res.data.productos,
              productosLecturas: res.data.productosLecturas,
              creditos: res.data.creditos,
              ordenventas: res.data.ordenventas,
              pagos: res.data.pagos,
              egresos: res.data.egresos,
              turno: turnoActivo,
              vendedor: userData,
              isHideHeader: true,
              contribuyente: contribuyente,
            },
          };
          setIsLoading(false);
          print(dataPrint);
          if (socketGeneral) {
            socketGeneral.emit("logoutUser", {
              usuarioId: usuario.user_id,
              rucContribuyente: contribuyente.ruc,
            });
          }
          logout();
        }
      })
      .catch((err) => {
        setIsLoading(false);
        showAlert({
          title: "Error",
          message: "Hubo un error",
        });
      });
  };

  const sendFacturacion = (isdeuna = false, isPinPad = false) => {
    if (sendingRef.current) return;
    sendingRef.current = true;

    setIsLoading(true);

    try {
      const objTransactor = arrDataTransactorSurtidores.find(
        (data) =>
          data.estado_transactor === "Ci" &&
          data.codigofila_transactor === selectedSurtidor.codigo_transactor,
      );

      if (!validateFormatPlaca(objHeadBilling.placa.toUpperCase())) {
        throw new Error("Formato de placa invalida");
      }

      if (!objTransactor) {
        throw new Error(
          "El dispensador no ha terminado de despachar, verifique que la manguera este colgada",
        );
      }

      const arrSurtidorFacturar = arrsurtidores.filter(
        (x) => x.codigo_transactor.split(",")[0] === objTransactor[0],
      );

      if (!arrSurtidorFacturar.length) {
        throw new Error(
          "No se encontro dispensador enlazado disponible para facturar",
        );
      }

      const objSurtidor = arrSurtidorFacturar.find(
        (surt) =>
          surt.codigo_transactor === objTransactor[0] + "," + objTransactor[8],
      );

      if (
        parametrizacion.habilitarPrimeroyFacturar &&
        !selectedSurtidor.proforma
      ) {
        setIsLoading(false);
        sendPrimeroyFacturar({
          ...objSurtidor,
          dolares: parseFloat(objTransactor[4]).toFixed(2),
          galones: parseFloat(objTransactor[5]).toFixed(4),
          transaccion_transactor: objTransactor.transaccion_transactor,
        });
        return;
      }

      if (isdeuna) {
        sendingRef.current = false;
        setIsLoading(false);
        setIsOpenModalPagarDeUna(true);
      } else if (isPinPad) {
        sendingRef.current = false;
        setIsLoading(false);
        setIsOpenModalPagarPinPad(true);
      } else {
        saveFactura(selectedSurtidor.proforma, {
          ...objSurtidor,
          dolares: parseFloat(objTransactor[4]).toFixed(2),
          galones: parseFloat(objTransactor[5]).toFixed(4),
          transaccion_transactor: objTransactor.transaccion_transactor,
        });
      }
    } catch (e) {
      setIsLoading(false);
      sendingRef.current = false;
      showAlert({
        title: "Información",
        message: e.message,
      });
    }
  };

  const printDocument = (
    idComprobante = null,
    tipo = "FAC",
    estacion_id = null,
  ) => {
    setIsLoading(true);
    const dataPrint = {
      menu_id: menuId,
      periodofiscal_id: periodofiscal_id,
      esquema: "Sale",
      entidad:
        tipo !== "FAC" && tipo !== "TIK"
          ? "ComprobanteProforma"
          : "Facturacion",
      tipo: tipo !== "FAC" && tipo !== "TIK" ? "ORDEN-VENTA" : undefined,
      clave_primaria:
        tipo !== "FAC" && tipo !== "TIK"
          ? [
              {
                "c.id": idComprobante ?? 0,
                "c.periodofiscal_id": periodofiscal_id,
                "c.tipo_documento": tipo,
                isHideHeader: "true",
                numeroImpresion: 0,
              },
            ]
          : [
              {
                "f.id": idComprobante ?? 0,
                "f.periodofiscal_id": periodofiscal_id,
                "f.tipo_documento": tipo,
                isHideHeader: "true",
              },
            ],
    };
    instance
      .post("api/v1/gasolinera/formatoimpresion/html/print", dataPrint, config)
      //.post("api/v1/formatoimpresion/html/print", dataPrint, config)
      .then(async (resp) => {
        if (resp.data.status === 200) {
          if (resp.data.item !== "") {
            setSelectedSurtidor(null);
            print(resp.data.item, estacion_id);
            setValores({ dolares: 0, galones: 0, estado_transactor: "" });
            resetData();
            setRefreshData((prev) => !prev);
          } else {
            setSelectedSurtidor(null);
            setValores({ dolares: 0, galones: 0, estado_transactor: "" });
            resetData();
            setRefreshData((prev) => !prev);
            showAlert({
              title: "Información",
              message:
                "Estimado usuario, no se ha encontrado un formato de impresión para esta ventana, por favor contacte con el proveedor del sistema!",
            });
          }
        }
        setIsLoading(false);
      })
      .catch((error) => {
        showAlert({
          title: "Información",
          message:
            "Hubo un problema al obtener los datos del registro para la impresion!",
        });
        setIsLoading(false);
      });
  };

  const validarCamposPago = () => {
    let errores = {};

    if (objPago.abreviatura !== "EFE" && objPago.abreviatura !== "") {
      if (!objPago.banco_id) {
        errores.banco_id = "Debe seleccionar un banco";
      }

      if (objPago.abreviatura !== "TAR" && !objPago.numerodocumentobancario) {
        errores.numerodocumentobancario =
          "Debe ingresar un número de documento";
      }

      if (objPago.abreviatura === "TAR") {
        if (!objPago.tarjeta_id) {
          errores.tarjeta_id = "Debe seleccionar una tarjeta";
        }
        if (!objPago.lotevoucher) {
          errores.lotevoucher = "Debe ingresar el número de voucher";
        }
        if (!objPago.referenciavoucher) {
          errores.referenciavoucher = "Debe ingresar la referencia del voucher";
        }
      }

      if (
        (objPago.abreviatura === "CHE" || objPago.abreviatura === "OTR") &&
        !objPago.numerodocumentobancario
      ) {
        errores.numerodocumentobancario = "Debe ingresar el número de cuenta";
      }
    }

    return errores;
  };

  const saveFactura = async (objProforma, objSurtidor) => {
    if (objHeadBilling.autoconsumo && parametrizacion.establecimientoContable) {
      if (
        !objHeadBilling.establecimiento_contable_id ||
        objHeadBilling.establecimiento_contable_id === 0
      ) {
        ToastAndroid.show(
          "Debe seleccionar un establecimiento contable para autoconsumo",
          ToastAndroid.SHORT,
        );
        return;
      }
    }

    const errores = validarCamposPago();
    if (
      Object.keys(errores).length > 0 &&
      !parametrizacion.noValidarCamposPagoTarjeta
    ) {
      ToastAndroid.show("Debe rellenar todos los campos", ToastAndroid.SHORT);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let surtidorSeleccionado = objSurtidor;
    const precios = JSON.parse(surtidorSeleccionado.producto.precios);
    const precioIva = precios[1];
    const cantidad = surtidorSeleccionado.dolares / precioIva;
    const consumidorFinal = JSON.parse(parametrizacion.consumidorFinal);
    if (cantidad > 0) {
      if (
        objProforma?.cliente?.id === consumidorFinal.id &&
        !selectedSurtidor?.proforma?.pruebatecnica
      ) {
        if (
          parseFloat(valores.dolares) >
          parseFloat(parametrizacion.valorConsumidorFinal)
        ) {
          setIsLoading(false);
          showAlert({
            title: "Información",
            message: `Estimado usuario, el valor de la factura no debe ser mayor de $${parseFloat(
              parametrizacion.valorConsumidorFinal,
            ).toFixedNew(2)} para consumidor final`,
          });

          return;
        }
      }

      if (
        objHeadBilling.tipoventa === "CR" &&
        parametrizacion.isCupoCliente &&
        objHeadBilling.saldoFacturas < parseFloat(valores.dolares)
      ) {
        setIsLoading(false);
        showAlert({
          title: "Información",
          message: `Estimado usuario, la cantidad es mayor al cupo con el que cuenta el cliente $${objHeadBilling.saldoFacturas}`,
        });
        return;
      }

      const formapago_id = objHeadBilling.autoconsumo
        ? parametrizacion?.tipoPagoAutoconsumo?.tipoPagoAutoconsumo
        : objPago.formapago_id;
      const banco_id = objPago.banco_id;
      const numerocuentabancaria = objPago.numerocuentabancaria;
      const numerodocumentobancario = objPago.numerodocumentobancario;
      const tarjeta_id = objPago.tarjeta_id;
      const referenciavoucher = objPago.referenciavoucher;
      const lotevoucher = objPago.lotevoucher;
      const fechavencimientopago = objPago.fechavencimiento;

      const valorImpuestoIVA = surtidorSeleccionado.producto.ct_porcentajeiva
        ? parseFloat(surtidorSeleccionado.producto.ct_porcentajeiva.valor)
        : porcentajeIVA;
      const detalletransaccion = [
        {
          id: 0,
          producto_id: surtidorSeleccionado.producto.id,
          costo: surtidorSeleccionado.producto.impuesto
            ? precioIva /
              ((tipoDocumento === "FAC" ? valorImpuestoIVA : 0) / 100 + 1)
            : precioIva,
          cantidad: cantidad,
          bodega_id: bodegaId,
          impuesto:
            surtidorSeleccionado.producto.impuesto && tipoDocumento === "FAC"
              ? valorImpuestoIVA
              : 0,
          comentario: "",
          listaprecio_identificador: "1",
          porcentaje_descuento: 0,
          establecimiento_id: objProforma.establecimiento.id,
          new: true,
          update: false,
          delete: false,
        },
      ];

      let detallepago = [
        {
          id: 0,
          tipopago_id: formapago_id,
          valorpago:
            objHeadBilling.tipoventa === "CR"
              ? 0
              : surtidorSeleccionado.dolares,
          ct_banco: banco_id,
          valordescuento: 0,
          retencionfuente: 0,
          retencioniva: 0,
          numerocuentabancaria: numerocuentabancaria,
          numerodocumentobancario: numerodocumentobancario,
          ct_tarjeta: tarjeta_id,
          caja_id: objProforma.caja.id,
          establecimiento_id: objProforma.establecimiento.id,
          referenciavoucher: referenciavoucher,
          lotevoucher: lotevoucher,
          fechaemision: currentDate(),
          fechavencimiento: fechavencimientopago,
          usuariovendedor_id: objProforma.usuariovendedor_id,
          new: true,
          update: false,
          delete: false,
        },
      ];

      if (isconfirmado) {
        detallepago[0] = {
          ...detallepago[0],
          ...detallepagodeuna,
        };
        formapago_id = detallepagodeuna.tipopago_id;
      }

      const tipopagoObj = tipoPago.find((x) => x.id === parseInt(formapago_id));
      const deshabilitaImpresion = Boolean(
        tipopagoObj?.deshabilitar_impresion ?? false,
      );
      const placas = objProforma.cliente.placas;
      let arrPlacas =
        (placas ?? []).length > 0
          ? (typeof placas === "string" ? JSON.parse(placas) : placas).filter(
              (x) => x.placa.replace(/[_-]/g, "") !== "",
            )
          : [];
      let existePlaca = arrPlacas.some(
        (data) => data.placa.toLowerCase() === objProforma.placa.toLowerCase(),
      );
      if (!existePlaca) {
        arrPlacas.push({
          codigo: arrPlacas.length + 1,
          placa: objProforma.placa.toUpperCase(),
          modelo: "",
        });
      }

      const dataComprobante = {
        establecimiento_sri: establecimientoSRI,
        puntoemision_sri: puntoEmision,
        tipo_documento: tipoDocumento,
        periodofiscal_id,
        caja_id: objProforma.caja.id,
        fechaemision: objProforma.fechaemision,
        fechavencimiento: objProforma.fechavencimiento,
        establecimiento_id: objProforma.establecimiento.id,
        usuariovendedor_id: objProforma.usuariovendedor_id,
        encabezado_transaccion_id: 0,
        tipoventa: objHeadBilling.tipoventa,
        observacion: "",
        cliente: {
          id: objProforma.cliente.id,
          direccion: objProforma.cliente.persona.direccion,
          nombrecomercial: objProforma.cliente.nombrecomercial,
          telefono: objProforma.cliente.persona.telefonocelular,
          correo: objProforma.cliente.persona.correopersonal,
          placas: arrPlacas.filter((x) => x.placa.replace(/[_-]/g, "") !== ""),
        },
        detalletransaccion,
        detallepago: detallepago,
        grupomenu_id: 0,
        menu_id: menuId,
        placa: objHeadBilling.placa,
        surtidor_id: surtidorSeleccionado.id,
        facturado_gasolina: true,
        impresiondocumento: false,
        proformaacumulativo_id: 0,
        permissCredito: true,
        tipo_doc_aplica: "",
        comentario: "",
        codigomovil: surtidorSeleccionado.transaccion_transactor,
        isMobile: true,
        isla_id: turnoActivo?.isla_id ?? 0,
        asignacionturnoapoyo_id: turnoActivo?.asignacionturnoapoyo_id ?? 0,
        establecimiento_contable_id: objHeadBilling.establecimiento_contable_id,
      };
      instance
        .put(
          `api/v1/gasolinera/surtidor/save/comprobante/despacho/${objProforma.id}/${periodofiscal_id}/0/${menuId}`,
          dataComprobante,
          config,
        )
        .then((resp) => {
          if (resp.data.status === 202) {
            setIsLoading(false);
            if (resp.data.id > 0) {
              setisconfirmado(false);
              setEstadodeuna({
                ...estadodeuna,
                procesando: false,
                escaneando: false,
                confirmado: false,
                enviado: true,
                timeout: false,
              });
              setEstadoPinPad({
                ...estadoPinPad,
                procesando: false,
                confirmado: false,
                enviado: true,
                timeout: false,
              });
              if (!isDesarrollo) {
                desbloqueoSurtidor(objSurtidor.codigo_transactor.split(",")[0]);
              }
              if (parametrizacion.deshabilitaImpresionDespacho) {
                if (
                  !deshabilitaImpresion ||
                  objHeadBilling.tipoventa === "CR" ||
                  objHeadBilling.permitir_orden_venta
                ) {
                  printDocument(resp.data.id, resp.data.tipo_documento);
                } else {
                  setSelectedSurtidor(null);
                  setValores({ dolares: 0, galones: 0, estado_transactor: "" });
                  resetData();
                  setRefreshData((prev) => !prev);
                }
              } else {
                printDocument(resp.data.id, resp.data.tipo_documento);
              }
              toggleModal();
            } else {
              setIsLoading(false);
              showAlert({
                title: "Información",
                message: "La Factura no pudo ser generada",
              });
            }
          } else if (resp.data.status === 200) {
            setIsLoading(false);
            setRefreshData((prev) => !prev);
          }
        })
        .catch((error) => {
          let messageError = "";
          if (error.response.data) {
            if (error.response.data.detail) {
              messageError = error.response.data.detail;
            } else if (error.response.data.error.message) {
              messageError = error.response.data.error.message;
            }
          }
          setIsLoading(false);
          showAlert({
            title: "Error",
            message: "No se puede generar factura: " + messageError,
          });
        })
        .finally(() => {
          sendingRef.current = false;
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      showAlert({
        title: "Información",
        message:
          "Estimado usuario debe ingresar una cantidad mayor a 0 parea guardar la venta",
      });
    }
  };

  const sendPrimeroyFacturar = async (objSurtidor) => {
    setIsLoading(true);
    let surtidorSeleccionado = objSurtidor;

    const precios = JSON.parse(surtidorSeleccionado.producto.precios);
    const precioIva = precios[1];

    const cantidad = surtidorSeleccionado.dolares / precioIva; //surtidorSeleccionado.galones;

    const consumidorFinal = JSON.parse(parametrizacion.consumidorFinal);

    if (cantidad > 0) {
      try {
        if (objHeadBilling.cliente_id === consumidorFinal.id) {
          setIsLoading(false);
          showAlert({
            title: "Informacion!",
            message: `Estimado usuario, no se puede realizar una factura para consumidor final`,
          });
          return;
        }

        if (
          objHeadBilling.tipoventa === "CR" &&
          parametrizacion.isCupoCliente &&
          objHeadBilling.cupoCreditoCliente < parseFloat(valores.dolares)
        ) {
          setIsLoading(false);
          showAlert({
            title: "Informacion!",
            message: `Estimado usuario, la cantidad es mayor al cupo con el que cuenta el cliente $${objHeadBilling.cupoCreditoCliente}`,
          });
          return;
        }

        const formapago_id = objHeadBilling.autoconsumo
          ? parametrizacion?.tipoPagoAutoconsumo
          : objPago.formapago_id;
        const banco_id = objPago.banco_id;
        const numerocuentabancaria = objPago.numerocuentabancaria;
        const numerodocumentobancario = objPago.numerodocumentobancario;
        const tarjeta_id = objPago.tarjeta_id;
        const referenciavoucher = objPago.referenciavoucher;
        const lotevoucher = objPago.lotevoucher;
        const fechavencimientopago = objPago.fechavencimiento;

        const valorImpuestoIVA = surtidorSeleccionado.producto.ct_porcentajeiva
          ? parseFloat(surtidorSeleccionado.producto.ct_porcentajeiva.valor)
          : parametrizacion.porcentajeImpuesto;
        const detalletransaccion = [
          {
            id: 0,
            producto_id: surtidorSeleccionado.producto.id,
            costo: surtidorSeleccionado.producto.impuesto
              ? precioIva /
                ((tipoDocumento === "FAC" ? valorImpuestoIVA : 0) / 100 + 1)
              : precioIva,
            cantidad: cantidad,
            bodega_id: bodegaId,
            impuesto:
              surtidorSeleccionado.producto.impuesto && tipoDocumento === "FAC"
                ? valorImpuestoIVA
                : 0,
            comentario: "",
            listaprecio_identificador: "1",
            porcentaje_descuento: 0,
            establecimiento_id: establecimientoid,
            new: true,
            update: false,
            delete: false,
          },
        ];

        const dataPago = objPago;

        if (dataPago === undefined) {
          setIsLoading(false);
          showAlert({
            title: "Informacion!",
            message: `Debe ingresar una forma de pago que este dentro del listado de la lista de pagos`,
          });
          return;
        } else {
          if (dataPago.abreviatura !== "EFE" && !objHeadBilling.autoconsumo) {
            if (
              dataPago.abreviatura === "TAR" &&
              !parametrizacion.noValidarCamposPagoTarjeta
            ) {
              if (!tarjeta_id) {
                setIsLoading(false);
                showAlert({
                  title: "Informacion!",
                  message: `Debe seleccionar una tarjeta en el pago`,
                });
                return;
              }
              if (lotevoucher === "") {
                setIsLoading(false);
                showAlert({
                  title: "Informacion!",
                  message: `Debe ingresar un valor en el Voucher en el pago`,
                });
                return;
              }
              if (referenciavoucher === "") {
                setIsLoading(false);
                showAlert({
                  title: "Informacion!",
                  message: `Debe ingresar una referencia voucher en el pago`,
                });
                return;
              }
              if (!banco_id) {
                setIsLoading(false);
                showAlert({
                  title: "Informacion!",
                  message: `Debe seleccionar un banco en el pago`,
                });
                return;
              }
            }
            if (dataPago.abreviatura !== "TAR") {
              if (
                numerodocumentobancario === undefined ||
                numerodocumentobancario === "" ||
                (numerodocumentobancario === "0" &&
                  parametrizacion.ValidaNumeroComprobante)
              ) {
                setIsLoading(false);
                showAlert({
                  title: "Informacion!",
                  message: `Debe ingresar un numero de comprobante en el pago`,
                });
                return;
              }
            }
          }
        }

        const detallepago = [
          {
            id: 0,
            tipopago_id: formapago_id,
            valorpago:
              objHeadBilling.tipoventa === "CR"
                ? 0
                : surtidorSeleccionado.dolares,
            ct_banco: banco_id,
            valordescuento: 0,
            retencionfuente: 0,
            retencioniva: 0,
            numerocuentabancaria: numerocuentabancaria,
            numerodocumentobancario: numerodocumentobancario,
            ct_tarjeta: tarjeta_id,
            caja_id: cajaId,
            establecimiento_id: establecimientoid,
            referenciavoucher: referenciavoucher,
            lotevoucher: lotevoucher,
            fechaemision: currentDate(),
            fechavencimiento: fechavencimientopago,
            usuariovendedor_id: usuario.user_id,
            new: true,
            update: false,
            delete: false,
          },
        ];

        const tipopagoObj = objPago;
        const deshabilitaImpresion = Boolean(
          tipopagoObj?.deshabilita_impresion ?? false,
        );

        const placas = objHeadBilling.placas;
        let arrPlacas =
          (placas ?? []).length > 0
            ? (typeof placas === "string" ? JSON.parse(placas) : placas).filter(
                (x) => x.placa.replace(/[_-]/g, "") !== "",
              )
            : [];
        let existePlaca = arrPlacas.some(
          (data) =>
            data.placa.toLowerCase() === objHeadBilling.placa.toLowerCase(),
        );

        if (!existePlaca) {
          arrPlacas.push({
            codigo: arrPlacas.length + 1,
            placa: objHeadBilling.placa.toUpperCase(),
            modelo: "",
          });
        }
        const dataComprobante = {
          establecimiento_sri: establecimientoSRI,
          puntoemision_sri: puntoEmision,
          tipo_documento: tipoDocumento,
          periodofiscal_id,
          caja_id: cajaId,
          bodega_id: bodegaId,
          fechaemision: currentDate(),
          fechavencimiento: currentDate(),
          establecimiento_id: establecimientoid,
          usuariovendedor_id: usuario.user_id,
          encabezado_transaccion_id: 0,
          tipoventa: objHeadBilling.tipoventa,
          observacion: "",
          cliente: {
            id: objHeadBilling.cliente_id,
            direccion: objHeadBilling.direccion,
            nombrecomercial: objHeadBilling.nombrecomercial,
            telefono: objHeadBilling.telefono,
            correo: objHeadBilling.correo,
            placas: arrPlacas.filter(
              (x) => x.placa.replace(/[_-]/g, "") !== "",
            ),
          },
          detalletransaccion,
          detallepago: detallepago, //objProforma.cliente.permitir_orden_venta ? [] : detallepago,
          grupomenu_id: 0,
          menu_id: menuId,
          placa: objHeadBilling.placa, //objProforma.placa,
          surtidor_id: surtidorSeleccionado.id,
          facturado_gasolina: true,
          impresiondocumento: false,
          proformaacumulativo_id: 0,
          permissCredito: true,
          tipo_doc_aplica: "",
          comentario: "",
          codigomovil: surtidorSeleccionado.transaccion_transactor,
          isla_id: turnoActivo?.isla_id ?? 0,
          asignacionturnoapoyo_id: turnoActivo?.asignacionturnoapoyo_id ?? 0,
          establecimiento_contable_id:
            objHeadBilling.establecimiento_contable_id,
          turno_id: turnoActivo?.id ?? 0,
          verificarProforma: true,
          pago: objPago,
          asignacionturno_id: turnoActivo.asignacionturno_id ?? 0,
          pruebatecnica: false,
          isMobile: true,
        };
        const data = await instance.post(
          `api/v1/gasolinera/surtidor/save/habilitarprimero/despacho/${periodofiscal_id}/0/${menuId}`,
          dataComprobante,
          config,
        );

        if (data.status === 201) {
          setIsLoading(false);
          const respuesta = data.data;
          if (respuesta.id > 0) {
            if (!isDesarrollo) {
              desbloqueoSurtidor(objSurtidor.codigo_transactor.split(",")[0]);
            }
            if (parametrizacion.deshabilitaImpresionDespacho) {
              if (
                !deshabilitaImpresion ||
                objHeadBilling.tipoventa === "CR" ||
                objHeadBilling.permitir_orden_venta
              ) {
                printDocument(respuesta.id, respuesta.tipo_documento);
              } else {
                setRefresh(!isRefresh);
                setSelectedSurtidor(null);
                setValores({ dolares: 0, galones: 0, estado_transactor: "" });
                resetData();
              }
            } else {
              printDocument(respuesta.id, respuesta.tipo_documento);
            }

            toggleModal();
          }
        }
      } catch (error) {
        sendingRef.current = false;
        setIsLoading(false);
        console.log(error);

        showAlert({
          title: "Información",
          message: "Hubo un problema al guardar la venta, intente nuevamente!",
        });
      }
    } else {
      setIsLoading(false);
      showAlert({
        title: "Información",
        message:
          "Estimado usuario debe ingresar una cantidad mayor a 0 parea guardar la venta",
      });
    }
  };

  const callCLienteByPlaca = (cliente) => {
    const pagos = cliente.pagosanticipados
      ? typeof cliente.pagosanticipados === "string"
        ? JSON.parse(cliente.pagosanticipados)
        : cliente.pagosanticipados
      : [];

    setObjHeadBilling({
      ...objHeadBilling,
      cliente_id: cliente.id,
      nombreCliente: cliente.nombrecompleto,
      cliente_codigo: cliente.codigo,
      n_identificacion: cliente.numeroidentificacion,
      direccion: cliente.direccion ?? "",
      correo: cliente.correo ?? "",
      arrPagosanticipados: (cliente.pagoanticipado ?? false) ? pagos : [],
      pagoanticipado: cliente.pagoanticipado ?? false,
    });

    let arrAnticipos = [];
    if (cliente.pagoanticipado) {
      const objBoquilla = (selectedSurtidor?.boquillas ?? []).find(
        (x) => x.codigo_boquilla === valorDispensar.boquilla,
      );

      if (objBoquilla) {
        arrAnticipos = (pagos ?? []).filter(
          (x) => x.producto_id === objBoquilla.producto_id && x.total > 0,
        );

        setFacturasAnticipadas(arrAnticipos);
      }
    }

    setSearchListModal(false);
  };

  function findEstadoSurtidor(valor) {
    for (const [clave, valores] of Object.entries(estadosDispensador)) {
      for (const patron of valores) {
        if (patron === valor) {
          return clave; // Coincidencia exacta
        } else if (patron.endsWith("*") && valor.startsWith(patron[0])) {
          return clave; // Coincide con "X*" o "H*"
        } else if (patron.startsWith("*") && valor.endsWith(patron[1])) {
          return clave; // Coincide con "*e"
        }
      }
    }
    return "DESCONECTADO " + valor; // No se encontró en ninguna categoría
  }

  const findEstadoSelectedSurtidor = () => {
    if (!selectedSurtidor) return "Ninguno seleccionado";
    const info = arrDataTransactorSurtidores.find(
      (x) =>
        String(x.codigofila_transactor) ===
        String(selectedSurtidor.codigo_transactor),
    );
    return info ? findEstadoSurtidor(info.estado_transactor) : "Sin señal";
  };

  const renderDepositoModal = () => {
    return (
      <DepositoModalComponent
        establecimientoid={establecimientoid}
        periodofiscal_id={periodofiscal_id}
        cajaId={cajaId}
        usuario={usuario}
        turnoActivo={turnoActivo}
        menuId={menuId}
        token={token}
        setSearchDepositoModal={setSearchDepositoModal}
        actionButtons={{
          setIsLoading: setIsLoading,
          printerDeposito: printerDeposito,
        }}
      />
    );
  };

  const renderListPlacaModal = () => {
    return (
      <ListClientesByPlacaComponent
        periodofiscal_id={periodofiscal_id}
        objHeadBilling={objHeadBilling}
        setSearchListModal={setSearchListModal}
        setIsLoading={setIsLoading}
        actionClick={callCLienteByPlaca}
      />
    );
  };

  const renderHabilitarModal = () => {
    return (
      <HabilitarModalComponent
        closeModalHabilitarDispensador={closeModalHabilitarDispensador}
        selectedSurtidor={selectedSurtidor}
        setValorDispensar={setValorDispensar}
        valorDispensar={valorDispensar}
        changeValoresDespache={changeValoresDespache}
        actionHabilitarModal={actionHabilitarModal}
      />
    );
  };

  const renderPruebasModal = () => {
    return (
      <PruebasTecnicasModalComponent
        setIsOpenModalPruebasTecnicas={setIsOpenModalPruebasTecnicas}
        title={"Pruebas Tecnicas: " + (selectedSurtidor?.nombre ?? "")}
        selectedSurtidor={selectedSurtidor}
        setValorDispensar={setValorDispensar}
        valorDispensar={valorDispensar}
        changeValoresDespache={changeValoresDespache}
        actionPruebasTecnicas={actionPruebasTecnicas}
      />
    );
  };

  const renderModal = () => {
    return (
      <DispensarModalComponent
        changeValoresDespache={changeValoresDespache}
        valorDispensar={valorDispensar}
        setObjHeadBilling={setObjHeadBilling}
        tipoDocumento={tipoDocumento}
        searchPersonModal={searchPersonModal}
        closeModalClientes={closeModalClientes}
        callCliente={callCliente}
        isOpenModalHabilitarDispensador={isOpenModalHabilitarDispensador}
        renderHabilitarModal={renderHabilitarModal}
        selectedSurtidor={selectedSurtidor}
        setTipoDocumento={setTipoDocumento}
        error={error}
        handleOnSubmitEditing={handleOnSubmitEditing}
        objHeadBilling={objHeadBilling}
        createChangeHandler={createChangeHandler}
        openModalHabilitarDispensador={openModalHabilitarDispensador}
        setSearchPersonModal={setSearchPersonModal}
        selectBoquilla={selectBoquilla}
        createChangeHandlerPago={createChangeHandlerPago}
        objPago={objPago}
        tarjetas={tarjetas}
        valores={valores}
        searchPlaca={searchPlaca}
        tipoPago={tipoPago}
        selectedTarjeta={selectedTarjetaObj}
        selectedTipo={selectedTipoPagoObj}
        selectedBanco={selectedBancoObj}
        bancos={bancos}
        sendEgreso={sendEgreso}
        sendFacturacion={sendFacturacion}
        facturasAnticipadas={facturasAnticipadas}
        parametrizacion={parametrizacion}
        validatePlacaYEstablecimiento={validatePlacaYEstablecimiento}
        renderPruebasModal={renderPruebasModal}
        setIsOpenModalPruebasTecnicas={setIsOpenModalPruebasTecnicas}
        isOpenModalPruebasTecnicas={isOpenModalPruebasTecnicas}
        permisos={JSON.parse(usuario.permisos_especiales ?? "{}")}
        establecimientosContables={establecimientosContables}
        selectedEstablecimientoContable={selectedEstablecimientoContable}
        setSearchListModal={setSearchListModal}
        closeModal={closeModalDispensar}
        isloading={isloading}
        findEstadoSelectedSurtidor={findEstadoSelectedSurtidor}
        openPagarDeunaModal={openPagarDeunaModal}
        openPagarPinPadModal={openPagarPinPadModal}
      />
    );
  };

  const cierreTurnoModal = () => {
    return (
      <HabilitarTurno
        imprimir={printerCierreCaja}
        status={"C"}
        closeModal={() => {
          setIsOpenCierreTurno(false);
          setRefreshData((prev) => !prev);
        }}
      />
    );
  };

  const openTurnoModal = () => {
    return (
      <HabilitarTurno
        closeModal={() => {
          setIsOpenOpenTurno(false);
          setRefreshData((prev) => !prev);
        }}
      />
    );
  };

  const resumenModal = () => {
    return (
      <ResumenModalComponent
        printerDeposito={printerDeposito}
        printDocument={printDocument}
        dataResumen={dataResumen}
        closeModal={() => {
          setSearchResumenModal(false);
          setDataResumen([]);
        }}
      />
    );
  };

  const openAddCustomer = () => {
    return (
      <AddCustomerComponent
        config={config}
        setShowLoading={setIsLoading}
        periodofiscal_id={periodofiscal_id}
        closeModal={closeModalAddCustomer}
        parametrizacion={parametrizacion}
      />
    );
  };

  const renderModalAcciones = () => {
    return (
      <ActionSheetComponent
        setIsOpenModalAcciones={setIsOpenModalAcciones}
        buttons={[
          {
            iconName: "payments",
            onPress: () => setSearchDepositoModal(true),
            text: "Deposito",
            color: "green",
          },
          {
            iconName: "view-list",
            onPress: () => openModalResumenDespacho(),
            text: "Resumen Transacciones",
            color: "grey",
          },
          {
            iconName: "local-gas-station",
            onPress: () => openModalCierreTurno(),
            text: "Cerrar Turno",
            color: "red",
          },
        ]}
      />
    );
  };

  const renderModalPagarDeuna = () => {
    return (
      <PagoDeUnaComponent
        valoresTotalesFactura={{
          total: selectedSurtidor?.proforma
            ? parseFloat(valores.dolares)
            : parseFloat(valorDispensar.dolares),
          propina: 0,
        }}
        periodofiscal={periodofiscal_id}
        codigomovil={codigomovil}
        headComprobante={objHeadBilling}
        setFormHeadFields={setObjHeadBilling}
        informacion={{
          establecimientos: parametrizacion?.establecimientos,
          cajas: parametrizacion?.cajas,
        }}
        parametrizacionObj={parametrizacion}
        estado={estadodeuna}
        setEstado={setEstadodeuna}
        listSpendingPurchase={[]}
        actions={{
          confirmacionpago: confirmacionpagodeUna,
          closepago: closePagarDeunaModal,
        }}
        establecimientoId={establecimientoid}
        cajaId={cajaId}
        bodegaId={bodegaId}
        hiddenparcial={true}
        menu={menuId}
        config={config}
      />
    );
  };

  const renderModalPagarPinPad = () => {
    return (
      <PagoPinPadComponent
        valoresTotalesFactura={{
          total: selectedSurtidor?.proforma
            ? parseFloat(valores.dolares)
            : parseFloat(valorDispensar.dolares),
          propina: 0,
        }}
        headComprobante={objHeadBilling}
        setFormHeadFields={setObjHeadBilling}
        periodofiscal={periodofiscal_id}
        informacion={{
          establecimientos: parametrizacion?.establecimientos,
          cajas: parametrizacion?.cajas,
        }}
        parametrizacionObj={parametrizacion}
        estado={estadoPinPad}
        setEstado={setEstadoPinPad}
        listSpendingPurchase={[]}
        actions={{
          confirmacionpago: confirmacionpagoPinPad,
          closepago: closePagarPinPadModal,
        }}
        establecimientoId={establecimientoid}
        cajaId={cajaId}
        bodegaId={bodegaId}
        hiddenparcial={true}
        menu={menuId}
        config={config}
        establecimientoSRI={establecimientoSRI}
        puntoEmision={puntoEmision}
        vendedor_id={usuario.user_id}
      />
    );
  };

  return (
    <>
      <Loader loading={isloading} />
      <Modal
        animationType="fade"
        visible={modalVisible}
        onRequestClose={closeModalDispensar}
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
      >
        {renderModal()}
      </Modal>
      <Modal
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
        animationType="slide"
        visible={isOpenModalAddCustomer}
      >
        {openAddCustomer()}
      </Modal>
      <CustomModalContainer
        visible={isOpenModalHabilitarDispensador}
        title={"HABILITAR DISPENSADOR"}
        onClose={() => closeModalHabilitarDispensador()}
      >
        {renderHabilitarModal()}
      </CustomModalContainer>
      <Modal
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
        animationType="slide"
        visible={isOpenOpenTurno}
      >
        {openTurnoModal()}
      </Modal>
      <CustomModalContainer
        visible={searchDepositoModal}
        title={"Deposito"}
        onClose={() => setSearchDepositoModal(false)}
      >
        {renderDepositoModal()}
      </CustomModalContainer>

      <Modal
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
        animationType="slide"
        visible={searchListModal}
      >
        {renderListPlacaModal()}
      </Modal>
      <Modal
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
        animationType="slide"
        visible={isOpenCierreTurno}
      >
        {cierreTurnoModal()}
      </Modal>
      <Modal
        navigationBarTranslucent={true}
        statusBarTranslucent={true}
        animationType="slide"
        visible={searchResumenModal}
      >
        {resumenModal()}
      </Modal>

      <CustomModalContainer
        visible={isOpenModalAcciones}
        title={"Acciones"}
        onClose={() => setIsOpenModalAcciones(false)}
      >
        {renderModalAcciones()}
      </CustomModalContainer>

      <CustomModalContainer
        visible={isOpenModalPagarDeUna}
        title={"Pagar con DeUna"}
        onClose={closePagarDeunaModal}
      >
        {renderModalPagarDeuna()}
      </CustomModalContainer>
      <CustomModalContainer
        visible={isOpenModalPagarPinPad}
        title={"Pagar con PinPad"}
        onClose={closePagarPinPadModal}
      >
        {renderModalPagarPinPad()}
      </CustomModalContainer>
      <CustomAppBar
        center={true}
        bold={true}
        leftIcon="menu"
        onLeftPress={() => navigation.openDrawer()}
        title={turnoActivo ? turnoActivo.nombre : "No hay turno activo"}
      />
      {!turnoActivo ? (
        <View
          style={{
            alignItems: "center",
            marginTop: 20,
            backgroundColor: "white",
            padding: 20,
            marginHorizontal: 10,
            borderRadius: 12,
            paddingBottom: 30,
          }}
        >
          <View
            style={{
              padding: 20,
            }}
          >
            <Text
              style={{
                color: "black",
                fontWeight: "700",
                fontSize: 20,
                textAlign: "center",
              }}
            >
              No hay turnos activos. Consulte con el administrador.
            </Text>
          </View>
          <View
            style={{
              height: 300,
              width: "100%",
              alignSelf: "center",
              borderRadius: 12,
              overflow: "hidden",
              padding: 20,
            }}
          >
            <Image
              source={require("../../assets/images/alert.png")}
              style={{
                height: "100%",
                width: "100%",
              }}
              resizeMode="contain"
            />
          </View>
        </View>
      ) : turnoActivo.estado_turno === "I" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: insets.bottom },
          ]}
          refreshControl={
            <RefreshControl
              colors={[Colors.primary]}
              refreshing={isloading}
              onRefresh={() => {
                setRefreshData((prev) => !prev);
              }}
            />
          }
        >
          {isFocused && !isDrawerOpen && (
            <Portal>
              <CustomFAB
                icon={"duplicate"}
                onPress={() => {
                  setIsOpenModalAcciones(true);
                }}
              />

              <CustomFAB
                align="left"
                icon="print"
                onPress={() => {
                  openModalResumenDespacho();
                }}
              />
            </Portal>
          )}
          <View style={styles.container}>
            {surtidores.length > 0 &&
              surtidores.map((item, index) => {
                const itemsPerRow = orientation === "portrait" ? 2 : 3;
                if (index % itemsPerRow === 0) {
                  return (
                    <View key={index} style={styles.row}>
                      {surtidores
                        .slice(index, index + itemsPerRow)
                        .map((subItem, subIndex) => {
                          return (
                            <View key={subIndex} style={styles.surface}>
                              <Text
                                style={{ fontWeight: "bold", marginBottom: 5 }}
                              >
                                {subItem.estacion.toUpperCase()}
                              </Text>
                              {subItem.lados
                                .sort((a, b) =>
                                  a.posicion < b.posicion ? -1 : 1,
                                )
                                .map((dataLado, idx) => {
                                  const informationTransactor =
                                    arrDataTransactorSurtidores.find(
                                      (x) =>
                                        x.codigofila_transactor ===
                                        dataLado.codigo_transactor,
                                    );
                                  const objInfoSurtidor = arrsurtidores.find(
                                    (x) =>
                                      x.codigo_transactor ===
                                        (informationTransactor?.codigofila_transactor ??
                                          "") +
                                          "," +
                                          informationTransactor?.codigopistola_transactor ??
                                      "",
                                  );

                                  const arrFilaSurtidores =
                                    arrsurtidores.filter(
                                      (x) =>
                                        x.codigo_transactor.split(",")[0] ===
                                        (informationTransactor?.codigofila_transactor ??
                                          ""),
                                    );
                                  const surtidoresFila_ids = arrFilaSurtidores
                                    .map((obj) => obj.id)
                                    .join(",");

                                  let colorFondo = "#FFFFFF";
                                  let nombreGasolina = "";
                                  let surtidor = 0;
                                  let surtidor_id = 0;

                                  if (
                                    objInfoSurtidor &&
                                    !estadosTransactor.cobrando.includes(
                                      informationTransactor?.estado_transactor ??
                                        "",
                                    )
                                  ) {
                                    colorFondo =
                                      objInfoSurtidor.tipo_combustible.valor;
                                    nombreGasolina =
                                      objInfoSurtidor.tipo_combustible
                                        .descripcion;
                                  } else if (
                                    objInfoSurtidor &&
                                    estadosTransactor.cobrando.includes(
                                      informationTransactor?.estado_transactor ??
                                        "",
                                    )
                                  ) {
                                    colorFondo = "#BFB9B9";
                                  }

                                  if (!objInfoSurtidor) {
                                    const findFirstBoquilla =
                                      arrsurtidores.find(
                                        (x) =>
                                          x.codigo_transactor.split(",")[0] ===
                                          (informationTransactor?.codigofila_transactor ??
                                            ""),
                                      );
                                    surtidor_id = findFirstBoquilla?.id ?? 0;
                                    surtidor = findFirstBoquilla ?? 0;
                                  } else {
                                    surtidor_id = objInfoSurtidor?.id ?? 0;
                                    surtidor = objInfoSurtidor ?? 0;
                                  }

                                  const mostrarBotonBloqueo =
                                    !dataLado.proforma &&
                                    informationTransactor?.estado_transactor ===
                                      "Ci" &&
                                    parametrizacion.activarBotonDesbloquearSurtidor;

                                  return (
                                    <View
                                      key={idx}
                                      style={{
                                        flexDirection: "row",
                                        marginBottom: 10,
                                      }}
                                    >
                                      <Pressable
                                        style={({ pressed }) => [
                                          {
                                            borderRadius: 8,
                                            flexDirection: "row",
                                          },
                                          pressed && sharedStyles.pressed,
                                        ]}
                                        onPress={() => {
                                          selectSurtidor({
                                            ...dataLado,
                                            surtidor: surtidor,
                                            surtidoresFila_ids:
                                              surtidoresFila_ids &&
                                              surtidoresFila_ids !== ""
                                                ? surtidoresFila_ids
                                                : surtidor_id,
                                            surtidor_id: surtidor_id,
                                            codigo_transactor:
                                              dataLado?.codigo_transactor ?? "",
                                            nombre: `${subItem.estacion.toUpperCase()}-${
                                              dataLado.posicion === "L"
                                                ? "LADO B"
                                                : "LADO A"
                                            }`,
                                            transaccion_transactor:
                                              informationTransactor?.transaccion_transactor ??
                                              0,
                                          });
                                        }}
                                      >
                                        <View
                                          style={{
                                            backgroundColor: colorFondo,
                                            padding: 10,
                                            borderRadius: 12,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              textAlign: "center",
                                              fontSize: 10,
                                              fontWeight: "bold",
                                            }}
                                          >
                                            {dataLado.posicion === "L"
                                              ? "LADO B"
                                              : "LADO A"}
                                          </Text>
                                          {estadosTransactor.cobrando.includes(
                                            informationTransactor?.estado_transactor ??
                                              "",
                                          ) ? (
                                            <PagandoSVG
                                              height={80}
                                              width={80}
                                            />
                                          ) : estadosTransactor.dispensando.includes(
                                              informationTransactor?.estado_transactor ??
                                                "",
                                            ) ? (
                                            <DispensandoSVG
                                              height={80}
                                              width={80}
                                            />
                                          ) : (
                                            <DispensadorSVG
                                              height={80}
                                              width={80}
                                            />
                                          )}
                                          <Text
                                            style={{
                                              textAlign: "center",
                                              fontWeight: "500",
                                              fontSize: 10,
                                            }}
                                          >
                                            {nombreGasolina}
                                          </Text>
                                        </View>
                                        <View
                                          style={{
                                            marginLeft: 5,
                                            alignContent: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <Text
                                            style={{
                                              fontWeight: "bold",
                                              fontSize: 12,
                                            }}
                                          >
                                            Galones:
                                          </Text>
                                          <Text>
                                            {informationTransactor?.galones ??
                                              "0.0000"}
                                          </Text>
                                          <Text
                                            style={{
                                              fontWeight: "bold",
                                              fontSize: 12,
                                            }}
                                          >
                                            Dolares:
                                          </Text>
                                          <Text>
                                            $
                                            {informationTransactor?.dolares ??
                                              "0.0000"}{" "}
                                          </Text>
                                          {dataLado.proforma && (
                                            <>
                                              <Text
                                                style={{
                                                  color: "#000000",
                                                  fontWeight: "bold",
                                                  fontSize: 12,
                                                }}
                                              >
                                                DOC #
                                              </Text>
                                              <Text>
                                                {dataLado.proforma.id}
                                              </Text>
                                            </>
                                          )}
                                        </View>
                                      </Pressable>
                                      {mostrarBotonBloqueo && (
                                        <Pressable
                                          onPress={() => {
                                            desbloquearSurtidorActivo({
                                              ...dataLado,
                                              surtidor: surtidor,
                                              surtidoresFila_ids:
                                                surtidoresFila_ids &&
                                                surtidoresFila_ids !== ""
                                                  ? surtidoresFila_ids
                                                  : surtidor_id,
                                              surtidor_id: surtidor_id,
                                              codigo_transactor:
                                                dataLado?.codigo_transactor ??
                                                "",
                                              nombre: `${subItem.estacion.toUpperCase()}-${
                                                dataLado.posicion === "L"
                                                  ? "LADO B"
                                                  : "LADO A"
                                              }`,
                                              transaccion_transactor:
                                                informationTransactor?.transaccion_transactor ??
                                                0,
                                            });
                                          }}
                                          style={({ pressed }) => [
                                            styles.botonBloqueado,
                                            pressed && sharedStyles.pressed,
                                          ]}
                                        >
                                          <Ionicons
                                            name="lock-closed"
                                            size={20}
                                            color="#fff"
                                          />
                                        </Pressable>
                                      )}
                                    </View>
                                  );
                                })}
                            </View>
                          );
                        })}
                    </View>
                  );
                }
              })}
          </View>
        </ScrollView>
      ) : (
        <>
          {turnoActivo.estado_turno === "P" ? (
            <View
              style={{
                alignItems: "center",
                marginTop: 20,
                backgroundColor: "white",
                padding: 20,
                marginHorizontal: 10,
                borderRadius: 12,
                paddingBottom: 30,
              }}
            >
              <View
                style={{
                  padding: 20,
                }}
              >
                <Text
                  style={{ color: "black", fontWeight: "700", fontSize: 20 }}
                >
                  El turno no está habilitado.
                </Text>
              </View>
              <View
                style={{
                  height: 300,
                  width: "100%",
                  alignSelf: "center",
                  borderRadius: 12,
                  overflow: "hidden",
                  padding: 20,
                }}
              >
                <Image
                  source={require("../../assets/images/habilitar_turno.png")}
                  style={{
                    height: "100%",
                    width: "100%",
                  }}
                  resizeMode="contain"
                />
              </View>
              <Button mode="contained" onPress={() => setIsOpenOpenTurno(true)}>
                Habilitar Turno
              </Button>
            </View>
          ) : (
            <View
              style={{
                alignItems: "center",
                marginTop: 20,
                backgroundColor: "white",
                padding: 20,
                marginHorizontal: 10,
                borderRadius: 12,
                paddingBottom: 30,
              }}
            >
              <View
                style={{
                  padding: 20,
                }}
              >
                <Text
                  style={{ color: "black", fontWeight: "700", fontSize: 20 }}
                >
                  El turno ya está cerrado.
                </Text>
              </View>
              <View
                style={{
                  height: 300,
                  width: "100%",
                  alignSelf: "center",
                  borderRadius: 12,
                  overflow: "hidden",
                  padding: 20,
                }}
              >
                <Image
                  source={require("../../assets/images/close.png")}
                  style={{
                    height: "100%",
                    width: "100%",
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    fontSize: 18,
  },
  container: {
    flex: 1,
    padding: 5,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  surface: {
    flex: 1,
    margin: 5,
    marginBottom: 0,
    padding: 10,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
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
