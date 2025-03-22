//src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc, onSnapshot, updateDoc, arrayUnion, increment, deleteDoc, setDoc ,serverTimestamp} from "firebase/firestore";

import { PiEnvelopeSimple, PiPencilSimple, PiUserCheckFill, PiTrashFill, PiPencil, PiUpload, PiTrash } from "react-icons/pi";
import { toast } from "react-toastify";
import { PiUser, PiGraduationCap, PiMapPin, PiBriefcase } from "react-icons/pi"; // ✅ Import modern icons

import {
    AiOutlineHeart,
    AiFillHeart,
    AiOutlineComment,
    AiOutlineShareAlt,
} from "react-icons/ai";
import { formatDistanceToNow } from "date-fns";
import { BsThreeDots } from "react-icons/bs";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination } from "swiper/modules";
import moment from "moment";
const Peofile1 = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likedPosts, setLikedPosts] = useState({});
    const [comments, setComments] = useState({});
    const [commentText, setCommentText] = useState({});
    const [hasStory, setHasStory] = useState(false); // ✅ State to check if user has an active story
    const [caption, setCaption] = useState("");
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followersList, setFollowersList] = useState([]);
    const [followingList, setFollowingList] = useState([]);

    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [filter, setFilter] = useState(""); // Store selected filter (grayscale, sepia, etc.)

    const [followingCount, setFollowingCount] = useState(0);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [storyFile, setStoryFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const [openPostMenu, setOpenPostMenu] = useState(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, "users", user.uid);
        const followingCollectionRef = collection(db, `users/${user.uid}/following`);
        //checkUserStory();
        //fetchStories();
        // ✅ Real-time listener for profile updates
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            }
        });

        // ✅ Real-time listener for following count updates
        const unsubscribeFollowing = onSnapshot(followingCollectionRef, async (querySnapshot) => {
            const newFollowingCount = querySnapshot.size;
            setFollowingCount(newFollowingCount);
            await updateDoc(userDocRef, { following: newFollowingCount });
        });
        const fetchFollowingAndFollowers = async () => {
            try {
                // Fetch Following List
                const followingRef = collection(db, `users/${user.uid}/following`);
                const followingSnapshot = await getDocs(followingRef);

                const followingData = await Promise.all(
                    followingSnapshot.docs.map(async (docSnap) => {
                        const userDoc = await getDoc(doc(db, "users", docSnap.id));
                        if (userDoc.exists()) {
                            return { id: docSnap.id, ...userDoc.data() };
                        }
                        return null;
                    })
                );

                setFollowingList(followingData.filter(Boolean)); // Filter out null values

                // Fetch Followers List
                const followersRef = collection(db, `users/${user.uid}/followers`);
                const followersSnapshot = await getDocs(followersRef);

                const followersData = await Promise.all(
                    followersSnapshot.docs.map(async (docSnap) => {
                        const userDoc = await getDoc(doc(db, "users", docSnap.id));
                        if (userDoc.exists()) {
                            return { id: docSnap.id, ...userDoc.data() };
                        }
                        return null;
                    })
                );

                setFollowersList(followersData.filter(Boolean)); // Filter out null values
            } catch (error) {
                console.error("Error fetching follow data:", error);
            }
        };

        fetchFollowingAndFollowers();
        // ✅ Fetch user posts with fresh URLs
        const fetchUserPosts = async () => {
            setLoading(true);
            try {
                const user = auth.currentUser;
                if (!user) return;
        
                const postsRef = collection(db, "posts");
                const q = query(postsRef, where("user.uid", "==", user.uid));
                const querySnapshot = await getDocs(q);
        
                const posts = [];
        
                for (const docSnap of querySnapshot.docs) {
                    const postData = docSnap.data();
                    const postId = docSnap.id;
                    if (postData.originalPostId) {
                        console.log(`🔴 Skipping shared post: ${postId}`);
                        continue;
                    }
                    console.log(`📢 Fetching post: ${postId}`);
        
                    // ✅ Avoid duplicate entries
                    if (posts.find(post => post.id === postId)) continue;
        
                    // ✅ Real-time listener for comments & likes
                    onSnapshot(doc(db, "posts", postId), (postSnapshot) => {
                        if (postSnapshot.exists()) {
                            const updatedPost = postSnapshot.data();
                            console.log(`🟢 Updated Comments for ${postId}:`, updatedPost.comments);
        
                            setComments((prev) => ({
                                ...prev,
                                [postId]: updatedPost.comments || [],
                            }));
                            setLikedPosts((prev) => ({
                                ...prev,
                                [postId]: updatedPost.likedBy?.includes(auth.currentUser?.uid) || false,
                            }));
                        }
                    });
        
                    // ✅ Retrieve Base64 Images & Filters from Firestore
                    const updatedPhotoUrls = postData.photoUrls
                        ? postData.photoUrls.map((base64, index) => ({
                            url: base64, // Base64 image
                            filter: postData.photoFilters?.[index] || { filter: "", brightness: 100, contrast: 100 },
                        }))
                        : [];
        
                    // ✅ Retrieve Base64 Videos & Filters from Firestore
                    const updatedVideoUrls = postData.videoUrls
                        ? postData.videoUrls.map((base64, index) => ({
                            url: base64, // Base64 video
                            filter: postData.videoFilters?.[index] || { filter: "", brightness: 100, contrast: 100 },
                        }))
                        : [];
        
                    // ✅ Store post with Base64 media & filters
                    posts.push({
                        id: postId,
                        ...postData,
                        photoUrls: updatedPhotoUrls,
                        videoUrls: updatedVideoUrls,
                        photoFilters: postData.photoFilters || [],
                        videoFilters: postData.videoFilters || [],
                    });
                }
        
                // ✅ Ensure no duplicate posts in state
                setUserPosts((prevPosts) => {
                    const uniquePosts = [...prevPosts, ...posts].reduce((acc, post) => {
                        if (!acc.some(p => p.id === post.id)) {
                            acc.push(post);
                        }
                        return acc;
                    }, []);
                    return uniquePosts;
                });
        
                console.log("🚀 Final Posts with Filters Applied:", posts);
            } catch (error) {
                console.error("❌ Error fetching user posts:", error);
            }
            setLoading(false);
        };
        
        
        

        fetchUserPosts();

        return () => {
            unsubscribeUser();
            unsubscribeFollowing();
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                openPostMenu !== null &&
                !event.target.closest(".post-options-menu") && // ✅ Fix: Check if clicked inside menu
                !event.target.closest(".three-dots-menu") // ✅ Fix: Allow clicks on 3 dots
            ) {
                console.log("❌ Click detected outside, closing menu");
                setOpenPostMenu(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openPostMenu]);

    const handleLike = async (postId) => {
        const user = auth.currentUser;
        if (!user) return;
    
        const postRef = doc(db, "posts", postId);
    
        try {
            // 🔹 Check if user already liked the post
            const postSnap = await getDoc(postRef);
            if (!postSnap.exists()) return;
            const postData = postSnap.data();
    
            const isLiked = postData.likedBy?.includes(user.uid); // ✅ Check if user has liked it
    
            // 🔹 Update UI **optimistically** for a fast response
            setUserPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId ? { ...post, likes: post.likes + (isLiked ? -1 : 1) } : post
                )
            );
    
            setLikedPosts((prev) => ({
                ...prev,
                [postId]: !isLiked,
            }));
    
            // 🔹 Update Firestore in the background
            await updateDoc(postRef, {
                likes: increment(isLiked ? -1 : 1), // ✅ Increase or decrease count
                likedBy: isLiked
                    ? postData.likedBy.filter(uid => uid !== user.uid) // Remove user from likes
                    : [...(postData.likedBy || []), user.uid], // Add user to likes
            });
    
            console.log(`✅ ${isLiked ? "Unliked" : "Liked"} post ${postId}`);
    
        } catch (error) {
            console.error("❌ Error updating like:", error);
        }
    };
    
    

   
    const handleComment = async (postId) => {
        if (!commentText[postId]?.trim()) return;
    
        const user = auth.currentUser;
        if (!user) return;
    
        const postRef = doc(db, "posts", postId);
        const newComment = {
            text: commentText[postId],
            user: {
                name: userData?.username || "Anonymous",
                profileImage: userData?.profileImage || "/defaultpic.jpg",
            },
            timestamp: new Date(), // ✅ Save Firestore timestamp
        };
    
        try {
            await updateDoc(postRef, {
                comments: arrayUnion(newComment), // ✅ Append comment to comments[]
            });
    
            setCommentText((prev) => ({ ...prev, [postId]: "" })); // ✅ Clear input field
    
            
    
            console.log(`✅ Comment added to post ${postId}`);
        } catch (error) {
            console.error("❌ Error adding comment:", error);
        }
    };
    

    if (loading) return <p>Loading profile...</p>;

    const handleStoryFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
    
        // ✅ Check if it's a video
        if (file.type.startsWith("video")) {
            reader.readAsDataURL(file); // Convert video to Base64
        } else {
            reader.readAsDataURL(file); // Convert image to Base64
        }
    
        reader.onload = () => {
            setStoryFile({
                name: file.name,
                type: file.type,
                base64: reader.result, // ✅ Store Base64 Data
                filter: {
                    filter,
                    brightness,
                    contrast
                }
            });
            setPreviewUrl(reader.result); // ✅ Show preview
        };
    
        reader.onerror = (error) => {
            console.error("Error converting file:", error);
            toast.error("Failed to process the file.");
        };
    };
    
    
    
    const handleDeletePreview = () => {
        setStoryFile(null);
        setPreviewUrl("");
    };

    const checkUserStory = async () => {
        const currentUser = auth.currentUser; // ✅ Ensure we get the current user
        if (!currentUser) return; // ✅ If no user, exit function

        const storiesRef = collection(db, `users/${currentUser.uid}/stories`);
        const querySnapshot = await getDocs(storiesRef);

        // ✅ If the user has a story, set `hasStory` to true
        setHasStory(!querySnapshot.empty);
    };
    checkUserStory();

    const handleUploadStory = async () => {
        if (!storyFile) {
            toast.error("Please select an image or video.");
            return;
        }
    
        const user = auth.currentUser;
        if (!user) return;
    
        try {
            await setDoc(doc(db, `users/${user.uid}/stories`, `${Date.now()}`), {
                userId: user.uid,
                username: userData?.username || "User",
                profileImage: userData?.profileImage || "/defaultpic.jpg",
                storyUrl: storyFile.base64, // ✅ Store Base64 Image or Video
                type: storyFile.type.startsWith("video") ? "video" : "image",
                timestamp: serverTimestamp(),
                filters: { // ✅ Save Filters in Firestore
                    filter, 
                    brightness,
                    contrast
                },
                caption: caption,
            });
            
    
            setHasStory(true);
            toast.success("Story uploaded successfully!");
            setShowStoryModal(false);
            setStoryFile(null);
            setPreviewUrl("");
        } catch (error) {
            console.error("❌ Error uploading story:", error);
            toast.error("Failed to upload story.");
        }
    };
    

    // const getFilterStyle = () => {
    //     let filterStyle = "";

    //     if (filter === "grayscale") filterStyle += "grayscale(100%) ";
    //     if (filter === "sepia") filterStyle += "sepia(100%) ";
    //     if (filter === "blur") filterStyle += "blur(5px) ";

    //     filterStyle += `brightness(${brightness}%) contrast(${contrast}%)`;
    //     return filterStyle.trim();
    // };

    const handleDeletePost = async (postId, photoUrls = [], videoUrls = []) => {
        try {
            console.log(`🗑️ Attempting to delete post: ${postId}`);

            // 🔹 1. Check if postId is valid
            if (!postId) {
                console.error("❌ No postId provided!");
                return;
            }

            // 🔹 2. Delete from Firestore
            await deleteDoc(doc(db, "posts", postId));
            console.log(`✅ Post ${postId} deleted from Firestore`);

            // 🔹 3. Delete associated files from Firebase Storage
            const deleteFile = async (filePath) => {
                try {
                    console.log(`🗂️ Attempting to delete file: ${filePath}`);
                    if (!filePath) {
                        console.error("❌ File path is undefined!");
                        return;
                    }
                    const fileRef = ref(storage, filePath); // ✅ Use correct reference
                    await deleteObject(fileRef);
                    console.log(`✅ Deleted file: ${filePath}`);
                } catch (error) {
                    console.error(`❌ Error deleting file: ${filePath}`, error);
                }
            };

            // 🔹 4. Make sure paths are correct
            console.log("🔍 Checking file paths before deletion:", { photoUrls, videoUrls });

            await Promise.all([
                ...photoUrls.map((photo) => deleteFile(photo?.path || photo)), // ✅ Handle undefined path
                ...videoUrls.map((video) => deleteFile(video?.path || video)),

            ]);

            console.log(`✅ All associated files deleted successfully.`);

            // 🔹 5. Remove post from UI
            setUserPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
            console.log("✅ UI updated: Post removed");

            toast.success("Post deleted successfully!");
        } catch (error) {
            console.error("❌ Error deleting post:", error);
            toast.error("Failed to delete post. Check console for errors.");
        }
    };

    const fetchStories = async () => {
        const user = auth.currentUser;
        if (!user) return;
    
        const storiesRef = collection(db, `users/${user.uid}/stories`);
        const querySnapshot = await getDocs(storiesRef);
    
        const now = Date.now();
        const cutoffTime = now - 24 * 60 * 60 * 1000; // 24 hours ago
    
        const validStories = [];
        const deletePromises = [];
    
        querySnapshot.forEach((docSnap) => {
            const storyData = docSnap.data();
            const storyTimestamp = storyData.timestamp.toMillis();
    
            if (storyTimestamp <= cutoffTime) {
                // ✅ Delete expired story
                deletePromises.push(deleteDoc(docSnap.ref));
                console.log(`Deleted expired story: ${storyData.storyUrl}`);
            } else {
                validStories.push({ id: docSnap.id, ...storyData });
            }
        });
    
        await Promise.all(deletePromises);
        setHasStory(validStories.length > 0);
    };
    
    const handleEditPost = (postId) => {
        console.log("Edit post:", postId);
        // Implement edit functionality here (e.g., open an edit modal)
    };

    const getFilterStyle1 = () => {
        let filterStyle = "";
    
        if (filter === "grayscale") filterStyle += "grayscale(100%) ";
        if (filter === "sepia") filterStyle += "sepia(100%) ";
        if (filter === "blur") filterStyle += "blur(5px) ";
    
        filterStyle += `brightness(${brightness}%) contrast(${contrast}%)`;
        return filterStyle.trim();
    };
    
    if (loading) return <p className="text-center text-lg">Loading profile...</p>;
    const getFilterStyle = (filters) => {
        if (!filters) return "";
    
        let filterStyle = "";
    
        if (filters.filter === "grayscale") filterStyle += "grayscale(100%) ";
        if (filters.filter === "sepia") filterStyle += "sepia(100%) ";
        if (filters.filter === "invert") filterStyle += "invert(100%) ";

    
        filterStyle += `brightness(${filters.brightness || 100}%) contrast(${filters.contrast || 100}%)`;
        return filterStyle.trim();
    };

    return (
        
    <div className="relative w-full p-6">
    <div className="mt-10">
        <div className="relative w-full p-6">
            <div className={`transition-all duration-300 ${showStoryModal ? "blur-md" : ""}`}>
                <div className="bg-gray-100 rounded-lg shadow-lg">
                <div
  className="relative w-full h-58 bg-cover bg-center"
  style={{
    backgroundImage: `url(${userData?.backgroundImage || "/defaultcover.jpg"})`, // ✅ Dynamically set background image
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>

                        <div className="p-6 -mt-12 flex items-center space-x-4">
                            <img
                                src={userData?.profileImage || "/defaultpic.jpg"}
                                alt="Profile"
                                className={`w-24 h-24 rounded-full border-4 ${hasStory ? "border-green-500" : "border-black"} shadow-md cursor-pointer mt-26`}
                                onClick={() => navigate("/stories")}
                            />

                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center">
                        {/* 🔹 Username (Left-Aligned) */}
                        <h1 className="text-2xl font-bold">{userData?.username || "User"}</h1>

                        {/* 🔹 Buttons (Right-Aligned) */}
                        <div className="flex space-x-3">
                            <button className="p-2 bg-gray-800 text-white rounded-full" onClick={() => navigate("/peofile1/edit")}>
                                <PiPencilSimple size={14} />
                            </button>
                            <button className="p-2 bg-gray-800 text-white rounded-full">
                                <PiEnvelopeSimple size={14} />
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded-full flex items-center"
                                onClick={() => setShowStoryModal(true)}
                            >
                                <PiUserCheckFill className="mr-2" size={18} />
                                Add to Story
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {/* 🔹 Bio */}
                        <div className="flex items-center text-gray-700">
                            <PiUser size={18} className="mr-2 text-gray-500" />
                            <p>{userData?.bio || "No bio available"}</p>
                        </div>

                        {/* 🔹 Education */}
                        <div className="flex items-center text-gray-700">
                            <PiGraduationCap size={18} className="mr-2 text-gray-500" />
                            <p>{userData?.education || "No education available"}</p>
                        </div>

                        {/* 🔹 Location */}
                        <div className="flex items-center text-gray-700">
                            <PiMapPin size={18} className="mr-2 text-gray-500" />
                            <p>{userData?.location || "No location available"}</p>
                        </div>

                        {/* 🔹 Work */}
                        <div className="flex items-center text-gray-700">
                            <PiBriefcase size={18} className="mr-2 text-gray-500" />
                            <p>{userData?.work || "No work available"}</p>
                        </div>
                    </div>
                    <div className="flex space-x-4 mt-2 cursor-pointer" onClick={() => setShowFollowModal(true)}>
                        <p><span className="font-bold">{followingCount}</span> Following</p>
                        <p><span className="font-bold">{userData?.followers || 0}</span> Followers</p>
                    </div>

                </div>


                <div className="mt-6">
                    <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
                    {userPosts.length === 0 ? (
                        <p className="text-gray-600">You haven't posted anything yet.</p>
                    ) : (
                        <div className="bg-black border border-gray-200 shadow-xl rounded-3xl p-6 sm:p-8 mb-6 transition-all transform hover:scale-[1.02] hover:shadow-2xl max-w-3xl mx-auto">
                            {userPosts.map((post, index) => (
                                <div key={post.id} className="bg-black p-4 shadow-lg rounded-lg">
                                    {/* User Info */}
                                    <div className="flex items-center justify-between w-full mb-3">
    {/* Left Side: Profile Image & User Info */}
    <div className="flex items-center space-x-3">
        <img
            src={userData?.profileImage || "/defaultpic.jpg"}
            alt="User Profile"
            className="w-10 h-10 rounded-full object-cover"
        />
        <div>
            <p className="font-semibold text-gray-800">{userData?.username || "User"}</p>
            <p className="text-gray-500 text-sm">
                {formatDistanceToNow(new Date(post.timestamp.seconds * 1000), { addSuffix: true })}
            </p>
        </div>
    </div>

    {/* Right Side: Visibility & Three Dots Menu */}
    <div className="flex items-center space-x-4">
        {/* Visibility Indicator */}
        {post.visibility === "public" ? (
            <span className="flex items-center text-gray-500 text-sm">
                🌍 <span className="ml-1">Public</span>
            </span>
        ) : (
            <span className="flex items-center text-gray-500 text-sm">
                👥 <span className="ml-1">Only Followers</span>
            </span>
        )}

        {/* Three Dots Menu */}
        <div className="relative">
            <BsThreeDots
                className="text-gray-600 cursor-pointer text-xl three-dots-menu"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpenPostMenu((prevIndex) => (prevIndex === index ? null : index));
                }}
            />
            {openPostMenu === index && (
                <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg p-2 w-32 z-10 post-options-menu">
                    <button
                        className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => navigate(`/create/${post.id}`)}
                    >
                        <PiPencil className="mr-2" />
                        Edit
                    </button>

                    <button
                        className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id, post.photoUrls, post.videoUrls);
                            setOpenPostMenu(null);
                        }}
                    >
                        <PiTrash className="mr-2" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    </div>
</div>


                                    {/* Post Content */}
                                    <p className="text-gray-800 mb-2">{post.content}</p>

                                   {/* Media Carousel */}
{/* Media Carousel */}
{/* Media Carousel */}
{(post.photoUrls?.length > 0 || post.videoUrls?.length > 0) && (
    <Swiper
        navigation
        pagination={{ clickable: true }}
        modules={[Navigation, Pagination]}
        className="w-full rounded-lg mt-2"
    >
        {post.photoUrls?.map((photo, index) => (
            <SwiperSlide key={index}>
                <img
                    src={photo.url}
                    alt="Post Image"
                    className="w-full h-100 object-cover rounded-lg"
                    style={{
                        filter: `
                            ${photo.filter?.filter || ""} 
                            brightness(${photo.filter?.brightness || 100}%)
                            contrast(${photo.filter?.contrast || 100}%)
                        `.trim()
                    }}
                />
            </SwiperSlide>
        ))}

        {post.videoUrls?.map((video, index) => (
            <SwiperSlide key={index}>
                <video
                    controls
                    className="w-full h-100 object-cover rounded-lg"
                    style={{
                        filter: `
                            ${video.filter?.filter || ""} 
                            brightness(${video.filter?.brightness || 100}%)
                            contrast(${video.filter?.contrast || 100}%)
                        `.trim()
                    }}
                >
                    <source src={video.url} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </SwiperSlide>
        ))}
    </Swiper>
)}


                                    {/* Attached Files */}
                                    {/* Like & Comment Section */}

                                    <div className="flex justify-between items-center mt-4 border-t pt-4">
                                        <button onClick={() => handleLike(post.id)} className="flex items-center space-x-2 text-gray-700 hover:text-red-500">
                                            {likedPosts[post.id] ? <AiFillHeart size={24} className="text-red-500" /> : <AiOutlineHeart size={24} />}
                                            <span>{post.likes || 0}</span>
                                        </button>
                                        <div className="flex items-center space-x-2 text-gray-700">
    <AiOutlineComment size={24} />
    <input
        type="text"
        value={commentText[post.id] || ""}
        onChange={(e) =>
            setCommentText((prev) => ({
                ...prev,
                [post.id]: e.target.value,
            }))
        }
        placeholder="Add a comment..."
        className="border rounded-lg p-2 text-sm w-48"
    />
    <button onClick={() => handleComment(post.id)} className="text-gray-700 hover:text-blue-500">
        Post
    </button>
</div>

                                        {/* ✅ Share Button (Newly Added) */}
                                        <button className="flex items-center space-x-2 text-gray-700 hover:text-green-500">
                                            <AiOutlineShareAlt size={24} />
                                            <span>{post.shares || 0}</span>
                                        </button>
                                    </div>

                                    {comments[post.id]?.length > 0 && (
    <div className="mt-4  p-3 rounded-lg shadow-sm bg-black">
        <h3 className="text-gray-600 font-semibold mb-2 bg-black">Comments</h3>
        {comments[post.id]?.length > 0 && (
    <div className="mt-4  p-3 rounded-lg shadow-sm bg-black">
        <h3 className="text-gray-600 font-semibold mb-2">Comments</h3>
        {comments[post.id].map((comment, index) => (
            <div key={index} className="flex items-center space-x-3 mb-2 bg-black">
                <img src={comment.user.profileImage || "/defaultpic.jpg"}
                    alt="User"
                    className="w-8 h-8 rounded-full border"
                />
                <p className="text-gray-700 text-sm">
                    <strong>{comment.user.name || "Anonymous"}</strong>: {comment.text}
                </p>
            </div>
        ))}
    </div>
)}

    </div>
)}

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {showStoryModal && (
                <div className="fixed inset-0 flex justify-center items-center bg-opacity-70 backdrop-blur-lg">
                    <div className="bg-black p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">Upload Story</h2>

                        <div className="mb-3 relative">
                        <div className="mb-3 relative">
                        {previewUrl && (
    <>
        <button
            onClick={handleDeletePreview}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10"
        >
            <PiTrashFill size={18} />
        </button>
        {storyFile.type.startsWith("video") ? (
            <video
                controls
                autoPlay
                playsInline
                loop
                muted
                className="w-full h-40 object-cover rounded-lg"
                style={{ filter: getFilterStyle1() }} // ✅ Ensures consistent size
            >
                <source src={previewUrl} type={storyFile.type} />
                Your browser does not support the video tag.
            </video>
        ) : (
            <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-40 object-cover rounded-lg"
                style={{ filter: getFilterStyle1() }} // ✅ Apply Filters
            />
        )}
    </>
)}

</div>


                        </div>
                        <input type="file" accept="image/*, video/*" onChange={handleStoryFileChange}
                            className="mb-3 p-2 border rounded-lg w-full" />

                        {/* Caption Input */}
                        <input type="text" placeholder="Add a caption..." value={caption} onChange={(e) => setCaption(e.target.value)}
                            className="mb-3 p-2 border rounded-lg w-full" />

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="mb-3 p-2 border rounded-lg w-full bg-black"
                        >
                            <option value="">No Filter</option>
                            <option value="grayscale">Grayscale</option>
                            <option value="sepia">Sepia</option>
                            <option value="blur">Blur</option>
                        </select>
                        <div className="mb-3">
                            <label className="block text-sm font-medium">Brightness</label>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                value={brightness}
                                onChange={(e) => setBrightness(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm font-medium">Contrast</label>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                value={contrast}
                                onChange={(e) => setContrast(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="flex justify-between">
                            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                                onClick={() => setShowStoryModal(false)}>
                                Cancel
                            </button>
                            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center"
                                onClick={handleUploadStory}>
                                <PiUpload className="mr-2" size={18} />
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showFollowModal && (
                <div className="fixed inset-0 bg-opacity-70 backdrop-blur-lg flex justify-center items-center">
                    <div className="bg-gray p-6 rounded-lg shadow-lg w-96 md:w-[600px]">
                        <h2 className="text-xl font-semibold text-center mb-4">Followers & Following</h2>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Left: Following */}
                            <div className="border-r pr-4">
                                <h3 className="text-lg font-semibold mb-2">Following</h3>
                                {followingList.length === 0 ? (
                                    <p className="text-gray-500">Not following anyone.</p>
                                ) : (
                                    followingList.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center mb-2 p-2 border rounded-lg cursor-pointer hover:bg-black transition"
                                            onClick={() => {
                                                navigate(`/peofile1/${user.id}`); // ✅ Navigate to the selected user's profile
                                                setShowFollowModal(false); // ✅ Close modal after navigating
                                            }}
                                        >
                                            <img src={user.profileImage  || "/defaultpic.jpg"} alt="User" className="w-10 h-10 rounded-full mr-3" />
                                            <p className="text-sm font-medium">{user.username || "Unknown"}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Right: Followers */}
                            <div className="pl-4">
                                <h3 className="text-lg font-semibold mb-2">Followers</h3>
                                {followersList.length === 0 ? (
                                    <p className="text-gray-500">No followers yet.</p>
                                ) : (
                                    followersList.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center mb-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-100 transition"
                                            onClick={() => {
                                                navigate(`/peofile1/${user.id}`); // ✅ Navigate to the selected user's profile
                                                setShowFollowModal(false); // ✅ Close modal after navigating
                                            }}
                                        >
                                            <img src={user.profileImage  || "/defaultpic.jpg"} alt="User" className="w-10 h-10 rounded-full mr-3" />
                                            <p className="text-sm font-medium">{user.username || "Unknown"}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="flex justify-end mt-4">
                            <button className="px-4 py-2 bg-gray-500 text-black rounded-lg" onClick={() => setShowFollowModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
        </div>
        </div>
    );
};

export default Peofile1;
