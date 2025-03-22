//src/pages/CreatPost.jsx
import React, { useEffect, useState } from "react";
import { PiImageSquare, PiPaperPlaneTilt, PiFile, PiVideo, PiX } from "react-icons/pi";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

import { toast } from "react-toastify";
import { useParams } from "react-router-dom"; 
import { updateDoc } from "firebase/firestore";


const CreatePost1 = () => {
  const [postContent, setPostContent] = useState("");
  const [tags, setTags] = useState("");
  const [userData, setUserData] = useState({ username: "Loading...", profileImage: "/defaultpic.jpg" });

  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [filter, setFilter] = useState("");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  const [photoFiles, setPhotoFiles] = useState([]); // Store multiple photos
  const [photoPreviews, setPhotoPreviews] = useState([]); // Store multiple previews
  const [photoFilters, setPhotoFilters] = useState([]); // Stores filter settings per image
  const [videoFilters, setVideoFilters] = useState([]); // Stores filter settings per video
  const [selectedMedia, setSelectedMedia] = useState(null); // Track which media is being edited
  
  const [docFiles, setDocFiles] = useState([]);
  const [docNames, setDocNames] = useState([]);

  const [loading, setLoading] = useState(false);
  const { postId } = useParams(); // Get postId from URL if editing
  const [visibility, setVisibility] = useState("public"); // Default to public

  useEffect(() => {
    const fetchPostData = async () => {
        if (postId) {  // If postId exists, fetch post data
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const data = postSnap.data();
                setPostContent(data.content || "");
                setTags(data.tags ? data.tags.join(", ") : "");
                setPhotoPreviews(data.photoUrls || []);
                setVideoPreviews(data.videoUrls || []);
                setDocNames(data.fileUrls || []);
                setPhotoFilters(data.photoFilters || []);
                setVideoFilters(data.videoFilters || []);
                setVisibility(data.visibility || "public"); // 🔹 Set visibility from database
            }
        }
    };

    fetchPostData();
}, [postId]);

  
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }
      }
    };

    fetchUserData();
  }, []);
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);

    Promise.all(files.map((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({
                    url: reader.result, // Base64 string
                    filter: { filter: "", brightness: 100, contrast: 100 } // Default filter settings
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }))
    .then((newPhotos) => {
        setPhotoFiles((prev) => [...prev, ...newPhotos]); // Store Base64 with filters
        setPhotoPreviews((prev) => [...prev, ...newPhotos.map(p => p.url)]); // Show previews
        setPhotoFilters((prev) => [...prev, ...newPhotos.map(p => p.filter)]); // Store filter settings
    })
    .catch((error) => console.error("Error converting images to Base64:", error));
};

const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);

    Promise.all(files.map((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve({
                    url: reader.result, // Base64 string
                    filter: { filter: "", brightness: 100, contrast: 100 } // Default filter settings
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }))
    .then((newVideos) => {
        setVideoFiles((prev) => [...prev, ...newVideos]); // Store Base64 with filters
        setVideoPreviews((prev) => [...prev, ...newVideos.map(v => v.url)]); // Show previews
        setVideoFilters((prev) => [...prev, ...newVideos.map(v => v.filter)]); // Store filter settings
    })
    .catch((error) => console.error("Error converting videos to Base64:", error));
};

  const handleRemovePreview = (type, index) => {
    if (type === "video") {
      setVideoFiles(videoFiles.filter((_, i) => i !== index));
      setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
    } else if (type === "photo") {
      setPhotoFiles(photoFiles.filter((_, i) => i !== index));
      setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
    } else if (type === "doc") {
      setDocFiles(docFiles.filter((_, i) => i !== index));
      setDocNames(docNames.filter((_, i) => i !== index));
    }
  };

  const handlePost = async () => {
    if (!postId && postContent.trim() === "" && photoFiles.length === 0 && videoFiles.length === 0 && docFiles.length === 0) {
        toast.error("Please add some content before posting.");
        return;
    }

    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
        toast.error("You must be logged in to post.");
        setLoading(false);
        return;
    }

    try {
        // ✅ Fetch current user data to ensure sender details exist
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};

        const senderUsername = userData.username || "Anonymous";
        const senderProfileImage = userData.profileImage || "/defaultpic.jpg";
        let videoUrls = videoFiles.length > 0 ? videoFiles.map(video => video.url) : videoPreviews; 
        let photoUrls = photoFiles.length > 0 ? photoFiles.map(photo => photo.url) : photoPreviews; 
        
        // let videoUrls = [...videoPreviews];
        // let photoUrls = [...photoPreviews];
        // let fileUrls = [...docNames];

        // ✅ Function to Upload Files
        // const uploadFiles = async (files, path) => {
        //     const urls = [];
        //     await Promise.all(
        //         files.map(async (file) => {
        //             const fileRef = ref(storage, `${path}/${user.uid}/${file.name}`);
        //             await uploadBytes(fileRef, file);
        //             const downloadURL = await getDownloadURL(fileRef);
        //             urls.push(downloadURL);
        //         })
        //     );
        //     return urls;
        // };

        // // ✅ Upload Files Only if New Files are Added
        // if (videoFiles.length > 0) videoUrls = await uploadFiles(videoFiles, "videos");
        // if (photoFiles.length > 0) photoUrls = await uploadFiles(photoFiles, "photos");
        // if (docFiles.length > 0) fileUrls = await uploadFiles(docFiles, "documents");

        let newPostRef;
        if (postId) {
            // 🔹 Update Existing Post
            await updateDoc(doc(db, "posts", postId), {
                content: postContent,
                tags: tags.split(",").map(tag => tag.trim()),
                videoUrls,
                photoUrls,
                
                photoFilters,
                videoFilters,
                visibility,
               
            });
            toast.success("Post updated successfully!");
        } else {
            // 🔹 Create New Post
            newPostRef = await addDoc(collection(db, "posts"), {
                content: postContent,
                tags: tags.split(",").map(tag => tag.trim()),
                timestamp: serverTimestamp(),
                videoUrls,
                photoUrls,
                
                photoFilters,
                videoFilters,
                visibility,
                user: {
                    uid: user.uid,
                    name: senderUsername,
                    profileImage: senderProfileImage,
                },
            });

            toast.success("Post created successfully!");

            // ✅ Send Notifications to Followers (Only for New Posts)
            const followersRef = collection(db, `users/${user.uid}/followers`);
            const followersSnapshot = await getDocs(followersRef);
            const followers = followersSnapshot.docs.map(docSnap => docSnap.id);

            await Promise.all(followers.map(async (followerId) => {
                const notificationRef = doc(db, `users/${followerId}/notifications`, `${newPostRef.id}_post`);
                await setDoc(notificationRef, {
                    type: "post",
                    senderId: user.uid,
                    senderUsername,
                    senderProfileImage,
                    postId: newPostRef.id,
                    timestamp: serverTimestamp(),
                    seen: false,
                    message: "shared a new post.",
                });
            }));
        }

        // ✅ Reset Form After Posting
        setPostContent("");
        setTags("");
        setVideoFiles([]);
        setVideoPreviews([]);
        setPhotoFiles([]);
        setPhotoPreviews([]);
        setDocFiles([]);
        setDocNames([]);
        setFilter("");  
        setBrightness(100);
        setContrast(100);
        
    } catch (error) {
        console.error("❌ Error adding/updating post:", error);
        toast.error("Failed to save post.");
    }

    setLoading(false);
};



const applyFilter = (type, index, key, value) => {
    if (type === "photo") {
        setPhotoFilters((prevFilters) => {
            const updatedFilters = [...prevFilters];
            updatedFilters[index] = {
                ...updatedFilters[index],
                [key]: value,
            };
            return updatedFilters;
        });
    } else {
        setVideoFilters((prevFilters) => {
            const updatedFilters = [...prevFilters];
            updatedFilters[index] = {
                ...updatedFilters[index],
                [key]: value,
            };
            return updatedFilters;
        });
    }
};


  return (
    <div className="max-w-2xl mx-auto bg-black p-6 rounded-lg shadow-lg mt-6">
      
      <div className="flex items-center mb-4">
        <img src={userData.profileImage || "/defaultpic.jpg"} alt="Profile" className="w-12 h-12 rounded-full mr-3" />
        <h2 className="text-lg font-bold text-black-800">{userData.username || "Anonymous"}</h2>
      </div>

      {/* Post Input */}
      <textarea
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="4"
        placeholder="What's on your mind?"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
      ></textarea>

      <h3 className="text-black font-semibold mt-4">Add to your post</h3>
      <div className="mt-2 p-4 bg-black-100 rounded-lg flex space-x-4 h-24 items-center">
        <label className="flex items-center p-4 bg-black border rounded-lg shadow hover:bg-gray-200 w-full cursor-pointer">
          <PiImageSquare size={24} className="text-blue-600 mr-2" />
          <span className="text-black-700">Image</span>
          <input type="file" accept="image/*"multiple className="hidden" onChange={handlePhotoChange} />
        </label>
        <label className="flex items-center p-4 bg-black border rounded-lg shadow hover:bg-gray-200 w-full cursor-pointer">
          <PiVideo size={24} className="text-green-600 mr-2" />
          <span className="text-black-700">Video</span>
          <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoChange} />
        </label>
       
      </div>

{/* Image Previews with Filters */}
<div className="grid grid-cols-3 gap-2 mt-4">
  {photoPreviews.map((preview, index) => (
    <div key={index} className="relative">
      <img 
        src={preview} 
        alt={`Preview ${index}`} 
        className="w-full h-24 object-cover rounded-lg cursor-pointer"
        style={{
          filter: `
            ${photoFilters[index]?.filter || ""}
            brightness(${photoFilters[index]?.brightness}%)
            contrast(${photoFilters[index]?.contrast}%)
          `
        }}
        onClick={() => setSelectedMedia({ type: "photo", index })}
      />
      <button 
        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full" 
        onClick={() => handleRemovePreview("photo", index)}
      >
        <PiX size={16} />
      </button>
    </div>
  ))}
</div>

{/* Video Previews with Filters */}
<div className="grid grid-cols-3 gap-2 mt-4">
  {videoPreviews.map((preview, index) => (
    <div key={index} className="relative">
      <video 
        controls 
        className="w-full h-24 object-cover rounded-lg cursor-pointer"
        style={{
          filter: `
            ${videoFilters[index]?.filter || ""}
            brightness(${videoFilters[index]?.brightness}%)
            contrast(${videoFilters[index]?.contrast}%)
          `
        }}
        onClick={() => setSelectedMedia({ type: "video", index })}
      >
        <source src={preview} type="video/mp4" />
      </video>
      <button 
        className="absolute top-1 right-1 bg-red-500 text-black p-1 rounded-full" 
        onClick={() => handleRemovePreview("video", index)}
      >
        <PiX size={16} />
      </button>
    </div>
  ))}
</div>





{selectedMedia && (
    <div className="mb-3 p-4 border rounded-lg">
        <h3 className="text-sm font-medium">
            Apply Filters to {selectedMedia.type} {selectedMedia.index + 1}
        </h3>

        {/* Filter Selection */}
        <label className="block text-sm font-medium">Filter</label>
        <select
            value={selectedMedia.type === "photo"
                ? photoFilters[selectedMedia.index]?.filter || ""
                : videoFilters[selectedMedia.index]?.filter || ""}
            onChange={(e) => applyFilter(selectedMedia.type, selectedMedia.index, "filter", e.target.value)}
            className="w-full p-2 border rounded-lg"
        >
            <option value="">No Filter</option>
            <option value="grayscale(100%)">Grayscale</option>
            <option value="sepia(100%)">Sepia</option>
            <option value="invert(100%)">Invert</option>
        </select>

        {/* Brightness Adjustment */}
        <label className="block text-sm font-medium mt-2">Brightness</label>
        <input
            type="range"
            min="50"
            max="150"
            value={selectedMedia.type === "photo"
                ? photoFilters[selectedMedia.index]?.brightness || 100
                : videoFilters[selectedMedia.index]?.brightness || 100}
            onChange={(e) => applyFilter(selectedMedia.type, selectedMedia.index, "brightness", e.target.value)}
            className="w-full"
        />

        {/* Contrast Adjustment */}
        <label className="block text-sm font-medium mt-2">Contrast</label>
        <input
            type="range"
            min="50"
            max="150"
            value={selectedMedia.type === "photo"
                ? photoFilters[selectedMedia.index]?.contrast || 100
                : videoFilters[selectedMedia.index]?.contrast || 100}
            onChange={(e) => applyFilter(selectedMedia.type, selectedMedia.index, "contrast", e.target.value)}
            className="w-full"
        />
    </div>
)}




      {/* Tags Input */}
      <h3 className="text-black-600 font-semibold mt-4">Tags</h3>
      <input
        type="text"
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Add tags (e.g. #travel, #food)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <h3 className="text-black-600 font-semibold mt-4">Who can see this post?</h3>
<select
  value={visibility}
  onChange={(e) => setVisibility(e.target.value)}
  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="public">🌍 Public</option>
  <option value="followers">👥 Only Followers</option>
</select>


      {/* Post Button */}
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-black rounded-lg flex items-center hover:bg-blue-600 w-full justify-center"
        onClick={handlePost}
        disabled={loading}
      >
        {loading ? "Posting..." : <><PiPaperPlaneTilt size={20} className="mr-2" /> Post</>}
      </button>
    </div>
  );
};

export default CreatePost1;
