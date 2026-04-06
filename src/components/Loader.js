import { StyleSheet, View, Modal } from "react-native";
import { SkypeIndicator } from "react-native-indicators";
import { Colors } from "../utils/Colors";

const Loader = (props) => {
  const { loading, modalStyle, indicatorStyle } = props;
  return (
    <Modal
      navigationBarTranslucent={true}
      statusBarTranslucent={true}
      transparent={true}
      animationType={"fade"}
      visible={loading}
      onRequestClose={() => {}}
    >
      <View style={[styles.modalBackground, modalStyle]}>
        <View style={[styles.activityIndicatorWrapper, indicatorStyle]}>
          <SkypeIndicator color={Colors.primary} size={60} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: "#00000080",
    zIndex: 1000,
  },
  activityIndicatorWrapper: {
    height: 100,
    width: 100,
    borderRadius: 10,
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Loader;
