// app/(app)/create-post.tsx
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  Pressable,
  useColorScheme,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import {
  doc,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { X, Send } from "lucide-react-native";

// Define a type for the user data
interface UserData {
  username: string;
  email: string;
}

// Define a type for the pet data
interface PetData {
  petName: string;
  petType: string;
}

export default function CreatePostPage() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();

  const [postContent, setPostContent] = useState("");
  const [isSendingPost, setIsSendingPost] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [petData, setPetData] = useState<PetData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);

  const iconColor = isDark ? "#f1f5f9" : "#111827";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        try {
          // Fetch the user's profile data
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
          } else {
            console.log("No user data found!");
          }

          // Fetch the first pet profile for the user
          const petsCollectionRef = collection(db, "users", currentUser.uid, "pets");
          const petDocsSnap = await getDocs(petsCollectionRef);
          if (!petDocsSnap.empty) {
            setPetData(petDocsSnap.docs[0].data() as PetData);
          } else {
            console.log("No pet data found!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Failed to load user and pet data. Please try again.");
        } finally {
          setLoadingUserData(false);
        }
      } else {
        router.replace("/(auth)/welcome");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert("Error", "Please write something before posting!");
      return;
    }

    // Check that all required user and pet data is available
    if (!userId || !userData || !userData.username || !petData || !petData.petName || !petData.petType) {
      Alert.alert("Error", "Cannot create a post. Please ensure your user and pet profiles are fully set up.");
      console.error("Post creation failed due to missing user or pet data.", { userId, userData, petData });
      return;
    }

    setIsSendingPost(true);
    try {
      // Create the correct collection reference for the public feed
      const postsCollectionRef = collection(db, "artifacts", (db as any).app.options.appId, "public", "data", "posts");
      
      await addDoc(postsCollectionRef, {
        authorId: userId,
        authorName: userData.username,
        petName: petData.petName,
        petType: petData.petType,
        content: postContent,
        timestamp: serverTimestamp(),
      });
      setPostContent(""); // Clear the input field
      Alert.alert("Success", "Post created successfully!");
      // Fix: Navigate to the correct root path
      router.replace("/");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsSendingPost(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      <View
        className={`h-14 flex-row justify-between items-center px-5 border-b ${
          isDark ? "border-slate-700" : "border-gray-200"
        }`}
      >
        {/* Fix: Navigate to the correct root path */}
        <Pressable onPress={() => router.replace("/")}>
          <X size={24} color={iconColor} />
        </Pressable>
        <Text
          className={`text-xl font-bold ${
            isDark ? "text-slate-100" : "text-gray-900"
          }`}
        >
          Create Post
        </Text>
        <Pressable
          onPress={handleCreatePost}
          disabled={isSendingPost || !postContent.trim() || loadingUserData}
          className={`px-4 py-2 rounded-xl ${
            (isSendingPost || !postContent.trim() || loadingUserData) ? "bg-blue-400" : "bg-blue-600"
          }`}
        >
          {isSendingPost ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center">
              <Send size={20} color="white" className="mr-2" />
              <Text className="text-white text-lg font-semibold">
                Post
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <View className="flex-1 p-5">
        {loadingUserData ? (
          <ActivityIndicator size="large" color={isDark ? "#93c5fd" : "#2563eb"} />
        ) : (
          <TextInput
            placeholder="What's on your mind?"
            placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"}
            multiline
            value={postContent}
            onChangeText={setPostContent}
            className={`flex-1 text-lg rounded-xl p-4 ${
              isDark ? "bg-slate-700 text-slate-100" : "bg-gray-100 text-gray-900"
            }`}
            textAlignVertical="top"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
