import AsyncStorage from "@react-native-async-storage/async-storage";
import Base64 from "Base64";

export const apiPrinter = "http://192.168.100.194:3001";

const storeToken = async (authData, nameIdentity) => {
  try {
    await AsyncStorage.setItem(nameIdentity, JSON.stringify(authData));
  } catch (error) {}
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const getToken = async (authIdentity) => {
  try {
    const userData = await AsyncStorage.getItem(authIdentity);
    return JSON.parse(userData);
  } catch (error) {
    return {};
  }
};

function validateFormatPlaca(input) {
  const patterns = {
    AAA0000: /^[A-Z]{3}\d{4}$/,
    AA000A: /^[A-Z]{2}\d{3}[A-Z]$/,
    CC0000: /^CC\d{4}$/,
    CD0000: /^CD\d{4}$/,
    OI0000: /^OI\d{4}$/,
    AT0000: /^AT\d{4}$/,
    IT0000: /^IT\d{4}$/,
  };
  for (let key in patterns) {
    if (patterns[key].test(input)) {
      return true;
    }
  }
  return false;
}

const mergeStorage = async (data, nameIdentity) => {
  try {
    await AsyncStorage.mergeItem(nameIdentity, JSON.stringify(data));
  } catch (error) {
    console.error("Error merging data into AsyncStorage:", error);
  }
};

const removeStoragePropFromObject = async (nameObject, propertie) => {
  try {
    const obj = await getToken(nameObject);
    delete obj[propertie];
    await storeToken(obj, nameObject);
  } catch (error) {}
};

const currentDate = () => {
  const today = new Date();
  let date = today.getDate();
  let month = today.getMonth() + 1;
  const year = today.getFullYear();
  if (date < 10) {
    date = "0" + date;
  }
  if (month < 10) {
    month = "0" + month;
  }
  return year + "-" + month + "-" + date;
};

const decodeJWT = (chainToken) => {
  const base64Url = chainToken.split(".")[1];
  if (!base64Url) {
    return "";
  }
  const decodedValue = JSON.parse(Base64.atob(base64Url));
  return decodedValue.data;
};

const decodeJWTFechaexp = (chainToken) => {
  const base64Url = chainToken.split(".")[1];
  if (!base64Url) {
    return "";
  }
  return JSON.parse(Base64.atob(base64Url));
};

const isNumeric = (num) => {
  return !isNaN(num);
};

const validateCedula = (cedula) => {
  // Verificar que tenga 10 dígitos numéricos
  if (!/^(0[1-9]|1[0-9]|2[0-4]|30)\d{8}$/.test(cedula)) {
    return false;
  }

  // Extraer los primeros 9 dígitos y el dígito verificador
  let digitos = cedula.split("").map(Number);
  let digitoVerificador = digitos.pop();

  // Validar tercer dígito (0-6)
  if (digitos[2] < 0 || digitos[2] > 6) {
    return false;
  }

  // Aplicar algoritmo módulo 10
  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let num = digitos[i];
    if (i % 2 === 0) {
      // Posición impar (pares en índice 0-based)
      num *= 2;
      if (num > 9) num -= 9;
    }
    suma += num;
  }

  let residuo = suma % 10;
  let digitoCalculado = residuo === 0 ? 0 : 10 - residuo;

  return digitoCalculado === digitoVerificador;
};

const validateRUC = (ruc) => {
  if (!/^\d{13}$/.test(ruc)) return false;

  const tipo = parseInt(ruc[2]);
  const establecimiento = ruc.slice(10, 13);

  if (establecimiento !== "001") return false;

  const cedula = ruc.slice(0, 10);

  if (tipo >= 0 && tipo <= 5) {
    // Persona natural
    return validateCedula(cedula);
  } else if (tipo === 6) {
    return validarSociedadPublica(ruc);
  } else if (tipo === 9) {
    return validarSociedadPrivada(ruc);
  }

  return false;
};

const validarSociedadPublica = (ruc) => {
  const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
  let digitos = ruc.slice(0, 8).split("").map(Number);
  let suma = digitos.reduce((acc, d, i) => acc + d * coeficientes[i], 0);
  let residuo = suma % 11;
  let digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
  return parseInt(ruc[8]) === digitoVerificador;
};

const validarSociedadPrivada = (ruc) => {
  const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  let digitos = ruc.slice(0, 9).split("").map(Number);
  let suma = digitos.reduce((acc, d, i) => acc + d * coeficientes[i], 0);
  let residuo = suma % 11;
  let digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
  return parseInt(ruc[9]) === digitoVerificador;
};

const validateIdentificacion = (input) => {
  if (!/^\d+$/.test(input)) return false;

  if (input.length === 10) {
    return validateCedula(input);
  }

  if (input.length === 13) {
    return validateRUC(input);
  }

  return false;
};

function formatSecuencia(number, width) {
  if (number === null) return "";
  var numberOutput = Math.abs(number);
  var length = numberOutput.toString().length;
  var zero = "0";

  if (width <= length) {
    if (number < 0) {
      return "-" + numberOutput.toString();
    } else {
      return numberOutput.toString();
    }
  } else {
    if (number < 0) {
      return "-" + zero.repeat(width - length) + numberOutput.toString();
    } else {
      return zero.repeat(width - length) + numberOutput.toString();
    }
  }
}

export {
  getToken,
  mergeStorage,
  currentDate,
  storeToken,
  sleep,
  removeStoragePropFromObject,
  validateFormatPlaca,
  decodeJWT,
  decodeJWTFechaexp,
  isNumeric,
  validateIdentificacion,
  formatSecuencia,
};
