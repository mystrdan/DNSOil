import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, Pressable, View, ScrollView } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.nav}>
        <View style={styles.mark}><Text style={styles.markText}>D</Text></View>
        <Text style={styles.brand}>DNSOil</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>THE DOMAIN WORKSPACE</Text>
          <Text style={styles.title}>Your domains.{"\n"}<Text style={styles.accent}>One place.</Text></Text>
          <Text style={styles.copy}>Domains, DNS and hosting services — brought together in one straightforward workspace.</Text>
          <TextInput style={styles.input} placeholder="yourbrand.com" placeholderTextColor="#748078" autoCapitalize="none" autoCorrect={false} />
          <Pressable style={styles.button} accessibilityRole="button">
            <Text style={styles.buttonText}>Check domain →</Text>
          </Pressable>
          <Text style={styles.note}>Early build · Domain search is not connected yet.</Text>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardEyebrow}>WEB HOSTING</Text>
              <Text style={styles.cardTitle}>Hosting services</Text>
            </View>
            <Text style={styles.status}>Not connected</Text>
          </View>
          <Text style={styles.cardCopy}>Your hosting plan, linked domain, renewal date and provider portal can appear here when a hosting integration is connected.</Text>
          <View style={styles.securityNote}>
            <Text style={styles.securityTitle}>Your login stays with your provider</Text>
            <Text style={styles.securityCopy}>DNSOil will not store your cPanel or Plesk password. Secure one-click access depends on the hosting provider's supported features.</Text>
          </View>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardEyebrow}>DNSOIL WALLET</Text>
              <Text style={styles.cardTitle}>Your wallet</Text>
            </View>
            <Text style={styles.status}>Not enabled</Text>
          </View>
          <Text style={styles.cardCopy}>Wallet balance and transaction history will appear here when wallet services are enabled.</Text>
          <Text style={styles.note}>Deposits and spending are disabled.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0d0c", paddingHorizontal: 22 },
  nav: { height: 72, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#252b27" },
  mark: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#a5f078", alignItems: "center", justifyContent: "center" },
  markText: { color: "#10180e", fontSize: 18, fontWeight: "900" },
  brand: { color: "#f1f5f1", fontSize: 20, fontWeight: "800", letterSpacing: -0.8 },
  content: { paddingBottom: 35 },
  hero: { paddingTop: 46, paddingBottom: 30 },
  eyebrow: { color: "#a5f078", fontSize: 11, fontWeight: "700", letterSpacing: 1.7, marginBottom: 24 },
  title: { color: "#f1f5f1", fontSize: 53, fontWeight: "800", lineHeight: 55, letterSpacing: -2.5, marginBottom: 22 },
  accent: { color: "#a5f078" },
  copy: { color: "#9ba69d", fontSize: 16, lineHeight: 25, marginBottom: 28 },
  input: { height: 52, backgroundColor: "#171c18", borderColor: "#303831", borderWidth: 1, borderRadius: 9, paddingHorizontal: 14, color: "#f1f5f1", fontSize: 15, marginBottom: 10 },
  button: { height: 50, backgroundColor: "#a5f078", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#11180e", fontSize: 14, fontWeight: "800" },
  note: { color: "#7d897f", fontSize: 11, lineHeight: 17, marginTop: 14 },
  serviceCard: { padding: 19, borderWidth: 1, borderColor: "#252b27", borderRadius: 12, backgroundColor: "#121614", marginBottom: 14 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  cardEyebrow: { color: "#a5f078", fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
  cardTitle: { color: "#f1f5f1", fontSize: 19, fontWeight: "700" },
  status: { color: "#f0d5a2", backgroundColor: "#201b12", borderColor: "#59482b", borderWidth: 1, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 6, fontSize: 10, overflow: "hidden" },
  cardCopy: { color: "#9ba69d", fontSize: 12, lineHeight: 20, marginTop: 17 },
  securityNote: { marginTop: 17, padding: 13, borderWidth: 1, borderColor: "#2b342d", borderRadius: 8, backgroundColor: "#101411" },
  securityTitle: { color: "#f1f5f1", fontSize: 12, fontWeight: "700" },
  securityCopy: { color: "#9ba69d", fontSize: 11, lineHeight: 18, marginTop: 7 }
});
