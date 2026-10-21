import Ionicons from "@react-native-vector-icons/ionicons";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import FontAwesome5 from "@react-native-vector-icons/fontawesome5";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

const iconFamilies = {
  ion: Ionicons,
  material: MaterialIcons,
  fa5: FontAwesome5,
  materialC: MaterialCommunityIcons,
};

export default function GlobalIcon({
  family = "ion",
  name,
  size = 24,
  color = "black",
  solid,
  iconStyle,
  ...props
}) {
  const IconComponent = iconFamilies[family];
  if (!IconComponent) {
    console.warn(`Icon family "${family}" not found`);
    return null;
  }

  const resolvedIconStyle =
    family === "fa5" ? (iconStyle ?? (solid ? "solid" : undefined)) : iconStyle;

  return (
    <IconComponent
      name={name}
      size={size}
      color={color}
      {...(resolvedIconStyle ? { iconStyle: resolvedIconStyle } : {})}
      {...props}
    />
  );
}
