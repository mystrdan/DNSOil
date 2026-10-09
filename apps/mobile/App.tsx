import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, Pressable, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.nav}>
        <View style={styles.mark}><Text style={styles.markText}>D</Text></View>
        <Text style={styles.brand}>DNSOil</Text>
      </View>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>THE DOMAIN WORKSPACE</Text>
        <Text style={styles.title}>Your domains.{"\n"}<Text style={styles.accent}>One place.</Text></Text>
        <Text style={styles.copy}>Search, register and manage domains through one straightforward dashboard.</Text>
        <TextInput style={styles.input} placeholder="yourbrand.com" placeholderTextColor="#748078" autoCapitalize="none" autoCorrect={false} />
        <Pressable style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>Check domain →</Text>
        </Pressable>
        <Text style={styles.note}>Early build · Search is not connected yet.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0d0c", paddingHorizontal: 22 },
  nav: { height: 72, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#252b27" },
  mark: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#a5f078", alignItems: "center", justifyContent: "center" },
  markText: { color: "#10180e", fontSize: 18, fontWeight: "900" },
  brand: { color: "#f1f5f1", fontSize: 20, fontWeight: "800", letterSpacing: -0.8 },
  hero: { flex: 1, justifyContent: "center", paddingBottom: 44 },
  eyebrow: { color: "#a5f078", fontSize: 11, fontWeight: "700", letterSpacing: 1.7, marginBottom: 24 },
  title: { color: "#f1f5f1", fontSize: 53, fontWeight: "800", lineHeight: 55, letterSpacing: -2.5, marginBottom: 22 },
  accent: { color: "#a5f078" },
  copy: { color: "#9ba69d", fontSize: 16, lineHeight: 25, marginBottom: 28 },
  input: { height: 52, backgroundColor: "#171c18", borderColor: "#303831", borderWidth: 1, borderRadius: 9, paddingHorizontal: 14, color: "#f1f5f1", fontSize: 15, marginBottom: 10 },
  button: { height: 50, backgroundColor: "#a5f078", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#11180e", fontSize: 14, fontWeight: "800" },
  note: { color: "#7d897f", fontSize: 11, marginTop: 14 }
});
