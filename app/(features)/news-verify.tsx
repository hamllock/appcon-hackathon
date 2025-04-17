import { useLayoutEffect, useState } from "react";
import { useNavigation } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function NewsVerification() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "News Verification",
      headerBackVisible: false,
    });
  }, [navigation]);

  const [content, setContent] = useState("");
  const [source, setSource] = useState("");

  const handleSend = () => {
    console.log("Sending...");
    console.log("Content:", content);
    console.log("Source:", source);
    // TODO: Add backend/API call here
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>News Verification</Text>
        <Text style={styles.description}>
          Fill in details about the news article to verify if it's real or fake.
        </Text>

        {/* Content Input */}
        <Text style={styles.label}>Content</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter the news content"
          value={content}
          onChangeText={setContent}
          multiline
        />

        {/* Source Input */}
        <Text style={styles.label}>Source</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter the source"
          value={source}
          onChangeText={setSource}
        />

        {/* Send Button */}
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>

        {/* Placeholder */}
        <View style={styles.placeholderForm}>
          <Text style={styles.placeholderText}>Form coming soon</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: "#4A6FFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  placeholderForm: {
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#888",
  },
});
