import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  Alert,
  Text,
} from "react-native";
import { Colors } from "../utils/Colors";

let showAlertFn;

const presentIosAlert = (opts) => {
  const actions =
    opts.actions && opts.actions.length > 0
      ? opts.actions
      : [{ label: "OK", onPress: () => {} }];

  const buttons = actions.map((action) => {
    const label = action.label ?? "OK";
    const isCancel =
      action.style === "cancel" ||
      String(label).toUpperCase() === "CANCELAR" ||
      String(label).toUpperCase() === "NO CARGARLO";

    return {
      text: label,
      style: isCancel ? "cancel" : "default",
      onPress: action.onPress,
    };
  });

  Alert.alert(
    opts.title?.trim() ? opts.title : "Información",
    opts.message ?? "",
    buttons,
    { cancelable: true },
  );
};

export const showAlert = (options) => {
  if (Platform.OS === "ios") {
    presentIosAlert(options);
    return;
  }
  showAlertFn?.(options);
};

export default function CustomAlert() {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState({
    title: "",
    message: "",
    actions: [{ label: "OK", onPress: () => {} }],
  });

  useEffect(() => {
    if (Platform.OS === "ios") {
      return undefined;
    }

    showAlertFn = (opts) => {
      const actions =
        opts.actions && opts.actions.length > 0
          ? opts.actions
          : [{ label: "OK", onPress: () => {} }];

      setOptions({
        title: opts.title ?? "",
        message: opts.message ?? "",
        actions,
      });
      setVisible(true);
    };

    return () => {
      showAlertFn = undefined;
    };
  }, []);

  if (Platform.OS === "ios") {
    return null;
  }

  const hide = () => setVisible(false);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={hide}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={hide} />
        <View style={styles.dialog} pointerEvents="box-none">
          {options.title ? (
            <Text style={styles.title}>{options.title}</Text>
          ) : null}
          <Text style={styles.message}>{options.message}</Text>
          <View style={styles.actions}>
            {options.actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  action.onPress?.();
                  hide();
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 8,
    elevation: 24,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2933",
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 4,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
});
