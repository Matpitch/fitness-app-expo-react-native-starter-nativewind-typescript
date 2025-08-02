// app/create-pet-profile.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
  Modal, // Import Modal for custom alerts
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Switch } from "react-native";

// Firebase Imports
// Import the app, auth, and db instances directly from your firebaseConfig.js
import { app, auth, db } from "../../firebaseConfig"; // Adjust path if necessary
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";


const temperamentOptions = [
  "Playful",
  "Shy",
  "Reactive",
  "Loves Kids",
  "Good with Cats",
];

export default function CreatePetProfile() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  // State for Firebase instances and user
  // We no longer need to initialize app, db, auth here as they are imported
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // State for form fields
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState(""); // <-- Added petType state
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | null>(null);
  const [spayedNeutered, setSpayedNeutered] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false); // To disable button during save

  // State for custom modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"confirm" | "info">("info");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  // Function to show custom alert modal
  const showCustomAlert = (title: string, message: string, type: "confirm" | "info" = "info", onConfirm?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setOnConfirmAction(onConfirm || null);
    setModalVisible(true);
  };

  // Set up auth listener and storage
  useEffect(() => {
    if (app) { // Ensure the 'app' instance is available from firebaseConfig
      setStorage(getStorage(app));
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true); // Auth state has been checked
    });

    return () => unsubscribe();
  }, [app]); // Depend on 'app' to ensure storage is initialized after app is available

  // Ensure user is authenticated before allowing data operations
  useEffect(() => {
    if (isAuthReady && !currentUser) {
      // If auth is ready but no user, redirect to welcome (or login)
      router.replace("/(auth)/welcome");
    }
  }, [isAuthReady, currentUser]);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showCustomAlert("Permission Denied", "Sorry, we need camera roll permissions to upload a photo!", "info");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    );
  };

  const handleSave = async () => {
    // Check if Firebase instances and current user are available
    if (!currentUser || !db || !storage) {
      showCustomAlert("Error", "Authentication or Firebase services not ready. Please try again.", "info");
      return;
    }

    if (!petName || !petType || !breed || !age || !gender) { // <-- Added petType to validation
      showCustomAlert("Missing Information", "Please fill in all required fields: Pet Name, Pet Type, Breed, Age, and Gender.", "info");
      return;
    }

    setIsSaving(true);
    let photoDownloadUrl: string | null = null;

    try {
      if (photoUri) {
        // Fetch the image as a blob
        const response = await fetch(photoUri);
        const blob = await response.blob();

        // Create a storage reference. We will use a more direct path here.
        const storageRef = ref(storage, `users/${currentUser.uid}/pet_photos/${petName}_${Date.now()}.jpg`);

        // Upload the blob
        await uploadBytes(storageRef, blob);

        // Get the download URL
        photoDownloadUrl = await getDownloadURL(storageRef);
      }

      // Prepare pet data
      const petData = {
        petName,
        petType, // <-- Added petType to the object
        breed,
        age: parseInt(age), // Convert age to number
        gender,
        spayedNeutered,
        temperamentTags: selectedTags,
        photoURL: photoDownloadUrl,
        ownerId: currentUser.uid, // Link to the owner's UID
        createdAt: new Date().toISOString(), // Timestamp
      };

      // Save to Firestore using the correct path that matches the security rules
      const petsCollectionRef = collection(db, "users", currentUser.uid, "pets");
      await setDoc(doc(petsCollectionRef), petData); // Use setDoc with an auto-generated ID

      showCustomAlert("Success", "Pet profile saved successfully!", "info", () => {
        // Wrap the navigation in a setTimeout to defer the state update
        setTimeout(() => {
          router.push("/"); // Navigate back to home or pet list
        }, 0);
      });

    } catch (error) {
      console.error("Error saving pet profile:", error);
      showCustomAlert("Error", "Failed to save pet profile. Please try again.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthReady) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <Text className={`${isDark ? "text-slate-100" : "text-gray-900"}`}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className={`${isDark ? "bg-slate-900" : "bg-white"} flex-1`}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Dismiss keyboard on tap outside inputs */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              className={`text-3xl font-bold mb-8 ${isDark ? "text-slate-100" : "text-gray-900"
                }`}
            >
              Tell us about your furry friend!
            </Text>

            {/* Photo Upload */}
            <Pressable
              onPress={pickImage}
              className={`self-center mb-8 rounded-full border-4 ${isDark ? "border-slate-700" : "border-gray-300"
                } justify-center items-center bg-gray-100 w-36 h-36`}
            >
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  className="w-36 h-36 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-6xl text-gray-400">🐾</Text>
              )}
            </Pressable>

            {/* Pet Name */}
            <TextInput
              placeholder="Pet Name"
              placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
              value={petName}
              onChangeText={setPetName}
              className={`border rounded-lg px-4 pb-2 mb-4 text-base ${isDark
                  ? "border-slate-700 bg-slate-800 text-slate-100"
                  : "border-gray-300 bg-white text-gray-900"
                }`}
              autoCapitalize="words"
              returnKeyType="next"
              style={{ height: 48, textAlignVertical: "center" }}
            />
            
            {/* Pet Type */}
            <TextInput
              placeholder="Pet Type (e.g., Dog, Cat, etc.)"
              placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
              value={petType}
              onChangeText={setPetType}
              className={`border rounded-lg px-4 pb-2 mb-4 text-base ${isDark
                  ? "border-slate-700 bg-slate-800 text-slate-100"
                  : "border-gray-300 bg-white text-gray-900"
                }`}
              autoCapitalize="words"
              returnKeyType="next"
              style={{ height: 48, textAlignVertical: "center" }}
            />

            {/* Breed */}
            <TextInput
              placeholder="Breed"
              placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
              value={breed}
              onChangeText={setBreed}
              className={`border rounded-lg px-4 pb-2  mb-4 text-base ${isDark
                  ? "border-slate-700 bg-slate-800 text-slate-100"
                  : "border-gray-300 bg-white text-gray-900"
                }`}
              autoCapitalize="words"
              returnKeyType="next"
              style={{ height: 48, textAlignVertical: "center" }}
            />

            {/* Age */}
            <TextInput
              placeholder="Age"
              placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              className={`border rounded-lg px-4 pb-2  mb-4 text-base ${isDark
                  ? "border-slate-700 bg-slate-800 text-slate-100"
                  : "border-gray-300 bg-white text-gray-900"
                }`}
              returnKeyType="done"
              style={{ height: 48, textAlignVertical: "center" }}
            />

            {/* Gender */}
            <Text
              className={`text-lg font-semibold mb-2 ${isDark ? "text-slate-100" : "text-gray-900"
                }`}
            >
              Gender
            </Text>

            <View className="flex-row justify-between mb-4">
              {["Male", "Female"].map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g as "Male" | "Female")}
                  className={`flex-1 rounded-lg border py-3 mx-1 items-center ${gender === g
                      ? "bg-blue-600 border-blue-600"
                      : isDark
                        ? "border-slate-700"
                        : "border-gray-300"
                    }`}
                >
                  <Text
                    className={`font-semibold ${gender === g
                        ? "text-white"
                        : isDark
                          ? "text-slate-200"
                          : "text-gray-700"
                      }`}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
            {/* Spayed/Neutered Toggle */}
            <View className="flex-row items-center mb-6 justify-between">
              <Text
                className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-gray-900"
                  }`}
              >
                Spayed / Neutered
              </Text>
              <Switch
                value={spayedNeutered}
                onValueChange={setSpayedNeutered}
                trackColor={{ false: "#d1d5db", true: "#2563eb" }} // gray and blue
                thumbColor={spayedNeutered ? "#3b82f6" : "#f9fafb"} // brighter blue and white
              />
            </View>

            {/* Temperament Tags */}
            <Text
              className={`text-lg font-semibold mb-3 ${isDark ? "text-slate-100" : "text-gray-900"
                }`}
            >
              Temperament
            </Text>
            <View className="flex-row flex-wrap mb-8">
              {temperamentOptions.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    className={`px-4 py-2 m-1 rounded-full border ${selected
                        ? "bg-blue-600 border-blue-600"
                        : isDark
                          ? "border-slate-700"
                          : "border-gray-300"
                      }`}
                  >
                    <Text
                      className={`${selected
                          ? "text-white"
                          : isDark
                            ? "text-slate-200"
                            : "text-gray-700"
                        }`}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              className="bg-blue-600 py-4 rounded-xl items-center mb-4"
              disabled={isSaving} // Disable button while saving
            >
              <Text className="text-white text-lg font-semibold">
                {isSaving ? "Saving..." : "Save Pet Profile"}
              </Text>
            </Pressable>

            {/* Skip Link */}
            <Pressable onPress={() => router.push("/")} className="items-center">
              <Text
                className={`text-gray-500 underline ${isDark ? "text-slate-400" : "text-gray-500"
                  }`}
              >
                Skip for now
              </Text>
            </Pressable>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50 px-8">
          <View className={`rounded-lg p-6 w-full ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <Text className={`text-xl font-bold mb-4 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
              {modalTitle}
            </Text>
            <Text className={`text-base mb-6 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              {modalMessage}
            </Text>
            <View className="flex-row justify-end">
              {modalType === "confirm" && (
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="px-4 py-2 rounded-lg mr-3"
                >
                  <Text className={`text-blue-600 font-semibold`}>Cancel</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  if (onConfirmAction) {
                    onConfirmAction();
                  }
                  setModalVisible(false); // Always close modal on OK/Send
                }}
                className={`px-4 py-2 rounded-lg ${modalType === "confirm" ? "bg-red-600" : "bg-blue-600"}`}
              >
                <Text className="text-white font-semibold">
                  {modalType === "confirm" ? "Confirm" : "OK"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
