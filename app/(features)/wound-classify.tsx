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
import * as Speech from "expo-speech";

export default function ImageOCR() {
  const navigation = useNavigation();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [woundData, setWoundData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Configure API URL
  const API_URL = "http://192.168.1.4:5000/wound";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Wound Detector",
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
      setWoundData(null); // Clear previous data
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
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("Server error:", data.error);
        Alert.alert("Server Error", data.error || "Something went wrong.");
        return;
      }

      if (data.error) {
        Alert.alert("Detection Failed", data.error);
        return;
      }

      setWoundData(data);

      // Prepare text for TTS
      let ttsText = data.message;
      if (data.detected_wounds && data.detected_wounds.length > 0) {
        ttsText += " Detected wounds: ";
        data.detected_wounds.forEach((wound, index) => {
          ttsText += `${wound.wound_type}. Definition: ${wound.definition}. First aid: ${wound.first_aid.join(" ")}`;
          if (index < data.detected_wounds.length - 1) {
            ttsText += "; ";
          }
        });
      }

      // Use TTS to read the response
      Speech.speak(ttsText, {
        language: "en",
        pitch: 1.0,
        rate: 1.0,
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
    setWoundData(null);
    Speech.stop(); // Stop any ongoing speech
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.description}>
          Take a picture to identify the wound.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Take Picture"
            onPress={takePicture}
            color="#007BFF"
            disabled={isLoading}
          />
          <Button
            title="Send to Wound Detector"
            onPress={handleSend}
            color="#007BFF"
            disabled={isLoading || !imageUri}
          />
          <Button
            title="Clear"
            onPress={handleClear}
            color="#FF3B30"
            disabled={isLoading || (!imageUri && !woundData)}
          />
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
        )}

        {imageUri && (
          <Text style={styles.status}>Image selected. Ready to send.</Text>
        )}

        {woundData ? (
          <ScrollView style={styles.textContainer}>
            <Text style={styles.label}>Detection Result:</Text>
            <Text style={styles.message}>{woundData.message}</Text>
            {woundData.detected_wounds && woundData.detected_wounds.length > 0 && (
              <>
                <Text style={styles.subLabel}>Detected Wounds:</Text>
                {woundData.detected_wounds.map((wound, index) => (
                  <View key={index} style={styles.woundContainer}>
                    <Text style={styles.woundType}>{wound.wound_type}</Text>
                    <Text style={styles.definition}>
                      Definition: {wound.definition}
                    </Text>
                    <Text style={styles.firstAidLabel}>First Aid:</Text>
                    {wound.first_aid.map((step, idx) => (
                      <Text key={idx} style={styles.firstAidStep}>
                        • {step}
                      </Text>
                    ))}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        ) : (
          <Text style={styles.status}>No wounds detected yet.</Text>
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
    fontWeight: "bold",
  },
  subLabel: {
    fontSize: 14,
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "bold",
  },
  message: {
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  woundContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  woundType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 5,
  },
  definition: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  firstAidLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
    marginBottom: 5,
  },
  firstAidStep: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
});