import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { router } from "expo-router";

export default function Dashboard() {
  const features = [
    {
      id: "news-verify",
      name: "News Verification",
      icon: "newspaper-variant-outline",
      iconType: "MaterialCommunity",
      color: "#4A6FFF",
      description: "Check if the news you read is real or fake",
    },
    {
      id: "text-reader",
      name: "Text Reader",
      icon: "text-recognition",
      iconType: "Material",
      color: "#FF6B6B",
      description: "Scan and read text from images",
    },
    {
      id: "wound-classify",
      name: "Wound Classification",
      icon: "bandage",
      iconType: "MaterialCommunity",
      color: "#56C568",
      description: "Identify and classify wounds",
    },
    {
      id: "object-identify",
      name: "Object Identification",
      icon: "eye",
      iconType: "Feather",
      color: "#FFB344",
      description: "Identify objects in your surroundings",
    },
  ];

  const navigateToFeature = (featureId: string) => {
    console.log(`Navigating to ${featureId}`);
    //TODO: fix whatever this is
    //router.push(`/(features)/${featureId}`);
  };

  const renderIcon = (feature: any) => {
    if (feature.iconType === "MaterialCommunity") {
      return (
        <MaterialCommunityIcons name={feature.icon} size={40} color="#fff" />
      );
    } else if (feature.iconType === "Material") {
      return <MaterialIcons name={feature.icon} size={40} color="#fff" />;
    } else if (feature.iconType === "Feather") {
      return <Feather name={feature.icon} size={40} color="#fff" />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f7" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Utility Assistant</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settings")}
        >
          <Feather name="settings" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeContainer}>
          <View style={styles.logoPlaceholder}>
            <Feather name="camera" size={32} color="#fff" />
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Hello there!</Text>
            <Text style={styles.subtitleText}>
              What would you like to do today?
            </Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, { backgroundColor: feature.color }]}
              onPress={() => navigateToFeature(feature.id)}
            >
              <View style={styles.featureIconContainer}>
                {renderIcon(feature)}
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyActivity}>
            <Feather name="clock" size={30} color="#888" />
            <Text style={styles.emptyActivityText}>No recent activities</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f5f5f7",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  settingsButton: {
    padding: 6,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  welcomeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4A6FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTextContainer: {
    marginLeft: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitleText: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureCard: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  featureName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  featureDescription: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  recentActivityContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  emptyActivity: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyActivityText: {
    fontSize: 16,
    color: "#888",
    marginTop: 10,
  },
});
