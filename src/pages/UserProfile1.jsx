import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { getSavedPosts } from "../firebaseConfig";
import { PiEnvelopeSimple, PiUserCheckFill } from "react-icons/pi";
import { PiUser, PiGraduationCap, PiMapPin, PiBriefcase } from "react-icons/pi"; // ✅ Import modern icons
import { formatDistanceToNow } from "date-fns";
import { BsThreeDots } from "react-icons/bs";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import {
    AiOutlineHeart,
    AiFillHeart,
    AiOutlineComment,
    AiOutlineShareAlt,
} from "react-icons/ai";
import { Navigation, Pagination } from "swiper/modules";
import { PiFilePdf, PiFileText, PiFile } from "react-icons/pi";
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { toast } from "react-toastify";
import { arrayUnion, arrayRemove, increment } from "firebase/firestore";

const UserProfile1 = ({ handleFollowUpdate, followingList }) => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const currentUser = auth.currentUser;
    const [likedPosts, setLikedPosts] = useState({});
        const [comments, setComments] = useState({});
        const [commentText, setCommentText] = useState({});
    const [userData, setUserData] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [hasStory, setHasStory] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showFollowModal, setShowFollowModal] = useState(false);
const [followersList, setFollowersList] = useState([]);
const [profileFollowingList, setProfileFollowingList] = useState([]);

const [userPosts, setUserPosts] = useState([]);
const [loadingPosts, setLoadingPosts] = useState(true);
const [savedPosts, setSavedPosts] = useState([]);
useEffect(() => {
  if (!userId) return;

  const userDocRef = doc(db, "users", userId);

  // ✅ Real-time Listener for User Data
  const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
          setUserData(docSnap.data());
      }
  });

  // ✅ Real-time Listener for Following List (Users the profile user follows)
  const followingRef = collection(db, `users/${userId}/following`);
  const unsubscribeFollowing = onSnapshot(followingRef, async (snapshot) => {
      const followingData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
              const userRef = doc(db, "users", docSnap.id);
              const userSnap = await getDoc(userRef);
              return userSnap.exists() 
                  ? { id: docSnap.id, ...userSnap.data() } 
                  : { id: docSnap.id, username: "Unknown", profileImage: "/defaultpic.jpg" };
          })
      );
      setProfileFollowingList(followingData);
  });

  // ✅ Real-time Listener for Followers List (Users who follow the profile user)
  const followersRef = collection(db, `users/${userId}/followers`);
  const unsubscribeFollowers = onSnapshot(followersRef, async (snapshot) => {
      const followersData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
              const userRef = doc(db, "users", docSnap.id);
              const userSnap = await getDoc(userRef);
              return userSnap.exists() 
                  ? { id: docSnap.id, ...userSnap.data() } 
                  : { id: docSnap.id, username: "Unknown", profileImage: "/defaultpic.jpg" };
          })
      );

      setFollowersList(followersData);
      setIsFollowing(followersData.some(follower => follower.id === auth.currentUser?.uid)); // ✅ Check if current user is a follower
  });

  // ✅ Real-time Listener for User’s Posts
  const postsRef = collection(db, "posts");
  const unsubscribePosts = onSnapshot(postsRef, async (snapshot) => {
      const allPosts = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
      }));

      // 🔹 Filter posts based on visibility
      const filteredPosts = allPosts.filter(post => {
          if (post.user.uid !== userId) return false; // 🔥 Only show this user's posts

          if (post.visibility === "public") return true; // 🌍 Public posts are always visible

          // 🔥 Followers-only posts are only visible to followers
          return post.visibility === "followers" && followersList.some(follower => follower.id === auth.currentUser?.uid);
      });

      const updatedPosts = await Promise.all(
        filteredPosts.map(async (post) => {
            // 🔹 Process Photos
            const updatedPhotoUrls = post.photoUrls
                ? post.photoUrls.map((photo, index) => ({
                      url: photo.startsWith("data:image") ? photo : `/default-image.jpg`, // ✅ Check if it's Base64
                      filter: post.photoFilters?.[index] || { filter: "", brightness: 100, contrast: 100 }, // ✅ Ensure filter exists
                  }))
                : [];
    
            // 🔹 Process Videos
            const updatedVideoUrls = post.videoUrls
                ? post.videoUrls.map((video, index) => ({
                      url: video.startsWith("data:video") ? video : `/default-video.jpg`, // ✅ Check if it's Base64
                      filter: post.videoFilters?.[index] || { filter: "", brightness: 100, contrast: 100 }, // ✅ Ensure filter exists
                  }))
                : [];
    
            // 🔹 Real-time listener for comments & likes
            const postRef = doc(db, "posts", post.id);
            onSnapshot(postRef, (postSnap) => {
                if (postSnap.exists()) {
                    setComments((prev) => ({
                        ...prev,
                        [post.id]: postSnap.data().comments || [],
                    }));
                     const updatedLikes = {};
    updatedPosts.forEach((post) => {
      updatedLikes[post.id] = post.likedBy?.includes(auth.currentUser?.uid) || false;
    });
    setLikedPosts(updatedLikes);
                }
            });
    
            return { ...post, photoUrls: updatedPhotoUrls, videoUrls: updatedVideoUrls };
        })
    );
    

    setUserPosts(updatedPosts);
    setLoadingPosts(false);
});


const fetchSavedPosts = async () => {
    const savedPostsData = await getSavedPosts();
    setSavedPosts(savedPostsData.map(post => post.id)); // Store only post IDs
};

fetchSavedPosts();

  // ✅ Real-time Listener for Stories
  const storyRef = collection(db, `users/${userId}/stories`);
  const unsubscribeStories = onSnapshot(storyRef, (storySnapshot) => {
      setHasStory(!storySnapshot.empty);
  });

  setLoading(false); // ✅ Stop loading after all listeners are set

  // ✅ Cleanup listeners when component unmounts
  return () => {
      unsubscribeUser();
      unsubscribeFollowing();
      unsubscribeFollowers();
      unsubscribePosts();
      unsubscribeStories();
  };
}, [userId, followersList]); // ✅ Refetch when userId or followers change

// ✅ Fetch again when `userId` changes
  

  const handleFollowToggle = async () => {
    if (!currentUser) return alert("You need to be logged in to follow!");

    const currentUserRef = doc(db, "users", currentUser.uid);
    const profileUserRef = doc(db, "users", userId);
    const followingRef = doc(db, `users/${currentUser.uid}/following`, userId);
    const followerRef = doc(db, `users/${userId}/followers`, currentUser.uid);
    const notificationsRef = doc(db, `users/${userId}/notifications`, currentUser.uid);

    const isCurrentlyFollowing = followingList.includes(userId);

    try {
        const currentUserSnap = await getDoc(currentUserRef);
        const currentUsername = currentUserSnap.exists() ? currentUserSnap.data().username : "Someone";

        if (isCurrentlyFollowing) {
            // 🔥 Unfollow User
            await deleteDoc(followingRef);
            await deleteDoc(followerRef);
            await updateDoc(profileUserRef, { followers: Math.max((userData?.followers || 0) - 1, 0) });
            await updateDoc(currentUserRef, { following: Math.max((userData?.following || 0) - 1, 0) });
            await deleteDoc(notificationsRef);

            setIsFollowing(false);
            handleFollowUpdate(userId, false); // 🔥 Sync with Sidebar

        } else {
            // 🔥 Follow User & Send Notification
            await setDoc(followingRef, { followedAt: new Date() });
            await setDoc(followerRef, { userId: currentUser.uid });
            await updateDoc(profileUserRef, { followers: (userData?.followers || 0) + 1 });
            await updateDoc(currentUserRef, { following: (userData?.following || 0) + 1 });

            setIsFollowing(true);
            handleFollowUpdate(userId, true); // 🔥 Sync with Sidebar

            // ✅ Save Notification for the followed user
            await setDoc(notificationsRef, {
                senderId: currentUser.uid,
                senderUsername: currentUsername,
                message: "started following you.",
                timestamp: new Date(),
                seen: false,
            });
        }
    } catch (error) {
        console.error("Error updating follow status:", error);
    }
};
const handleLike = async (postId) => {
    const user = auth.currentUser;
    if (!user) return;

    const postRef = doc(db, "posts", postId);
    const isLiked = likedPosts[postId];

    try {
        // ✅ Optimistically Update UI (instant feedback)
        setLikedPosts((prev) => ({
            ...prev,
            [postId]: !isLiked,
        }));

        setUserPosts((prevPosts) =>
            prevPosts.map((post) =>
                post.id === postId
                    ? { ...post, likes: isLiked ? post.likes - 1 : post.likes + 1 }
                    : post
            )
        );

        // ✅ Firestore Update
        await updateDoc(postRef, {
            likes: increment(isLiked ? -1 : 1),
            likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        });

    } catch (error) {
        console.error("Error updating like:", error);
    }
};

    const handleComment = async (postId) => {
        if (!commentText[postId]?.trim()) return;
    
        const user = auth.currentUser;
        if (!user) return;
    
        // ✅ Get the logged-in user's data
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.exists() ? userSnap.data() : null;
    
        const postRef = doc(db, "posts", postId);
        const newComment = {
            text: commentText[postId],
            user: {
                name: userData?.username || "Anonymous",
                profileImage: userData?.profileImage || "/defaultpic.jpg",
            },
            timestamp: new Date(),
        };
    
        try {
            await updateDoc(postRef, {
                comments: arrayUnion(newComment),
            });
    
            // ✅ Update UI instantly
            setComments((prev) => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment],
            }));
    
            // ✅ Clear input field after commenting
            setCommentText((prev) => ({
                ...prev,
                [postId]: "",
            }));
    
            console.log(`✅ Comment added by ${userData?.username || "Anonymous"} on post ${postId}`);
    
        } catch (error) {
            console.error("❌ Error adding comment:", error);
        }
    };
    

    if (loading) return <p className="text-center text-lg">Loading profile...</p>;
    const getFilterStyle = (filters) => {
        if (!filters) return "";
    
        let filterStyle = "";
    
        if (filters.filter?.includes("grayscale")) filterStyle += `grayscale(100%) `;
        if (filters.filter?.includes("sepia")) filterStyle += `sepia(100%) `;
        if (filters.filter?.includes("invert")) filterStyle += `invert(100%) `;
        if (filters.filter?.includes("blur")) filterStyle += `blur(5px) `; // Example blur filter
    
        filterStyle += `brightness(${filters.brightness || 100}%) contrast(${filters.contrast || 100}%)`;
        
        return filterStyle.trim();
    };
    const handleSavePost = async (postId) => {
        if (!auth.currentUser) {
            toast.error("You need to log in first!");
            return;
        }

        const userRef = doc(db, "users", auth.currentUser.uid);

        try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return;

            let updatedSavedPosts;

            if (savedPosts.includes(postId)) {
                // 🔥 Unsave Post
                await updateDoc(userRef, {
                    savedPosts: arrayRemove(postId),
                });
                updatedSavedPosts = savedPosts.filter(id => id !== postId);
                toast.info("Post unsaved successfully!", { position: "top-right", autoClose: 2000 });
            } else {
                // 🔥 Save Post
                await updateDoc(userRef, {
                    savedPosts: arrayUnion(postId),
                });
                updatedSavedPosts = [...savedPosts, postId];
                toast.success("Post saved successfully!", { position: "top-right", autoClose: 2000 });
            }

            setSavedPosts(updatedSavedPosts);

            // ✅ Dispatch event to update saved posts in SearchBar.jsx
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("savedPostsUpdated"));
            }
        } catch (error) {
            console.error("Error updating saved posts:", error);
        }
    };
    return (
        <div className="relative w-full p-6">
            <div className="mt-15">
            <div className="bg-gray-100 rounded-lg shadow-lg">
                <div
                    className="relative w-full h-58 bg-cover bg-center"
                    style={{ backgroundImage: `url(${userData?.backgroundImage || "/defaultcover.jpg"})` }}
                >
                    <div className="p-6 -mt-12 flex items-center space-x-4">
                        {/* ✅ Profile Picture with Green Border if User has Story */}
                        <img
                            src={userData?.profileImage || "/defaultpic.jpg"}
                            alt="Profile"
                            className={`w-24 h-24 rounded-full border-4 ${
                                hasStory ? "border-green-500" : "border-gray-300"
                            } shadow-md cursor-pointer  mt-26`}
                            onClick={() => hasStory && navigate(`/user-stories/${userId}`)}
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
                        <button className="p-2 bg-gray-800 text-white rounded-full">
                            <PiEnvelopeSimple size={14} />
                        </button>
                        <button 
                            className={`px-4 py-2 rounded-full flex items-center ${isFollowing ? "bg-gray-400" : "bg-blue-500"} text-white`}
                            onClick={handleFollowToggle}
                        >
                            <PiUserCheckFill className="mr-2" size={18} />
                            {isFollowing ? "Following" : "Follow"}
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
    <p><span className="font-bold">{userData?.following || 0}</span> Following</p>
    <p><span className="font-bold">{userData?.followers || 0}</span> Followers</p>
</div>

            </div>
            {/* 🔹 User's Posts Section */}

<div className="mt-6">
  <h2 className="text-2xl font-bold mb-4">{userData?.username}'s Posts</h2>
  {userPosts.length === 0 ? (
    <p className="text-gray-600">No posts yet.</p>
  ) : (
    <div className="bg-black border border-gray-200 shadow-xl rounded-3xl p-6 sm:p-8 mb-6 transition-all transform hover:scale-[1.02] hover:shadow-2xl max-w-3xl mx-auto">
      {userPosts.map((post, index) => (
        <div key={post.id} className="bg-black p-4 shadow-lg rounded-lg">
          
          {/* 🔹 User Info */}
          
    {/* Left Side: Profile Image & User Info */}
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

    {/* Right Side: Visibility */}
    <div className="flex items-center text-gray-500 text-sm">
        {post.visibility === "public" ? (
            <span className="flex items-center">
                🌍 <span className="ml-1">Public</span>
            </span>
        ) : (
            <span className="flex items-center">
                👥 <span className="ml-1">Only Followers</span>
            </span>
        )}
    </div>
</div>




          {/* 🔹 Post Content */}
          <p className="text-gray-800 mb-2">{post.content}</p>

          <Swiper navigation pagination={{ clickable: true }} modules={[Navigation, Pagination]} className="w-full rounded-lg mt-2">
    {post.photoUrls?.map((photo, idx) => (
        <SwiperSlide key={idx}>
            <img
                src={photo.url}
                alt="Post Image"
                className="w-full h-100 object-cover rounded-lg"
                style={{
                    filter: getFilterStyle(photo.filter), // ✅ Apply Correct Filter
                }}
            />
        </SwiperSlide>
    ))}
    {post.videoUrls?.map((video, idx) => (
        <SwiperSlide key={idx}>
            <video
                controls
                className="w-full h-100 object-cover rounded-lg"
                style={{
                    filter: getFilterStyle(video.filter), // ✅ Apply Correct Filter
                }}
            >
                <source src={video.url} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </SwiperSlide>
    ))}
</Swiper>



          {/* 🔹 Like & Comment Section */}
          <div className="flex justify-between items-center mt-4 border-t pt-4">
    <button onClick={() => handleLike(post.id)} className="flex items-center space-x-2 text-gray-700 hover:text-red-500">
        {likedPosts[post.id] ? <AiFillHeart size={24} className="text-red-500" /> : <AiOutlineHeart size={24} />}
        <span>{post.likes || 0}</span>
    </button>

    {/* ✅ Comment Input */}
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

    {/* ✅ Share Button */}
           {/* ✅ Save Button */}
           <button
                                        className="flex items-center space-x-2 text-gray-700 hover:text-yellow-500"
                                        onClick={() => handleSavePost(post.id)}
                                    >
                                        {savedPosts.includes(post.id) ? (
                                            <span className="text-yellow-500">★ Saved</span>
                                        ) : (
                                            <span>☆ Save</span>
                                        )}
                                    </button>
                                      {/* ✅ Share Button */}
                                      <button className="flex items-center space-x-2 text-gray-700 hover:text-green-500">
                                        <AiOutlineShareAlt size={24} />
                                        <span>{post.shares || 0}</span>
                                    </button>
</div>

                                             {comments[post.id]?.length > 0 && (
    <div className="mt-4 bg-black p-3 rounded-lg shadow-sm">
        <h3 className="text-gray-600 font-semibold mb-2">Comments</h3>
        {comments[post.id].map((comment, index) => (
            <div key={index} className="flex items-center space-x-3 mb-2">
                <img
                    src={comment.user.profileImage || "/defaultpic.jpg"}
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
      ))}
    </div>
  )}
</div>



            {showFollowModal && (
    <div className="fixed inset-0  bg-opacity-70 backdrop-blur-lg flex justify-center items-center">
        <div className="bg-gray p-6 rounded-lg shadow-lg w-96 md:w-[600px]">
            <h2 className="text-xl font-semibold text-center mb-4">Followers & Following</h2>

            <div className="grid grid-cols-2 gap-4">
                {/* Left: Following */}
                
{/* Left: Following */}
<div className="border-r pr-4">
    <h3 className="text-lg font-semibold mb-2">Following</h3>
    {profileFollowingList.length === 0 ? (
        <p className="text-gray-500">Not following anyone.</p>
    ) : (
        profileFollowingList.map(user => (
            <div 
                key={user.id} 
                className="flex items-center mb-2 p-2 border rounded-lg cursor-pointer hover:bg-black  transition"
                onClick={() => {
                    if (user.id === currentUser?.uid) {
                        navigate(`/peofile1`); // ✅ Go to logged-in user's profile
                    } else {
                        navigate(`/peofile1/${user.id}`); // ✅ Go to selected user's profile
                    }
                    setShowFollowModal(false);
                }}
            >
                <img src={user.profileImage || "/defaultpic.jpg"} alt="User" className="w-10 h-10 rounded-full mr-3" />
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
                    if (user.id === currentUser?.uid) {
                        navigate(`/peofile1`); // ✅ Go to logged-in user's profile
                    } else {
                        navigate(`/peofile1/${user.id}`); // ✅ Go to selected user's profile
                    }
                    setShowFollowModal(false);
                }}
            >
                <img src={user.profileImage || "/defaultpic.jpg"} alt="User" className="w-10 h-10 rounded-full mr-3" />
                <p className="text-sm font-medium">{user.username || "Unknown"}</p>
            </div>
        ))
    )}
</div>


            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-4">
                <button className="px-4 py-2 bg-gray-500 text-white rounded-lg" onClick={() => setShowFollowModal(false)}>
                    Close
                </button>
            </div>
        </div>
    </div>
)}

        </div>
        </div>

        
    );
};

export default UserProfile1;
