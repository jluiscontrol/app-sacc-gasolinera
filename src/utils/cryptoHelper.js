import CryptoJS from "react-native-crypto-js";

const PASSWORD_CRYPTOJSAES = "Kz@@OfRx^WDV$Nw37Z8N%nAVIAQEW4U";

const CryptoJSAesJson = {
  stringify: function (cipherParams) {
    var j = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64),
    };

    if (cipherParams.iv) {
      j.iv = cipherParams.iv.toString();
    }

    if (cipherParams.salt) {
      j.s = cipherParams.salt.toString();
    }

    return JSON.stringify(j).replace(/\s/g, "");
  },
};

export const encryptData = (value) => {
  try {
    if (!value) return null;

    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      PASSWORD_CRYPTOJSAES,
      {
        format: CryptoJSAesJson,
      },
    );

    return encrypted.toString();
  } catch (error) {
    console.error("Error cifrando para DeUna:", error);
    return null;
  }
};
