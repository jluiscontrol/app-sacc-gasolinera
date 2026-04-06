import {
  View,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  ToastAndroid,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import Loader from "./Loader";
import CustomAppBar from "./CustomAppBar";
import { TextInput } from "react-native-paper";
import CustomPicker from "./CustomPicker";
import CustomFAB from "./CustomFAB";
import CustomCheckBox from "./CustomCheckBox";
import { getToken, validateIdentificacion } from "../utils/Utils";
import instance from "../utils/Instance";

export default function AddCustomerComponent({
  closeModal,
  periodofiscal_id,
  parametrizacion,
  config,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [listTipoIdentificacion, setListTipoIdentificacion] = useState([]);
  const [listEstadoCivil, setListEstadoCivil] = useState([]);
  const [listSexo, setListSexo] = useState([]);
  const [formFields, setFormFields] = useState({
    ct_tipoidentificacion_id: 0,
    numeroidentificacion: "",
    nombrecompleto: "",
    nombres: "",
    apellidos: "",
    direccion: "",
    telefono: "",
    telefonocelular: "",
    ct_estadocivil: 0,
    ciudad: "",
    fechanacimiento: "",
    ct_sexo: 0,
    correopersonal: "",
    correoinstitucional: "",
    discapacidad: false,
    extranjero: false,
    profesional: false,
    nombrecomercial: "",
    listaprecio_identificador: "PVP1",
    observacion: "",
    pais_id: parametrizacion.defaultPais,
    estado_id: parametrizacion.defaultEstado,
    ciudad_id: parametrizacion.defaultCiudad,
    periodofiscal_id: periodofiscal_id,
    cupocredito: 0,
    diascreditoplazo: 0,
    porcentaje_descuento: 0,
  });

  useEffect(() => {
    async function getInformation() {
      const localstorage = await getToken("configuration");
      setListSexo(localstorage?.sexos);
      setListEstadoCivil(localstorage?.estados_civil);
      setListTipoIdentificacion(localstorage?.tipo_identificacion);
    }

    getInformation();
  }, []);

  const handleChange = (name, value) => {
    if (name === "fechanacimiento") {
      const cleaned = value.replace(/\D/g, "");

      let formatted = cleaned;

      if (cleaned.length >= 3 && cleaned.length <= 4) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
      } else if (cleaned.length > 4) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
      }
      setFormFields((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormFields((prev) => ({ ...prev, [name]: value }));
    }
  };

  const saveCustomer = () => {
    const {
      ct_tipoidentificacion_id,
      numeroidentificacion,
      nombrecompleto,
      nombres,
      apellidos,
      direccion,
      telefono,
      telefonocelular,
      ct_estadocivil,
      ciudad_id,
      fechanacimiento,
      ct_sexo,
      correopersonal,
      correoinstitucional,
      discapacidad,
      extranjero,
      nombrecomercial,
      listaprecio_identificador,
      observacion,
      periodofiscal_id,
      profesional,
      cupocredito,
      diascreditoplazo,
      porcentaje_descuento,
    } = formFields;

    if (
      ct_tipoidentificacion_id &&
      numeroidentificacion &&
      nombrecompleto.trim() !== "" &&
      ciudad_id &&
      ct_estadocivil &&
      ct_sexo &&
      direccion.length > 0
    ) {
      const identificacion = numeroidentificacion.trim();
      let validIdentificacion;
      let tipoIdentificacion = listTipoIdentificacion.find(
        (x) => x.id === parseInt(ct_tipoidentificacion_id),
      );
      if (tipoIdentificacion.name == "CEDULA") {
        validIdentificacion = validateIdentificacion(identificacion);
      } else if (tipoIdentificacion.name == "RUC") {
        validIdentificacion = validateIdentificacion(identificacion);
      } else {
        validIdentificacion = true;
      }
      if (validIdentificacion) {
        setIsLoading(true);
        const fechaFormateada = fechanacimiento.replace(/\//g, "-");
        instance
          .post(
            `api/v1/cartera/cliente`,
            {
              ct_tipoidentificacion_id,
              numeroidentificacion: identificacion,
              nombrecompleto,
              nombres,
              apellidos,
              direccion,
              telefono,
              telefonocelular,
              ct_estadocivil,
              ciudad_id,
              fechanacimiento: fechaFormateada,
              ct_sexo,
              correopersonal,
              correoinstitucional,
              discapacidad,
              extranjero,
              nombrecomercial,
              listaprecio_identificador,
              observacion,
              periodofiscal_id,
              profesional,
              cupocredito,
              diascreditoplazo,
              porcentaje_descuento,
            },
            config,
          )
          .then((resp) => {
            if (resp.data.message === "Created") {
              setIsLoading(false);
              ToastAndroid.show(
                "El cliente se ha registrado correctamente!",
                ToastAndroid.SHORT,
              );
              closeModal(true);
              //actionRefresh(!statusRefresh);
            }
          })
          .catch((err) => {
            if (err.response.data.error) {
              const errorHandle = err.response.data.error;
              Alert.alert(
                "Error al registrar el Cliente!",
                `${errorHandle.message}`,
              );
            }
            setIsLoading(false);
          });
      } else {
        Alert.alert(
          "Informacion",
          "Numero de identificacion invalido, formato invalido, verifique!",
        );
      }
    } else {
      if (!ct_tipoidentificacion_id) {
        Alert.alert(
          "Información",
          "Falta el tipo de identificación, por favor verifique.",
        );
      } else if (!numeroidentificacion) {
        Alert.alert(
          "Información",
          "Falta el número de identificación, por favor verifique.",
        );
      } else if (nombrecompleto.trim() === "") {
        Alert.alert(
          "Información",
          "Falta el nombre completo, por favor verifique.",
        );
      } else if (!ciudad_id) {
        Alert.alert("Información", "Falta la ciudad, por favor verifique.");
      } else if (!ct_estadocivil) {
        Alert.alert(
          "Información",
          "Falta el estado civil, por favor verifique.",
        );
      } else if (!ct_sexo) {
        Alert.alert("Información", "Falta el sexo, por favor verifique.");
      } else if (direccion.length === 0) {
        Alert.alert("Información", "Falta la dirección, por favor verifique.");
      } else {
        Alert.alert("Información", "Datos vacíos, por favor verifique.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <CustomFAB
        color={"#d5a203"}
        text={"Guardar"}
        icon={"save"}
        onPress={saveCustomer}
      />
      <Loader loading={isLoading} />
      <CustomAppBar
        center={true}
        titleColor={"#d5a203"}
        rightIcon="close"
        onRightPress={closeModal}
        title={"Registrar CLiente"}
        bold={true}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 5 }}>
            <CustomPicker
              text={
                !formFields.ct_tipoidentificacion_id ||
                formFields.ct_tipoidentificacion_id === 0
                  ? "SELECCIONE UN TIPO IDENTIFICACION"
                  : listTipoIdentificacion.find(
                      (item) => item.id === formFields.ct_tipoidentificacion_id,
                    )?.name || "SELECCIONE UN TIPO IDENTIFICACION"
              }
              items={listTipoIdentificacion.map((campo) => ({
                label: campo.name,
                value: campo.id,
              }))}
              selectedValue={formFields.ct_tipoidentificacion_id}
              onValueChange={(value) =>
                handleChange("ct_tipoidentificacion_id", value)
              }
            />
            <TextInput
              mode={"outlined"}
              value={formFields.numeroidentificacion}
              onChangeText={(value) =>
                handleChange("numeroidentificacion", value)
              }
              label="Número de Identificación"
            />
            <TextInput
              mode={"outlined"}
              value={formFields.nombrecompleto}
              onChangeText={(value) => handleChange("nombrecompleto", value)}
              label="Nombres Completos"
            />

            <View style={styles.container}>
              <TextInput
                style={{ flex: 1 }}
                mode={"outlined"}
                value={formFields.nombres}
                onChangeText={(value) => handleChange("nombres", value)}
                label="Nombres"
              />
              <View style={{ width: 5 }} />
              <TextInput
                style={{ flex: 1 }}
                mode={"outlined"}
                value={formFields.apellidos}
                onChangeText={(value) => handleChange("apellidos", value)}
                label="Apellidos"
              />
            </View>

            <TextInput
              style={{ flex: 1, paddingVertical: 10 }}
              mode={"outlined"}
              value={formFields.direccion}
              onChangeText={(value) => handleChange("direccion", value)}
              multiline={true}
              label="Direccion"
            />
            <View style={styles.container}>
              <TextInput
                style={{ flex: 1 }}
                mode={"outlined"}
                keyboardType={"numeric"}
                value={formFields.telefono}
                onChangeText={(value) => handleChange("telefono", value)}
                label="Telefono Convencional"
              />
              <View style={{ width: 5 }} />
              <TextInput
                style={{ flex: 1 }}
                mode={"outlined"}
                value={formFields.telefonocelular}
                onChangeText={(value) => handleChange("telefonocelular", value)}
                keyboardType={"numeric"}
                label="Telefono Celular"
              />
            </View>
            <View style={styles.container}>
              <TextInput
                style={{ flex: 1 }}
                mode={"outlined"}
                keyboardType={"numeric"}
                value={formFields.fechanacimiento}
                onChangeText={(value) => handleChange("fechanacimiento", value)}
                placeholder={"DD/MM/YYYY"}
                label="Fecha de Nacimiento"
              />
              <View style={{ width: 5 }} />
              <TextInput
                style={{ flex: 1 }}
                mode={"outlined"}
                value={formFields.nombrecomercial}
                onChangeText={(value) => handleChange("nombrecomercial", value)}
                label="Nombre Comercial"
              />
            </View>
            <CustomPicker
              text={
                !formFields.ct_estadocivil || formFields.ct_estadocivil === 0
                  ? "SELECCIONE UN ESTADO CIVIL"
                  : listEstadoCivil.find(
                      (item) => item.id === formFields.ct_estadocivil,
                    )?.name || "SELECCIONE UN ESTADO CIVIL"
              }
              items={listEstadoCivil.map((campo) => ({
                label: campo.name,
                value: campo.id,
              }))}
              selectedValue={formFields.ct_estadocivil}
              onValueChange={(value) => handleChange("ct_estadocivil", value)}
            />
            <CustomPicker
              text={
                !formFields.ct_sexo || formFields.ct_sexo === 0
                  ? "SELECCIONE UN SEXO"
                  : listSexo.find((item) => item.id === formFields.ct_sexo)
                      ?.name || "SELECCIONE UN SEXO"
              }
              items={listSexo.map((campo) => ({
                label: campo.name,
                value: campo.id,
              }))}
              selectedValue={formFields.ct_sexo}
              onValueChange={(value) => handleChange("ct_sexo", value)}
            />

            <TextInput
              style={{ flex: 1 }}
              mode={"outlined"}
              keyboardType={"email-address"}
              value={formFields.correopersonal}
              onChangeText={(value) => handleChange("correopersonal", value)}
              label="Correo Personal"
            />
            <TextInput
              style={{ flex: 1 }}
              mode={"outlined"}
              value={formFields.correoinstitucional}
              onChangeText={(value) =>
                handleChange("correoinstitucional", value)
              }
              keyboardType={"email-address"}
              label="Correo Institucional"
            />

            <CustomCheckBox
              title={"Discapacitado"}
              checked={formFields.discapacidad}
              onPress={() =>
                setFormFields((prev) => ({
                  ...prev,
                  discapacidad: !prev.discapacidad,
                }))
              }
            />
            <CustomCheckBox
              title={"Extranjero"}
              checked={formFields.extranjero}
              onPress={() =>
                setFormFields((prev) => ({
                  ...prev,
                  extranjero: !prev.extranjero,
                }))
              }
            />
            <CustomCheckBox
              title={"Profesional"}
              checked={formFields.profesional}
              onPress={() =>
                setFormFields((prev) => ({
                  ...prev,
                  profesional: !prev.profesional,
                }))
              }
            />
            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
