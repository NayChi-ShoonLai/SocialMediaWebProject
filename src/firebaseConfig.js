//src/firebaseConfig.js
import {
  initializeApp
} from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  setDoc,
  getDocs,
  getDoc,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import {
  getStorage
} from "firebase/storage";
import {
  getAuth, GoogleAuthProvider
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfBGOq51CSDivY0fMppjHSjR91Rx1khpU",
  authDomain: "library-app-adb32.firebaseapp.com",
  projectId: "library-app-adb32",
  storageBucket: "library-app-adb32.appspot.com",
  messagingSenderId: "75352869316",
  appId: "1:75352869316:web:8fdfa036aee941463bbc91",
  measurementId: "G-6MY8Z4YPSB",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

//  Function to search users by name (Real-Time Search)
export const searchUsersByName = async (searchTerm) => {
  if (!searchTerm.trim()) return [];

  try {
    const usersRef = collection(db, "users");
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((user) => user.username ?.toLowerCase().startsWith(lowercaseSearchTerm));
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

// ✅ Search Posts (By Content or Tags)
export const searchPostsByContentOrTags = async (searchTerm) => {
  try {
    const postsRef = collection(db, "posts");
    const querySnapshot = await getDocs(query(postsRef, orderBy("timestamp", "desc")));
    const lowerTerm = searchTerm.toLowerCase();

    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(
        (post) =>
        post.content ?.toLowerCase().includes(lowerTerm) ||
        post.tags ?.some((tag) => tag.toLowerCase().includes(lowerTerm))
      );
  } catch (error) {
    console.error("Error searching posts:", error);
    return [];
  }
};

// ✅ Fetch Recent Searches
export const getRecentSearches = async (limitResults = 5) => {
  try {
    const searchQuery = query(collection(db, "searchHistory"), orderBy("timestamp", "desc"), limit(limitResults));
    const querySnapshot = await getDocs(searchQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching recent searches:", error);
    return [];
  }
};

// ✅ Save Search Data
export const saveSearchData = async (searchTerm) => {
  if (!searchTerm.trim()) return;

  try {
    await addDoc(collection(db, "searchHistory"), {
      term: searchTerm,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error saving search:", error);
  }
};

// ✅ Delete an Individual Search Item
export const deleteSearchItem = async (searchId) => {
  try {
    await deleteDoc(doc(db, "searchHistory", searchId));
  } catch (error) {
    console.error("Error deleting search item:", error);
  }
};

// ✅ Clear All Search History
export const clearAllSearches = async () => {
  try {
    const searchQuery = await getDocs(collection(db, "searchHistory"));
    const batchDeletes = searchQuery.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(batchDeletes);
  } catch (error) {
    console.error("Error clearing search history:", error);
  }
};



// ✅ Save a Post
export const savePost = async (postId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    // Ensure we store only post ID references
    await updateDoc(userRef, {
      savedPosts: arrayUnion(postId),
    });

    console.log("Post saved successfully!");
  } catch (error) {
    console.error("Error saving post:", error);
  }
};


// ✅ Retrieve Saved Posts
// ✅ Retrieve Saved Posts Correctly
export const getSavedPosts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return [];

    let savedPostIds = userSnap.data().savedPosts || [];

    if (!Array.isArray(savedPostIds)) {
      console.error("❌ Invalid savedPosts format. Expected an array:", savedPostIds);
      return [];
    }

    const savedPosts = await Promise.all(
      savedPostIds.map(async (postId) => {
        try {
          const postRef = doc(db, "posts", postId);  // ✅ Fetch from 'posts' collection
          const postSnap = await getDoc(postRef);
          if (postSnap.exists()) {
            return { id: postId, ...postSnap.data() };  // ✅ Return full post details
          } else {
            console.warn(`⚠ Post ${postId} not found in Firestore`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Error fetching post ${postId}:`, error);
          return null;
        }
      })
    );

    return savedPosts.filter((post) => post !== null);  // ✅ Remove null values
  } catch (error) {
    console.error("❌ Error fetching saved posts:", error);
    return [];
  }
};




// ✅ Delete a single saved post properly
export const deleteSavedPost = async (postId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ User not authenticated.");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      savedPosts: arrayRemove(postId), // ✅ Remove post from savedPosts array
    });

    console.log(`🗑️ Deleted saved post: ${postId}`);
  } catch (error) {
    console.error("❌ Error deleting saved post:", error);
  }
};

// ✅ Clear all saved posts properly
export const clearAllSavedPosts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      savedPosts: [], // ✅ Clear all saved posts
    });

    console.log("🗑️ Cleared all saved posts.");
  } catch (error) {
    console.error("❌ Error clearing saved posts:", error);
  }
};



export {
  db,
  auth,
  storage,
  googleProvider,
  addDoc,
  collection,
  getDocs, setDoc, doc, where
};

