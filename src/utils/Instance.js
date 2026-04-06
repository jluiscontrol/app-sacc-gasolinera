import axios, { AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const instance = axios.create({
  headers: {
    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
  },
  withCredentials: true,
});

instance.interceptors.request.use(
  async (config) => {
    const configuration = await AsyncStorage.getItem("configuration");
    const storage = JSON.parse(configuration);

    config.baseURL = storage.licensed.route;
    if (storage.encodetoken) {
      config.headers["Authorization"] = `Bearer ${storage.encodetoken}`;
    }
    return config;
  },
  (error) => {
    const {
      config,
      response: { status },
    } = error;
    const originalRequest = config;
    if (status === 401) {
    }
    return Promise.reject(error);
  },
);

export default instance;
