import React, { useState } from "react";
import { Modal } from "react-native";
import { Dialog, Button, Text, useTheme } from "react-native-paper";

let showAlertFn;

export const showAlert = (options) => {
  if (showAlertFn) showAlertFn(options);
};

export default function CustomAlert() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState({
    title: "",
    message: "",
    actions: [{ label: "OK", onPress: () => {} }],
  });

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

  const hide = () => setVisible(false);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Dialog
        style={{ backgroundColor: theme.colors.background }}
        visible={visible}
      >
        {options.title ? <Dialog.Title>{options.title}</Dialog.Title> : null}
        <Dialog.Content>
          <Text variant="bodyMedium">{options.message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          {options.actions.map((action, i) => (
            <Button
              key={i}
              onPress={() => {
                action.onPress?.();
                hide();
              }}
            >
              {action.label}
            </Button>
          ))}
        </Dialog.Actions>
      </Dialog>
    </Modal>
  );
}
