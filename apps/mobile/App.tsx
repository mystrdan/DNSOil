import { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, Pressable, View, ScrollView } from "react-native";

type Offer = { id: string; provider: string; product: string; priceMinor: number; term: string; details: string };
const domainOffers: Offer[] = [
  { id: "reg-a", provider: "Example Registrar A", product: ".com registration", priceMinor: 1299, term: "per year", details: "Standard registration · sample only" },
  { id: "reg-b", provider: "Example Registrar B", product: ".com registration", priceMinor: 1450, term: "per year", details: "Standard registration · sample only" },
];
const hostingOffers: Offer[] = [
  { id: "host-a", provider: "Example Host A", product: "Starter Hosting", priceMinor: 3500, term: "per month", details: "10 GB storage · sample only" },
  { id: "host-b", provider: "Example Host B", product: "Shared Hosting", priceMinor: 4900, term: "per month", details: "25 GB storage · sample only" },
];
const money = (minor: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(minor / 100);

export default function App() {
  const [service, setService] = useState<"domains" | "hosting">("domains");
  const [selected, setSelected] = useState("reg-a");
  const [domain, setDomain] = useState("");
  const [searchNotice, setSearchNotice] = useState("");
  const offers = service === "domains" ? domainOffers : hostingOffers;
  const selectedOffer = offers.find((offer) => offer.id === selected) ?? offers[0]!;
  const fee = Math.ceil(selectedOffer.priceMinor * 0.01);

  function changeService(next: "domains" | "hosting") {
    setService(next);
    setSelected(next === "domains" ? "reg-a" : "host-a");
  }

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
          <Text style={styles.title}>Your domains.{"\n"}<Text style={styles.accent}>Your choice.</Text></Text>
          <Text style={styles.copy}>Compare registrars and hosting providers, choose your deal, and manage services from one workspace.</Text>
          <TextInput style={styles.input} value={domain} onChangeText={(value) => { setDomain(value); setSearchNotice(""); }} placeholder="yourbrand.com" placeholderTextColor="#748078" autoCapitalize="none" autoCorrect={false} />
          <Pressable style={styles.button} accessibilityRole="button" onPress={() => setSearchNotice(domain.trim() ? "Live availability is not connected yet. No domain has been checked or reserved." : "Enter a domain name to continue.")}>
            <Text style={styles.buttonText}>Check domain →</Text>
          </Pressable>
          {searchNotice ? <Text style={styles.note}>{searchNotice}</Text> : <Text style={styles.note}>Early build · Live domain availability is not connected.</Text>}
        </View>

        <View style={styles.catalogSection}>
          <Text style={styles.sectionEyebrow}>PROVIDER MARKETPLACE</Text>
          <Text style={styles.sectionTitle}>Compare before you choose.</Text>
          <Text style={styles.sectionCopy}>Sample prices only. These fictional offers preview how DNSOil will show the provider price and its proposed 1% fee.</Text>
          <View style={styles.tabs}>
            <Pressable style={[styles.tab, service === "domains" && styles.activeTab]} onPress={() => changeService("domains")}><Text style={[styles.tabText, service === "domains" && styles.activeTabText]}>Domains</Text></Pressable>
            <Pressable style={[styles.tab, service === "hosting" && styles.activeTab]} onPress={() => changeService("hosting")}><Text style={[styles.tabText, service === "hosting" && styles.activeTabText]}>Hosting</Text></Pressable>
          </View>
          {offers.map((offer) => {
            const offerFee = Math.ceil(offer.priceMinor * 0.01);
            const isSelected = selectedOffer.id === offer.id;
            return (
              <Pressable key={offer.id} style={[styles.offer, isSelected && styles.selectedOffer]} onPress={() => setSelected(offer.id)} accessibilityRole="button">
                <View style={styles.offerHeading}>
                  <View style={styles.offerMark}><Text style={styles.offerMarkText}>{offer.provider.slice(-1)}</Text></View>
                  <View style={styles.offerNameWrap}><Text style={styles.provider}>{offer.provider}</Text><Text style={styles.product}>{offer.product}</Text></View>
                  {isSelected ? <Text style={styles.selectedLabel}>SELECTED</Text> : null}
                </View>
                <Text style={styles.offerDetails}>{offer.details}</Text>
                <Text style={styles.price}>{money(offer.priceMinor)} <Text style={styles.term}>/ {offer.term}</Text></Text>
                <View style={styles.priceBreakdown}><Text style={styles.breakdownLabel}>DNSOil fee (1%)</Text><Text style={styles.breakdownValue}>{money(offerFee)}</Text></View>
                <View style={styles.priceBreakdown}><Text style={styles.breakdownLabel}>Sample total</Text><Text style={styles.total}>{money(offer.priceMinor + offerFee)}</Text></View>
              </Pressable>
            );
          })}
          <Text style={styles.disclaimer}>Fictional providers and prices. No live quote, purchase, payment or reservation is available in this build.</Text>
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
  title: { color: "#f1f5f1", fontSize: 49, fontWeight: "800", lineHeight: 53, letterSpacing: -2.5, marginBottom: 22 },
  accent: { color: "#a5f078" },
  copy: { color: "#9ba69d", fontSize: 16, lineHeight: 25, marginBottom: 28 },
  input: { height: 52, backgroundColor: "#171c18", borderColor: "#303831", borderWidth: 1, borderRadius: 9, paddingHorizontal: 14, color: "#f1f5f1", fontSize: 15, marginBottom: 10 },
  button: { height: 50, backgroundColor: "#a5f078", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#11180e", fontSize: 14, fontWeight: "800" },
  note: { color: "#7d897f", fontSize: 11, lineHeight: 17, marginTop: 14 },
  catalogSection: { marginBottom: 20 },
  sectionEyebrow: { color: "#a5f078", fontSize: 10, fontWeight: "700", letterSpacing: 1.6, marginBottom: 10 },
  sectionTitle: { color: "#f1f5f1", fontSize: 24, fontWeight: "800", letterSpacing: -0.8 },
  sectionCopy: { color: "#9ba69d", fontSize: 12, lineHeight: 20, marginTop: 9, marginBottom: 16 },
  tabs: { flexDirection: "row", gap: 6, padding: 5, borderWidth: 1, borderColor: "#252b27", borderRadius: 9, backgroundColor: "#121713", marginBottom: 12 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 6 },
  activeTab: { backgroundColor: "#a5f078" },
  tabText: { color: "#9ba69d", fontSize: 12, fontWeight: "700" },
  activeTabText: { color: "#11180e" },
  offer: { padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#252b27", borderRadius: 10, backgroundColor: "#121614" },
  selectedOffer: { borderColor: "#739d5b" },
  offerHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  offerMark: { width: 28, height: 28, borderRadius: 7, backgroundColor: "#222a23", alignItems: "center", justifyContent: "center" },
  offerMarkText: { color: "#a5f078", fontSize: 12, fontWeight: "800" },
  offerNameWrap: { flex: 1 },
  provider: { color: "#9ba69d", fontSize: 10 },
  product: { color: "#f1f5f1", fontSize: 14, fontWeight: "700", marginTop: 4 },
  selectedLabel: { color: "#a5f078", fontSize: 8, fontWeight: "800" },
  offerDetails: { color: "#7d897f", fontSize: 10, marginTop: 13, lineHeight: 16 },
  price: { color: "#f1f5f1", fontSize: 27, fontWeight: "800", letterSpacing: -1, marginTop: 18, marginBottom: 9 },
  term: { color: "#9ba69d", fontSize: 10, fontWeight: "500", letterSpacing: 0 },
  priceBreakdown: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#252b27", paddingTop: 10, marginTop: 8 },
  breakdownLabel: { color: "#9ba69d", fontSize: 11 },
  breakdownValue: { color: "#f1f5f1", fontSize: 11, fontWeight: "700" },
  total: { color: "#f1f5f1", fontSize: 12, fontWeight: "800" },
  disclaimer: { color: "#7d897f", fontSize: 10, lineHeight: 17, marginTop: 6, marginBottom: 18 },
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
