import {
  View,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import CustomModalAppBar from "./CustomModalAppBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CustomModalContainer({
  visible,
  title,
  onClose,
  children,
  scroll = true,
  maxHeightPercent = 0.8,
}) {
  const screenHeight = Dimensions.get("window").height;
  const maxHeight = screenHeight * maxHeightPercent;
  const insets = useSafeAreaInsets();

  const [internalVisible, setInternalVisible] = useState(false);
  const translateY = useSharedValue(screenHeight);
  const keyboardOffset = useSharedValue(0);

  const onKeyboardShow = (height) => {
    keyboardOffset.value = withTiming(height, { duration: 250 });
  };

  const onKeyboardHide = () => {
    keyboardOffset.value = withTiming(0, { duration: 250 });
  };

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      runOnJS(onKeyboardShow)(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      runOnJS(onKeyboardHide)();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else if (internalVisible) {
      translateY.value = withTiming(
        screenHeight,
        {
          duration: 300,
          easing: Easing.in(Easing.ease),
        },
        (finished) => {
          if (finished) {
            runOnJS(setInternalVisible)(false);
          }
        },
      );
    }
  }, [visible, screenHeight]);

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value - keyboardOffset.value }],
  }));

  if (!internalVisible && !visible) return null;

  return (
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      visible={internalVisible}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheetContainer, animatedSheetStyle]}>
        <View
          style={[styles.sheet, { maxHeight, paddingBottom: insets.bottom }]}
        >
          <CustomModalAppBar title={title} closeModal={handleClose} />

          {scroll ? (
            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ padding: 20 }}>{children}</View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  sheet: {
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
});
