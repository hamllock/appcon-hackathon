import { useLayoutEffect, useState } from "react";
import { useNavigation } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function NewsVerification() {
  const navigation = useNavigation();
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Configure API URL (replace with your actual API URL or use environment variable)
  const API_URL = "http://192.168.1.4:5000/predict"; // Consider using env variables for production

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "News Verification",
      headerBackVisible: false,
    });
  }, [navigation]);

  const handleSend = async () => {
    if (!content || !source) {
      Alert.alert("Missing Fields", "Please fill in both Content and Source.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, brand: source }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Server responded with error:", data.error);
        Alert.alert("Server Error", data.error || "Something went wrong.");
        return;
      }

      if (data.status !== "success") {
        Alert.alert("Prediction Failed", "Could not generate prediction.");
        return;
      }

      const predictions = data.predictions;
      const formatted = Object.entries(predictions)
        .map(([model, result]) => `${model}: ${result}`)
        .join("\n");

      Alert.alert("Predictions", formatted);
    } catch (error) {
      console.error("Fetch failed:", error);
      Alert.alert(
        "Connection Error",
        "Could not connect to the server. Please check your network and server status."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setContent("");
    setSource("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.content}>
            <Text style={styles.description}>
              Fill in details about the news article to verify if it's real or fake.
            </Text>

            <Text style={styles.label}>Content</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Enter news content"
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Source</Text>
            <TextInput
              style={styles.sourceInput}
              placeholder="Enter news source"
              value={source}
              onChangeText={setSource}
            />

            <View style={styles.buttonContainer}>
              <Button
                title={isLoading ? "Processing..." : "Send"}
                onPress={handleSend}
                color="#007BFF"
                disabled={isLoading}
              />
              <Button
                title="Clear"
                onPress={handleClear}
                color="#FF3B30"
                disabled={isLoading}
              />
            </View>

            {isLoading && (
              <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // Increased padding to ensure buttons are reachable
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    marginTop: 15,
  },
  contentInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 300, // Limit max height to prevent overwhelming the screen
    textAlignVertical: "top",
  },
  sourceInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 60,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20, // Ensure buttons have space below
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
});