import { useLayoutEffect, useState } from "react";
import { useNavigation } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Button,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

export default function ImageOCR() {
  const navigation = useNavigation();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Configure API URL (replace with your server’s IP or ngrok URL)
  const API_URL = "http://192.168.1.4:5000/ocr"; // Update as needed

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Image OCR",
      headerBackVisible: false,
    });
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted" && mediaStatus.status === "granted");
    })();
  }, [navigation]);

  const takePicture = async () => {
    if (hasCameraPermission === null) {
      Alert.alert("Permission Error", "Camera permission is still loading.");
      return;
    }
    if (hasCameraPermission === false) {
      Alert.alert("Permission Error", "Camera and/or media library access was denied.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setExtractedText(""); // Clear previous text
    }
  };

  const handleSend = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please take a picture first.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "photo.jpg",
      });

      console.log("Sending request to:", API_URL);
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          // Note: 'Content-Type' is set automatically by FormData
        },
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("Server error:", data.error);
        Alert.alert("Server Error", data.error || "Something went wrong.");
        return;
      }

      if (data.error) {
        Alert.alert("OCR Failed", data.error);
        return;
      }

      setExtractedText(data.extracted_text || "No text detected.");
    } catch (error) {
      console.error("Fetch error:", error.message, error.stack);
      Alert.alert(
        "Connection Error",
        `Could not connect to the server: ${error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setImageUri(null);
    setExtractedText("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.description}>
          Take a picture to extract text using OCR.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Take Picture"
            onPress={takePicture}
            color="#007BFF"
            disabled={isLoading}
          />
          <Button
            title="Send to OCR"
            onPress={handleSend}
            color="#007BFF"
            disabled={isLoading || !imageUri}
          />
          <Button
            title="Clear"
            onPress={handleClear}
            color="#FF3B30"
            disabled={isLoading || (!imageUri && !extractedText)}
          />
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
        )}

        {imageUri && (
          <Text style={styles.status}>Image selected. Ready to send.</Text>
        )}

        {extractedText ? (
          <ScrollView style={styles.textContainer}>
            <Text style={styles.label}>Extracted Text:</Text>
            <Text style={styles.extractedText}>{extractedText}</Text>
          </ScrollView>
        ) : (
          <Text style={styles.status}>No text extracted yet.</Text>
        )}
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
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  status: {
    fontSize: 14,
    color: "#333",
    marginVertical: 10,
    textAlign: "center",
  },
  textContainer: {
    flex: 1,
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  extractedText: {
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
});