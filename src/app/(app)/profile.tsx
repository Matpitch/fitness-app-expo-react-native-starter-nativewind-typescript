// src/app/profile.tsx
import {
  View,
  Text,
  useColorScheme,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
  SafeAreaView,
  Modal, // Import Modal for custom alerts
  TextInput, // <-- Added for the edit form
  Switch, // <-- Added for the edit form
  KeyboardAvoidingView, // <-- Added for the edit form
  Platform, // <-- Added for the edit form
  TouchableWithoutFeedback, // <-- Added for the edit form
  Keyboard, // <-- Added for the edit form
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker"; // <-- Added for image editing
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage"; // <-- Added for image storage
// Import necessary Firestore functions for real-time listeners and fetching data
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc, // <-- Import updateDoc for editing
} from "firebase/firestore";
import { auth, db, app } from "../../firebaseConfig"; // Import db, auth, and app
import { signOut, User as FirebaseAuthUser } from "firebase/auth";
import { AlertTriangle, Trash, Pencil, X } from "lucide-react-native"; // <-- Import icons for buttons

const temperamentOptions = [
  "Playful",
  "Shy",
  "Reactive",
  "Loves Kids",
  "Good with Cats",
];

export default function Profile() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [pets, setPets] = useState<any[]>([]); // State to store pet profiles
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true); // Loading state for user profile data
  const [petsLoading, setPetsLoading] = useState(true); // Loading state for pet data
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);

  // State for custom alert modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"confirm" | "info">("info");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  // State for the edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [petToEdit, setPetToEdit] = useState<any | null>(null);
  const [editedPetName, setEditedPetName] = useState("");
  const [editedPetType, setEditedPetType] = useState("");
  const [editedBreed, setEditedBreed] = useState("");
  const [editedAge, setEditedAge] = useState("");
  const [editedGender, setEditedGender] = useState<"Male" | "Female" | null>(null);
  const [editedSpayedNeutered, setEditedSpayedNeutered] = useState(false);
  const [editedSelectedTags, setEditedSelectedTags] = useState<string[]>([]);
  const [editedPhotoUri, setEditedPhotoUri] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Function to show custom alert modal
  const showCustomAlert = (title: string, message: string, type: "confirm" | "info" = "info", onConfirm?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setOnConfirmAction(onConfirm || null);
    setModalVisible(true);
  };

  useEffect(() => {
    // Initialize storage and set up auth listener
    if (app) {
      setStorage(getStorage(app));
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const fetchUserProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUserEmail(currentUser.email);

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUsername(userData.username || "N/A");
          } else {
            console.log("No user data found in Firestore for this UID.");
            setUsername("N/A (Data not found)");
          }
        } catch (error: any) {
          console.error("Error fetching user data from Firestore:", error.message);
          setUsername("Error fetching username");
          setIsError(true);
          setMessage("Failed to load user profile.");
        } finally {
          setProfileLoading(false);
        }
      } else {
        router.replace('/(auth)/login');
      }
    };

    fetchUserProfile();
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const petsCollectionRef = collection(db, "users", currentUser.uid, "pets");
      
      const unsubscribePets = onSnapshot(petsCollectionRef, (querySnapshot) => {
        const fetchedPets: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPets.push({ id: doc.id, ...doc.data() });
        });
        setPets(fetchedPets);
        setPetsLoading(false);
      }, (error) => {
        console.error("Error fetching pet data with onSnapshot:", error);
        setIsError(true);
        setMessage("Failed to load pet profiles.");
        setPetsLoading(false);
      });

      return () => unsubscribePets();
    }
  }, []);

  const handleLogout = async () => {
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      await signOut(auth);
      setMessage("Logged out successfully! Redirecting to login...");
      setIsError(false);
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1500);
    } catch (error: any) {
      console.error("Firebase Logout Error:", error.message);
      setMessage(`Logout Failed: ${error.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePet = async (petId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showCustomAlert("Error", "You must be logged in to remove a pet.", "info");
      return;
    }

    showCustomAlert(
      "Confirm Deletion",
      "Are you sure you want to permanently remove this pet profile?",
      "confirm",
      async () => {
        try {
          const petDocRef = doc(db, "users", currentUser.uid, "pets", petId);
          await deleteDoc(petDocRef);
          showCustomAlert("Success", "Pet profile removed successfully.", "info");
        } catch (error: any) {
          console.error("Error removing pet:", error);
          showCustomAlert("Error", `Failed to remove pet: ${error.message}`, "info");
        }
      }
    );
  };

  const handleEditPet = (pet: any) => {
    setPetToEdit(pet);
    setEditedPetName(pet.petName);
    setEditedPetType(pet.petType);
    setEditedBreed(pet.breed);
    setEditedAge(pet.age.toString());
    setEditedGender(pet.gender);
    setEditedSpayedNeutered(pet.spayedNeutered);
    setEditedSelectedTags(pet.temperamentTags || []);
    setEditedPhotoUri(pet.photoURL || null);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !petToEdit || !db || !storage) {
      showCustomAlert("Error", "Authentication or Firebase services not ready.", "info");
      return;
    }

    if (!editedPetName || !editedPetType || !editedBreed || !editedAge || !editedGender) {
      showCustomAlert("Missing Information", "Please fill in all required fields.", "info");
      return;
    }

    setIsSavingEdit(true);
    let photoDownloadUrl: string | null = editedPhotoUri;

    try {
      if (editedPhotoUri && editedPhotoUri.startsWith('file://')) {
        // If the photo has been changed, upload the new one
        const response = await fetch(editedPhotoUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `users/${currentUser.uid}/pet_photos/${editedPetName}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        photoDownloadUrl = await getDownloadURL(storageRef);
      }

      const petDocRef = doc(db, "users", currentUser.uid, "pets", petToEdit.id);
      await updateDoc(petDocRef, {
        petName: editedPetName,
        petType: editedPetType,
        breed: editedBreed,
        age: parseInt(editedAge),
        gender: editedGender,
        spayedNeutered: editedSpayedNeutered,
        temperamentTags: editedSelectedTags,
        photoURL: photoDownloadUrl,
      });

      showCustomAlert("Success", "Pet profile updated successfully!", "info");
      setEditModalVisible(false);
    } catch (error) {
      console.error("Error saving pet profile:", error);
      showCustomAlert("Error", "Failed to save pet profile. Please try again.", "info");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const pickImageForEdit = async () => {
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
      setEditedPhotoUri(result.assets[0].uri);
    }
  };
  
  const toggleTagForEdit = (tag: string) => {
    setEditedSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    );
  };


  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 30 }} showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8">
          <Text className={`text-3xl font-bold mb-4 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
            Your Profile
          </Text>

          {profileLoading ? (
            <ActivityIndicator size="large" color={isDark ? "#93c5fd" : "#2563eb"} className="mb-6" />
          ) : (
            <>
              {userEmail && (
                <Text className={`text-xl mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                  Email: {userEmail}
                </Text>
              )}
              {username && (
                <Text className={`text-xl mb-6 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                  Username: {username}
                </Text>
              )}
              {!userEmail && !username && (
                <Text className={`text-xl mb-6 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                  User data not available.
                </Text>
              )}
            </>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={isDark ? "#93c5fd" : "#2563eb"} className="mb-6" />
          ) : (
            <Pressable onPress={handleLogout} className="bg-red-600 py-3 px-6 rounded-xl items-center mb-8">
              <Text className="text-white text-lg font-semibold">Logout</Text>
            </Pressable>
          )}

          {message ? (
            <Text className={`text-center ${isError ? "text-red-500" : "text-green-500"} mb-4`}>
              {message}
            </Text>
          ) : null}
        </View>

        {/* Pet Profiles Section */}
        <View className="w-full">
          <Text className={`text-2xl font-bold mb-4 ${isDark ? "text-slate-100" : "text-gray-900"}`}>
            Your Pets
          </Text>

          {petsLoading ? (
            <ActivityIndicator size="large" color={isDark ? "#93c5fd" : "#2563eb"} />
          ) : pets.length > 0 ? (
            pets.map((pet) => (
              <View
                key={pet.id}
                className={`rounded-xl p-4 mb-4 flex-row items-center ${
                  isDark ? "bg-slate-800" : "bg-gray-100"
                }`}
              >
                {pet.photoURL ? (
                  <Image
                    source={{ uri: pet.photoURL }}
                    className="w-20 h-20 rounded-full mr-4"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-20 h-20 rounded-full bg-gray-300 justify-center items-center mr-4">
                    <Text className="text-4xl">🐾</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className={`text-xl font-semibold ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                    {pet.petName}
                  </Text>
                  <Text className={`text-md ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    Type: {pet.petType}
                  </Text>
                  <Text className={`text-md ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    Breed: {pet.breed}
                  </Text>
                  <Text className={`text-md ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    Age: {pet.age}
                  </Text>
                  <Text className={`text-md ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    Gender: {pet.gender}
                  </Text>
                  {pet.temperamentTags && pet.temperamentTags.length > 0 && (
                    <Text className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                      Temperament: {pet.temperamentTags.join(", ")}
                    </Text>
                  )}
                  {/* Action buttons */}
                  <View className="flex-row mt-2">
                    <Pressable
                      onPress={() => handleEditPet(pet)}
                      className="flex-row items-center bg-blue-600 px-4 py-2 rounded-full mr-2"
                    >
                      <Pencil size={16} color="white" className="mr-1" />
                      <Text className="text-white text-sm font-semibold">Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemovePet(pet.id)}
                      className="flex-row items-center bg-red-600 px-4 py-2 rounded-full"
                    >
                      <Trash size={16} color="white" className="mr-1" />
                      <Text className="text-white text-sm font-semibold">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text className={`text-lg text-center ${isDark ? "text-slate-400" : "text-gray-600"}`}>
              No pet profiles found.
            </Text>
          )}

          {/* Link to Create Pet Profile */}
          <Pressable
            onPress={() => router.push("/(app)/create-pet-profile")}
            className={`bg-blue-600 py-3 rounded-xl items-center mt-6`}
          >
            <Text className="text-white text-lg font-semibold">
              + Add New Pet Profile
            </Text>
          </Pressable>
        </View>
      </ScrollView>

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
            <View className="flex-row items-center mb-6">
              {modalType === "confirm" && <AlertTriangle size={24} color="#f87171" className="mr-3"/>}
              <Text className={`text-base ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                {modalMessage}
              </Text>
            </View>
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
                  setModalVisible(false); // Always close modal on OK/Confirm
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

      {/* Pet Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
              <View className={`w-11/12 rounded-xl p-6 ${isDark ? "bg-slate-900" : "bg-white"}`}>
                <View className="flex-row justify-between items-center mb-6">
                  <Text className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                    Edit Pet Profile
                  </Text>
                  <Pressable onPress={() => setEditModalVisible(false)}>
                    <X size={24} color={isDark ? "#e2e8f0" : "#4b5563"} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                  {/* Photo Upload */}
                  <Pressable
                    onPress={pickImageForEdit}
                    className={`self-center mb-6 rounded-full border-4 ${isDark ? "border-slate-700" : "border-gray-300"
                      } justify-center items-center bg-gray-100 w-32 h-32`}
                  >
                    {editedPhotoUri ? (
                      <Image
                        source={{ uri: editedPhotoUri }}
                        className="w-32 h-32 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-5xl text-gray-400">🐾</Text>
                    )}
                  </Pressable>

                  {/* Pet Name */}
                  <TextInput
                    placeholder="Pet Name"
                    placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
                    value={editedPetName}
                    onChangeText={setEditedPetName}
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
                    value={editedPetType}
                    onChangeText={setEditedPetType}
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
                    value={editedBreed}
                    onChangeText={setEditedBreed}
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
                    value={editedAge}
                    onChangeText={setEditedAge}
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
                        onPress={() => setEditedGender(g as "Male" | "Female")}
                        className={`flex-1 rounded-lg border py-3 mx-1 items-center ${editedGender === g
                            ? "bg-blue-600 border-blue-600"
                            : isDark
                              ? "border-slate-700"
                              : "border-gray-300"
                          }`}
                      >
                        <Text
                          className={`font-semibold ${editedGender === g
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
                      value={editedSpayedNeutered}
                      onValueChange={setEditedSpayedNeutered}
                      trackColor={{ false: "#d1d5db", true: "#2563eb" }}
                      thumbColor={editedSpayedNeutered ? "#3b82f6" : "#f9fafb"}
                    />
                  </View>

                  {/* Temperament Tags */}
                  <Text
                    className={`text-lg font-semibold mb-3 ${isDark ? "text-slate-100" : "text-gray-900"
                      }`}
                  >
                    Temperament
                  </Text>
                  <View className="flex-row flex-wrap mb-6">
                    {temperamentOptions.map((tag) => {
                      const selected = editedSelectedTags.includes(tag);
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => toggleTagForEdit(tag)}
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
                </ScrollView>
                
                {/* Save Button */}
                <Pressable
                  onPress={handleSaveEdit}
                  className="bg-blue-600 py-4 rounded-xl items-center mt-4"
                  disabled={isSavingEdit}
                >
                  <Text className="text-white text-lg font-semibold">
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
