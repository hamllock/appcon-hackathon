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
import { speak, stop } from "expo-speech";

export default function ObjectDetection() {
  const navigation = useNavigation();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [detectedLabels, setDetectedLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Configure API URL (replace with your server’s IP or ngrok URL)
  const API_URL = "http://192.168.1.4:5000/process_image"; // Matches Flask endpoint

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Object Detection",
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
      setDetectedLabels([]); // Clear previous labels
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
        },
      });

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError.message);
        throw new Error("Invalid server response");
      }

      console.log("Parsed response data:", data);

      if (!response.ok) {
        console.error("Server error:", data.error);
        Alert.alert("Server Error", data.error || "Something went wrong.");
        return;
      }

      if (data.error) {
        Alert.alert("Processing Failed", data.error);
        return;
      }

      const labels = data.yolo_labels || [];
      setDetectedLabels(labels);

      // Speak the formatted label counts
      const formattedLabels = formatLabelCounts(labels);
      const speechText = formattedLabels.length > 0 ? formattedLabels.join(". ") : "No objects detected.";
      speak(speechText, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
      });
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
    setDetectedLabels([]);
    stop(); // Stop any ongoing speech
  };

  // Function to format detected labels into counts
  const formatLabelCounts = (labels) => {
    if (!labels || labels.length === 0) return ["No objects detected."];

    // Count occurrences of each label
    const labelCounts = labels.reduce((acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    // Format each label count
    return Object.entries(labelCounts).map(([label, count]) => {
      const plural = count > 1 ? "s" : "";
      return `${count} ${label}${plural} detected`;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.description}>
          Take a picture to detect objects in the image.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Take Picture"
            onPress={takePicture}
            color="#007BFF"
            disabled={isLoading}
          />
          <Button
            title="Detect Objects"
            onPress={handleSend}
            color="#007BFF"
            disabled={isLoading || !imageUri}
          />
          <Button
            title="Clear"
            onPress={handleClear}
            color="#FF3B30"
            disabled={isLoading || (!imageUri && detectedLabels.length === 0)}
          />
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
        )}

        {imageUri && (
          <Text style={styles.status}>Image selected. Ready to process.</Text>
        )}

        <ScrollView style={styles.textContainer}>
          {detectedLabels.length > 0 ? (
            <>
              <Text style={styles.label}>Detected Objects:</Text>
              <View style={styles.labelsContainer}>
                {formatLabelCounts(detectedLabels).map((formattedLabel, index) => (
                  <Text key={index} style={styles.labelItem}>
                    {formattedLabel}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.status}>No objects detected yet.</Text>
          )}
        </ScrollView>
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
    marginTop: 10,
  },
  labelsContainer: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  labelItem: {
    fontSize: 16,
    color: "#000",
    paddingVertical: 2,
  },
});