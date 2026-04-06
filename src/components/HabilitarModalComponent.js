import { View, Text, StyleSheet, Pressable } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { sharedStyles } from "../styles/SharedStyles";

export default function HabilitarModalComponent(props) {
  const {
    closeModalHabilitarDispensador,
    selectedSurtidor,
    setValorDispensar,
    valorDispensar,
    changeValoresDespache,
    actionHabilitarModal,
  } = props;

  return (
    <View>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-around",
            }}
          >
            {(selectedSurtidor?.boquillas ?? []).map((x, index) => {
              return (
                <View key={index} style={{ marginBottom: 5 }}>
                  <Pressable
                    onPress={() =>
                      setValorDispensar((e) => ({
                        ...e,
                        boquilla: x.codigo_boquilla,
                      }))
                    }
                    style={({ pressed }) => [
                      sharedStyles.boquillasStyle,
                      {
                        backgroundColor: x.color,
                        borderWidth:
                          valorDispensar.boquilla === x.codigo_boquilla ? 3 : 0,
                        borderColor:
                          valorDispensar.boquilla === x.codigo_boquilla
                            ? "#000000"
                            : "transparent",
                      },
                      pressed && sharedStyles.pressed,
                    ]}
                  >
                    <Text style={sharedStyles.textBoquilla}>{x.tipo}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>Valor en Dolares:</Text>
              <View
                style={{
                  width: 160,
                  height: 70,
                  backgroundColor: "#95f995",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 10,
                }}
              >
                <TextInput
                  keyboardType={"numeric"}
                  style={styles.input}
                  underlineColor={"transparent"}
                  onChangeText={(value) =>
                    changeValoresDespache("dolares", value, "galones")
                  }
                  placeholder={"0"}
                  value={valorDispensar.dolares.toString()}
                  selectTextOnFocus={true}
                />
              </View>
            </View>
            <View style={{ width: 10 }} />
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>Valor en Galones:</Text>
              <View
                style={{
                  width: 160,
                  height: 70,
                  backgroundColor: "#ffb400",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 10,
                }}
              >
                <TextInput
                  keyboardType={"numeric"}
                  style={styles.input}
                  underlineColor={"transparent"}
                  onChangeText={(value) =>
                    changeValoresDespache("galones", value, "dolares")
                  }
                  value={valorDispensar.galones.toString()}
                  selectTextOnFocus={true}
                />
              </View>
            </View>
          </View>
        </View>
        <View
          style={{
            marginTop: 30,
            alignItems: "center",
            alignContent: "center",
            justifyContent: "center",
          }}
        >
          <Button mode="contained" onPress={() => actionHabilitarModal()}>
            Habilitar Dispensador
          </Button>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  input: {
    width: "100%",
    alignItems: "center",
    fontSize: 30,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    margin: 0,
    color: "#000",
  },
});
