import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme/colors';

export function Card(props: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, props.style]}>{props.children}</View>
}

export function Button(props: {
  title: string
  onPress?: () => void
  variant?: "primary" | "ghost" | "warn" | "danger"
  style?: ViewStyle
  textStyle?: TextStyle
  disabled?: boolean
}) {
  const variant = props.variant || "primary"
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "ghost" && styles.btnGhost,
        variant === "warn" && styles.btnWarn,
        variant === "danger" && styles.btnDanger,
        props.disabled && styles.btnDisabled,
        props.style,
      ]}
      onPress={props.onPress}
      disabled={props.disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.btnText, variant === "primary" && styles.btnTextPrimary, variant === "ghost" && styles.btnTextGhost, props.textStyle]}>
        {props.title}
      </Text>
    </TouchableOpacity>
  )
}

export function Badge(props: { text: string; variant?: "primary" | "success" | "warning" | "danger" }) {
  const variant = props.variant || "primary"
  return (
    <View style={[styles.badge, variant === "primary" && styles.badgePrimary, variant === "success" && styles.badgeSuccess]}>
      <Text style={styles.badgeText}>{props.text}</Text>
    </View>
  )
}

export function SectionTitle(props: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.sectionTitle, props.style]}>{props.children}</Text>
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.bgCard, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  btn: { height: 48, borderRadius: 12, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", marginVertical: 8 },
  btnPrimary: { backgroundColor: theme.primary },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.primary },
  btnWarn: { backgroundColor: theme.warning },
  btnDanger: { backgroundColor: theme.danger },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: "600" },
  btnTextPrimary: { color: theme.textOnPrimary },
  btnTextGhost: { color: theme.primary },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgePrimary: { backgroundColor: theme.primary },
  badgeSuccess: { backgroundColor: theme.success },
  badgeText: { color: theme.textOnPrimary, fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: theme.text, marginBottom: 16 },
});
