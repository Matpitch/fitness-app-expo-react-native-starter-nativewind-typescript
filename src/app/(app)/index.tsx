import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  Pressable,
  useColorScheme,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, Link } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
// Import all necessary firebase objects
import { app, auth, db } from "../../firebaseConfig";
import {
  Search,
  Bell,
  User,
  Heart,
  Smile,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  XCircle,
} from "lucide-react-native";

// Define a type for a post object
interface Post {
  id: string;
  authorId: string;
  authorName: string;
  petName: string;
  petType: string;
  content: string;
  timestamp: any; // Using any as the server timestamp is a special object
}

export default function HomePage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const iconColor = isDark ? "#f1f5f9" : "#111827";
  const mutedIconColor = isDark ? "#94a3b8" : "#6b7280";
  const iconSize = 22;

  // States for the custom alert modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"confirm" | "info">("info");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  // State for Firestore data
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // --- New states for the distress alert feature ---
  const [isDistressActive, setIsDistressActive] = useState(false);
  const [alertSentTime, setAlertSentTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const userName = "You";
  // --- End of new states ---

  // useEffect for handling authentication state.
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
      } else {
        router.replace("/(auth)/welcome");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  // useEffect for fetching data, depends on the userId.
  useEffect(() => {
    if (!userId || !app?.options?.appId) {
      console.log("Waiting for user authentication or app ID.");
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);

    const postsCollectionRef = collection(db, "artifacts", (db as any).app.options.appId, "public", "data", "posts");
    
    const unsubscribePosts = onSnapshot(postsCollectionRef, (querySnapshot) => {
      const fetchedPosts: Post[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPosts.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
      });
      fetchedPosts.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
      setPosts(fetchedPosts);
      setLoadingPosts(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoadingPosts(false);
    });

    return () => unsubscribePosts();
  }, [userId, app]);
  
  // --- New useEffect for the distress alert timer ---
  useEffect(() => {
    if (isDistressActive) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const secondsElapsed = Math.floor((now - alertSentTime) / 1000);
        const minutes = Math.floor(secondsElapsed / 60);
        const seconds = secondsElapsed % 60;
        
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        
        setElapsedTime(`${formattedMinutes}:${formattedSeconds}`);
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isDistressActive, alertSentTime]);
  // --- End of new useEffect ---

  const showCustomAlert = (title: string, message: string, type: "confirm" | "info" = "info", onConfirm?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setOnConfirmAction(onConfirm || null);
    setModalVisible(true);
  };

  const handleDistressAlert = () => {
    // Show the custom confirmation modal
    showCustomAlert(
      "Confirm Distress Alert",
      "Are you sure you want to send a distress alert? Your real-time location will be shared on the map.",
      "confirm",
      () => {
        // Upon confirmation, activate the distress state locally
        setIsDistressActive(true);
        setAlertSentTime(Date.now());
        setModalVisible(false); // Close the modal

        // And immediately navigate to the map page with the active state
        router.push({
          pathname: "/(app)/map",
          params: { distressActive: 'true' }
        });
      }
    );
  };

  // --- New function to cancel the distress alert ---
  const handleCancelDistress = () => {
    setIsDistressActive(false);
    setAlertSentTime(0);
    setElapsedTime('00:00');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  // --- End of new function ---

  const navigateToCreatePetProfile = () => {
    router.push("/(app)/create-pet-profile");
  };

  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      <View
        className={`h-14 flex-row justify-between items-center px-5 border-b ${
          isDark ? "border-slate-700" : "border-gray-200"
        }`}
      >
        <Text
          className={`text-xl font-bold ${
            isDark ? "text-slate-100" : "text-gray-900"
          }`}
        >
          PetConnect
        </Text>

        <View className="flex-row items-center space-x-6">
          <Pressable>
            <Search size={iconSize} color={iconColor} />
          </Pressable>

          <Pressable className="relative">
            <Bell size={iconSize} color={iconColor} />
            <View className="absolute -top-1 -right-2 bg-red-500 rounded-full px-1.5 min-w-[18px] h-4 justify-center items-center">
              <Text className="text-white text-xs font-bold text-center">3</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.push("/(app)/create-post")}
          className="bg-blue-600 rounded-xl py-4 mb-6 items-center"
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Text className="text-white font-semibold text-lg">+ Create New Post</Text>
        </Pressable>

        <Pressable
          className={`rounded-xl p-5 mb-6 ${
            isDark ? "bg-slate-700" : "bg-gray-100"
          }`}
          android_ripple={{
            color: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.1)",
          }}
        >
          <Text
            className={`font-semibold mb-1 ${
              isDark ? "text-slate-100" : "text-gray-900"
            }`}
          >
            Heads-Up Walking Schedule
          </Text>
          <Text className={`${isDark ? "text-slate-300" : "text-gray-600"}`}>
            View or set your walking schedules.
          </Text>
        </Pressable>

        {/* --- Conditional rendering for the distress alert UI --- */}
        {isDistressActive ? (
          <View className="w-full max-w-sm p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-950 mb-8 shadow-lg">
            <View className="flex-row items-center mb-2">
              <AlertCircle color="red" size={24} />
              <Text className="text-lg font-bold text-red-700 dark:text-red-300 ml-2">
                Distress Alert Active
              </Text>
            </View>
            <Text className="text-base text-gray-700 dark:text-gray-200">
              Time since alert: <Text className="font-bold">{elapsedTime}</Text>
            </Text>
            <Text className="text-base text-gray-700 dark:text-gray-200">
              Sent by: <Text className="font-bold">{userName}</Text>
            </Text>
            <Pressable
              onPress={handleCancelDistress}
              className="flex-row items-center justify-center mt-4 p-2 bg-red-600 rounded-md shadow-sm active:bg-red-700 transition-colors"
            >
              <XCircle color="white" size={20} />
              <Text className="text-base font-bold text-white ml-2">
                Cancel Alert
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleDistressAlert}
            className="flex-row items-center justify-center bg-red-600 rounded-xl py-4 mb-10"
            android_ripple={{ color: "rgba(0,0,0,0.2)" }}
          >
            <AlertCircle size={iconSize} color="white" />
            <Text className="text-white font-semibold ml-3 text-lg">
              Send Distress Alert
            </Text>
          </Pressable>
        )}
        {/* --- End of conditional rendering --- */}

        {loadingPosts ? (
          <ActivityIndicator size="large" color={isDark ? "#93c5fd" : "#2563eb"} />
        ) : (
          posts.map((post) => (
            <View
              key={post.id}
              className={`rounded-xl p-5 mb-6 ${
                isDark ? "bg-slate-700" : "bg-gray-100"
              }`}
            >
              <View className="flex-row items-center mb-4">
                <View
                  className="w-12 h-12 rounded-full bg-slate-500 justify-center items-center"
                  style={{ opacity: isDark ? 0.5 : 0.15 }}
                >
                  <User size={32} color={isDark ? "#94a3b8" : "#6b7280"} />
                </View>
                <View className="ml-4">
                  <Text
                    className={`font-semibold text-lg ${
                      isDark ? "text-slate-100" : "text-gray-900"
                    }`}
                  >
                    {post.authorName}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    {post.timestamp ? new Date(post.timestamp?.seconds * 1000).toLocaleString() : 'Just now'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-4">
                {post.petType === "Dog" ? (
                  <Smile size={36} color={isDark ? "#3b82f6" : "#2563eb"} />
                ) : (
                  <Heart size={36} color={isDark ? "#3b82f6" : "#2563eb"} />
                )}
                <Text
                  className={`ml-4 text-xl font-semibold ${
                    isDark ? "text-slate-100" : "text-gray-900"
                  }`}
                >
                  {post.petName} ({post.petType})
                </Text>
              </View>

              <Text
                className={`mb-5 ${
                  isDark ? "text-slate-100" : "text-gray-900"
                }`}
              >
                {post.content}
              </Text>

              <View className="flex-row space-x-10">
                <Pressable className="flex-row items-center space-x-2">
                  <ThumbsUp size={iconSize} color={mutedIconColor} />
                  <Text
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                      Like
                  </Text>
                </Pressable>
                <Pressable className="flex-row items-center space-x-2">
                  <MessageSquare size={iconSize} color={mutedIconColor} />
                  <Text
                    className={`text-sm ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                      Comment
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Pressable
          onPress={navigateToCreatePetProfile}
          className={`rounded-xl p-5 mt-6 mb-6 ${
            isDark ? "bg-slate-700" : "bg-gray-100"
          }`}
          android_ripple={{
            color: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.1)",
          }}
        >
          <Text
            className={`font-semibold text-lg text-center ${
              isDark ? "text-slate-100" : "text-gray-900"
            }`}
          >
            Create Pet Profile
          </Text>
        </Pressable>
      </ScrollView>

      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Custom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-8">
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
                  } else {
                    setModalVisible(false);
                  }
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
