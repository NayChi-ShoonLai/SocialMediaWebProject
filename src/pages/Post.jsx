
import React, { useState, useEffect, useRef } from "react";
import {
    AiOutlineHeart,
    AiFillHeart,
    AiOutlineComment,
    AiOutlineShareAlt,
} from "react-icons/ai";
import { BsThreeDots } from "react-icons/bs";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination } from "swiper/modules";
import moment from "moment";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { PiEnvelopeSimple, PiPencilSimple, PiUserCheckFill, PiTrashFill, PiPencil, PiUpload ,PiTrash} from "react-icons/pi";
import { PiUser, PiGraduationCap, PiMapPin, PiBriefcase } from "react-icons/pi"; // ✅ Import modern icons


import {
    doc,
    updateDoc,
    increment,
    arrayUnion,
    arrayRemove,
    getDoc,
    setDoc,
    addDoc,
    collection,
    deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

const Post = ({ post }) => {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(post.likes || 0);
    const [comments, setComments] = useState(post.comments || []);
    const [shares, setShares] = useState(post.shares || 0);
    const [postTime, setPostTime] = useState("");
    const [commentText, setCommentText] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hidden, setHidden] = useState(false); // ✅ Track if the post is hidden
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (post.timestamp) {
            setPostTime(moment(post.timestamp.toDate()).fromNow());
        }

        const fetchUserInfo = async () => {
            if (auth.currentUser) {
                const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userDoc.exists()) {
                    setCurrentUser(userDoc.data());
                }
            }
        };

        fetchUserInfo();
    }, [post.timestamp]);

    // ✅ Fetch Liked Users
    useEffect(() => {
        const fetchLikedUsers = async () => {
            if (post.likedBy) {
                const users = await Promise.all(
                    post.likedBy.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, "users", uid));
                        return userDoc.exists() ? { id: uid, ...userDoc.data() } : null;
                    })
                );
                setLikedBy(users.filter(Boolean));
            }
        };

        fetchLikedUsers();
    }, [post.likedBy]);

    const handleLike = async () => {
        if (!auth.currentUser) {
            console.error("User not logged in");
            return;
        }
    
        try {
            const postRef = doc(db, "posts", post.id);
            const postSnap = await getDoc(postRef);
    
            if (!postSnap.exists()) return;
    
            const postData = postSnap.data();
            const userLiked = postData.likedBy?.includes(auth.currentUser.uid);
    
            await updateDoc(postRef, {
                likes: userLiked ? increment(-1) : increment(1),
                likedBy: userLiked
                    ? arrayRemove(auth.currentUser.uid) // Remove user if already liked
                    : arrayUnion(auth.currentUser.uid) // Add user if not liked
            });
    
            setLiked(!liked);
            setLikes((prev) => (liked ? prev - 1 : prev + 1));
    
            // ✅ Send notification if user likes someone else's post
            if (!userLiked && post.user?.uid !== auth.currentUser.uid) {
                const notificationRef = doc(db, `users/${post.user.uid}/notifications`, `${post.id}_like_${auth.currentUser.uid}`);
                await setDoc(notificationRef, {
                    type: "like",
                    senderId: auth.currentUser.uid,
                    senderUsername: currentUser?.username || auth.currentUser.displayName || "Unknown",
                    senderProfileImage: currentUser?.profileImage || "/defaultpic.jpg",
                    postId: post.id,
                    timestamp: new Date(),
                    seen: false,
                    message: "liked your post.",
                });
            }
        } catch (error) {
            console.error("Error updating like:", error);
        }
    };
    
    const handleComment = async () => {
        if (!auth.currentUser || !commentText.trim()) {
            return;
        }
    
        try {
            const postRef = doc(db, "posts", post.id);
            const newComment = {
                text: commentText,
                userId: auth.currentUser.uid, // ✅ Store user ID for tracking
                user: {
                    name: currentUser?.username || auth.currentUser.displayName || "Unknown",
                    profileImage: currentUser?.profileImage || "/defaultpic.jpg",
                },
                timestamp: new Date(),
            };
    
            await updateDoc(postRef, {
                comments: arrayUnion(newComment),
            });
    
            setComments([...comments, newComment]);
            setCommentText("");
    
            // ✅ Send notification if commenting on someone else's post
            if (post.user?.uid !== auth.currentUser.uid) {
                const notificationRef = doc(db, `users/${post.user.uid}/notifications`, `${post.id}_comment_${auth.currentUser.uid}`);
                await setDoc(notificationRef, {
                    type: "comment",
                    senderId: auth.currentUser.uid,
                    senderUsername: currentUser?.username || auth.currentUser.displayName || "Unknown",
                    senderProfileImage: currentUser?.profileImage || "/defaultpic.jpg",
                    postId: post.id,
                    timestamp: new Date(),
                    seen: false,
                    message: "commented on your post.",
                });
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };
    

    // ✅ Delete a Comment
    const handleDeleteComment = async (commentId) => {
        if (!auth.currentUser) return;

        try {
            const postRef = doc(db, "posts", post.id);
            const updatedComments = comments.filter((c) => c.id !== commentId);

            await updateDoc(postRef, {
                comments: updatedComments,
            });

            setComments(updatedComments);
            toast.success("Comment deleted.");
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("Failed to delete comment.");
        }
    };


    const handleShare = async () => {
        if (!auth.currentUser) {
            console.error("User not logged in");
            return;
        }
    
        try {
            const postRef = doc(db, "posts", post.id);
            await updateDoc(postRef, {
                shares: increment(1),
            });
    
            setShares((prev) => prev + 1);
    
            const originalPostDoc = await getDoc(postRef);
            if (!originalPostDoc.exists()) {
                console.error("Original post not found");
                return;
            }
            const originalPostData = originalPostDoc.data();
    
            const sharedPost = {
                originalPostId: post.id,
                shared: true,
                timestamp: new Date(),
                user: {
                    uid: auth.currentUser.uid,
                    name: currentUser?.username || auth.currentUser.displayName || "",
                    profileImage: currentUser?.profileImage || "/defaultpic.jpg",
                },
                originalPost: {
                    user: originalPostData.user,
                    content: originalPostData.content,
                    photoUrls: originalPostData.photoUrls || [],
                    videoUrls: originalPostData.videoUrls || [],
                    fileUrls: originalPostData.fileUrls || [],
                    tags: originalPostData.tags || [],
                    timestamp: originalPostData.timestamp,
    
                    // ✅ **Now Including Filters**
                    photoFilters: originalPostData.photoFilters || [],
                    videoFilters: originalPostData.videoFilters || [],
                },
                likes: 0,
                comments: [],
                shares: 0,
            };
    
            await addDoc(collection(db, "posts"), sharedPost);
    
            // ✅ Send notification if sharing someone else's post
            if (post.user?.uid !== auth.currentUser.uid) {
                const notificationRef = doc(
                    db,
                    `users/${post.user.uid}/notifications`,
                    `${post.id}_share_${auth.currentUser.uid}`
                );
                await setDoc(notificationRef, {
                    type: "share",
                    senderId: auth.currentUser.uid,
                    senderUsername: currentUser?.username || auth.currentUser.displayName || "Unknown",
                    senderProfileImage: currentUser?.profileImage || "/defaultpic.jpg",
                    postId: post.id,
                    timestamp: new Date(),
                    seen: false,
                    message: "shared your post.",
                });
            }
        } catch (error) {
            console.error("Error sharing post:", error);
        }
    };
    
    
    
    

    // ✅ Correctly check if the current user is the post owner
    const isPostOwner = currentUser?.uid === post.user?.uid;
    
    const handleEditPost = (postId) => {
        console.log("Edit post:", postId);
        // Implement edit functionality here (e.g., open an edit modal)
      };
    
      

      const handleDeletePost = async () => {
          if (!auth.currentUser) {
              toast.error("You need to log in first!");
              return;
          }
      
          try {
              const postRef = doc(db, "posts", post.id);
      
              // Permanently delete the post from Firestore
              await deleteDoc(postRef);
      
              // Remove the post from UI immediately (Home Page & Profile Page)
              toast.success("Post deleted successfully!");
      
              // Optionally, refresh the feed or profile page after deletion
              setShowDropdown(false);
              window.location.reload(); // 🚀 This refreshes the page to remove the deleted post
          } catch (error) {
              console.error("Error deleting post:", error);
              toast.error("An error occurred while deleting the post.");
          }
      };
      
    
    const handleHidePost = () => {
        setHidden(true);
        setShowDropdown(false);
        toast.info("Post hidden from your feed.");
    };

    const handleSavePost = async () => {
        if (!auth.currentUser) {
            toast.error("You need to log in first!");
            return;
        }

        const userRef = doc(db, "users", auth.currentUser.uid);

        try {
            if (isSaved) {
                await updateDoc(userRef, {
                    savedPosts: arrayRemove(post.id),
                });
                setIsSaved(false);
                toast.info("Post unsaved successfully!");
            } else {
                await updateDoc(userRef, {
                    savedPosts: arrayUnion(post.id),
                    postId: post.id,
                        photoFilters: post.photoFilters || [],  // ✅ Store photo filters
                        videoFilters: post.videoFilters || [],  // ✅ Store video filters
                });
                setIsSaved(true);
                toast.success("Post saved successfully!");
            }

            setShowDropdown(false);
        } catch (error) {
            console.error("Error updating saved posts:", error);
            toast.error("An error occurred while saving the post.");
        }
    };
    console.log("Post ID:", post.id);
    console.log("Photo Filters:", post.photoFilters);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!auth.currentUser) return;

        const checkIfSaved = async () => {
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().savedPosts?.includes(post.id)) {
                setIsSaved(true);
            }
        };

        checkIfSaved();
    }, [post.id]);

    if (hidden) return null; // ✅ Hide post if state is true

        return (
        <div className="bg-black bg-opacity-50 border border-gray-700 shadow-lg  rounded-3xl p-6 sm:p-8 mb-6 max-w-3xl mx-auto text-white transition-transform hover:scale-105">
            {post.shared ? (
                <div className="bg-black bg-opacity-40 border border-gray-700 p-4 rounded-2xl shadow-lg ">
                    <div className="flex items-center space-x-3">
                        <img src={post.user.profileImage || "/defaultpic.jpg"} alt="User Avatar" className="w-8 h-8 rounded-full border" />
                        <div>
                            <p className="text-white font-semibold">{post.user.name} reposted.</p>
                            <p className="text-gray-400 text-sm">{moment(post.timestamp.toDate()).fromNow()}</p>
                            
                            {post.visibility === "public" ? (
                                                <span className="ml-2 flex items-center text-gray-500 text-sm">
                                                    🌍 <span className="ml-1">Public</span>
                                                </span>
                                            ) : (
                                                <span className="ml-2 flex items-center text-gray-500 text-sm">
                                                    👥 <span className="ml-1">Only Followers</span>
                                                </span>
                                            )}
                        </div>
                        <div className="relative ml-auto" ref={dropdownRef}>
                <BsThreeDots
                   className="text-gray-300 cursor-pointer text-xl hover:text-gray-200 transition"
                    onClick={() => setShowDropdown(!showDropdown)}
                />
                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-40 bg-black bg-opacity-80 shadow-xl rounded-lg border border-gray-700 z-10">
                        {isPostOwner ? (
                            <>
                                <button
  className="flex items-center w-full px-3 py-2 text-gray-300 hover:bg-gray-700 transition"
  onClick={() => navigate(`/create/${post.id}`)}
>
  <PiPencil className="mr-2" />
  Edit
</button>
                                <button
                                    className="flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-700 transition"
                                    onClick={handleDeletePost}
                                >
                                    Delete
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
                                    onClick={handleSavePost}
                                >
                                    {isSaved ? "Unsave" : "Save"}
                                </button>
                                <button
                                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-700 transition"
                                    onClick={handleHidePost}
                                >
                                    Hide
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
                    </div>
                    <div className="border-l-4 border-gray-600 p-3 mt-3">
                        <div className="flex items-center space-x-3">
                            <img src={post.originalPost.user.profileImage || "/defaultpic.jpg"} alt="Original User Avatar" className="w-8 h-8 rounded-full border" />
                            <p className="text-white font-semibold">{post.originalPost.user.name}</p>
                            
                            {post.visibility === "public" ? (
                                                <span className="ml-2 flex items-center text-gray-500 text-sm">
                                                    🌍 <span className="ml-1">Public</span>
                                                </span>
                                            ) : (
                                                <span className="ml-2 flex items-center text-gray-500 text-sm">
                                                    👥 <span className="ml-1"></span>
                                                </span>
                                            )}
                        </div>

                        <p className="text-gray-300 text-lg leading-relaxed mt-2">{post.originalPost.content}</p>
    

{/* Display Photos and Videos in Shared Post */}
<Swiper
    modules={[Navigation, Pagination]}
    spaceBetween={10}
    slidesPerView={1}
    navigation
    pagination={{ clickable: true }}
    className="w-full mt-4 rounded-2xl overflow-hidden shadow-lg"
>
    {/* ✅ Shared Post Images with Filters */}
    {post.originalPost?.photoUrls?.map((image, index) => {
        const filterObj = post.originalPost?.photoFilters?.[index] || {};
        const appliedFilters = [
            filterObj.filter || "none", // ✅ Use 'none' to avoid errors
            `brightness(${filterObj.brightness ?? 100}%)`, // ✅ Use `??` for safe fallback
            `contrast(${filterObj.contrast ?? 100}%)`
        ].join(" ");

        return (
            <SwiperSlide key={`shared-photo-${index}`}>
                <img
                    src={image}
                    alt="Shared Post"
                     className="w-full object-cover max-h-[400px] rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                    style={{ filter: appliedFilters }}
                />
            </SwiperSlide>
        );
    })}

    {/* ✅ Shared Post Videos with Filters */}
    {post.originalPost?.videoUrls?.map((video, index) => {
        const filterObj = post.originalPost?.videoFilters?.[index] || {};
        const appliedFilters = [
            filterObj.filter || "none",
            `brightness(${filterObj.brightness ?? 100}%)`,
            `contrast(${filterObj.contrast ?? 100}%)`
        ].join(" ");

        return (
            <SwiperSlide key={`shared-video-${index}`}>
                <video
                    controls
                    className="w-full object-cover max-h-[400px] cursor-pointer hover:scale-105 transition-transform rounded-lg"
                    style={{ filter: appliedFilters }}
                >
                    <source src={video} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </SwiperSlide>
        );
    })}
</Swiper>





                    </div>
                
                </div>
            ) : (
                <>
                    <div className="flex items-center space-x-4">
                        <img src={post.user?.profileImage || "/defaultpic.jpg"} alt="User Avatar" className="w-14 h-14 rounded-full border-2 border-gray-500 shadow-lg transition-transform hover:scale-110" />
                        <div>
                            <h3 className="font-semibold text-white text-lg">{post.user?.name}</h3>
                            <p className="text-sm text-white-500">{postTime}</p>
                            
                            {post.visibility === "public" ? (
                                                <span className="ml-2 flex items-center text-gray-500 text-sm">
                                                    🌍 <span className="ml-1">Public</span>
                                                </span>
                                            ) : (
                                                <span className="ml-2 flex items-center text-gray-500 text-sm">
                                                    👥 <span className="ml-1">Only Followers</span>
                                                </span>
                                            )}
                        </div>
                        <div className="relative ml-auto" ref={dropdownRef}>
                    <BsThreeDots
                        className="text-gray-400 cursor-pointer text-xl hover:text-gray-300 transition"
                        onClick={() => setShowDropdown((prev) => !prev)}
                    />
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-40 bg-black bg-opacity-80 shadow-xl rounded-lg border border-gray-700 z-10">
                            {isPostOwner ? (
                                <>
                                <button
                        className="flex items-center w-full px-3 py-2 text-white-300 hover:bg-gray-700 transition"
                        onClick={() => navigate(`/create/${post.id}`)}
                            >
                         Edit
                        </button>
                                    <button
                                        className="flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-700 transition"
                                        onClick={handleDeletePost}
                                    >
                                    Delete
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
                                        onClick={handleSavePost}
                                    >
                                        {isSaved ? "Unsave" : "Save"}
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-700 transition"
                                        onClick={handleHidePost}
                                    >
                                        Hide
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                       
            </div>
                    
                
                    
                    <p className="text-gray-300 text-lg leading-relaxed mt-4">{post.content}</p>
    
                    {/* Display Photos and Videos */}
{(post.photoUrls?.length > 0 || post.videoUrls?.length > 0) && (
    <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        className="w-full mt-4 rounded-2xl overflow-hidden shadow-lg"
    >
 {/* Display Photos */}
{post.photoUrls?.map((image, index) => {
    const filterObj = post.photoFilters?.[index] || {}; // Ensure filter object exists
    const appliedFilters = [
        filterObj.filter || "", // Apply custom filter (e.g., grayscale, sepia)
        `brightness(${filterObj.brightness || 100}%)`, // Default to 100% if undefined
        `contrast(${filterObj.contrast || 100}%)`, // Default to 100% if undefined
    ].filter(Boolean).join(" "); // Remove empty values

    return (
        <SwiperSlide key={`photo-${index}`}>
            <img
                src={image}
                alt="Post"
                className="w-full object-cover max-h-[400px] rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform"
                style={{
                    filter: appliedFilters || "none", // Apply filters or fallback to "none"
                }}
            />
        </SwiperSlide>
    );
})}



        {/* Display Videos */}
{post.videoUrls?.map((video, index) => {
    const filterObj = post.videoFilters?.[index] || {}; // Ensure filter object exists
    const appliedFilters = [
        filterObj.filter || "", // Apply filter (e.g., grayscale, sepia)
        `brightness(${filterObj.brightness || 100}%)`, // Default to 100% if undefined
        `contrast(${filterObj.contrast || 100}%)`, // Default to 100% if undefined
    ].filter(Boolean).join(" "); // Remove empty values

    return (
        <SwiperSlide key={`video-${index}`}>
            <video
                controls
                className="w-full object-cover max-h-[400px] cursor-pointer hover:scale-105 transition-transform rounded-lg"
                style={{
                    filter: appliedFilters || "none", // Apply filters or fallback to "none"
                }}
            >
                <source src={video} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </SwiperSlide>
    );
})}

    </Swiper>
)}

                </>
            )}
    
            {/* Like, Comment, Share Buttons */}
            <div className="flex justify-between items-center mt-4 border-t border-gray-700 pt-4">
                <button onClick={handleLike} className="flex items-center space-x-2 text-gray-300 hover:text-red-500 transition">
                    {liked ? <AiFillHeart size={24} className="text-red-500" /> : <AiOutlineHeart size={24} />}
                    <span>{likes}</span>
                </button>
                <div className="flex items-center space-x-2 text-gray-300">
                    <AiOutlineComment size={24} />
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="border rounded-lg p-2 text-sm w-48"
                    />
                    <button onClick={handleComment} className="text-gray-300 hover:text-blue-500 transition">Post</button>
                    
                </div>
                <button onClick={handleShare} className="flex items-center space-x-2 text-gray-700 hover:text-green-500">
                    <AiOutlineShareAlt size={24} />
                    <span>{shares}</span>
                </button>
            </div>
    
            {/* Comment Section */}
            {comments.length > 0 && (
                <div className="mt-4 bg-gray-100 p-3 rounded-lg shadow-sm">
                    <h3 className="text-gray-600 font-semibold mb-2">Comments</h3>
                    {comments.map((comment, index) => (
                        <div key={index} className="flex items-center space-x-3 mb-2">
                            <img src={comment.user.profileImage} alt="User" className="w-8 h-8 rounded-full border" />
                            <p className="text-gray-700 text-sm">
                                <strong>{comment.user.name}</strong>: {comment.text}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
 export default Post;



