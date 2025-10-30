import { View, Text, StyleSheet } from "react-native"
import { theme } from "../theme/colors"

export default function MapLegend() {
  return (
    <View style={styles.wrap}>
      <LegendItem color="rgba(15,118,110,0.8)" label="Safe Zone" />
      <LegendItem color="rgba(220,38,38,0.9)" label="Restricted" />
    </View>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.item}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: 3 },
  text: { color: theme.fg, fontWeight: "600" },
})
