import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { PiArrowLeft, PiHeart, PiHeartFill } from "react-icons/pi";
import { formatDistanceToNow } from "date-fns";
import { getDoc, serverTimestamp } from "firebase/firestore";



const UserStoryViewer1 = () => {
    const navigate = useNavigate();
    const { userId } = useParams(); // ✅ Get user ID from URL
    const [stories, setStories] = useState([]);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const currentUser = auth.currentUser;

    useEffect(() => {
        const fetchStories = async () => {
            if (!userId) return;

            const storiesRef = collection(db, `users/${userId}/stories`); 
            const q = query(storiesRef, orderBy("timestamp", "desc"));
            const storySnapshot = await getDocs(q);

            let userStories = [];
            storySnapshot.forEach((docSnap) => {
                const storyData = docSnap.data(); // ✅ Define storyData correctly
    
                userStories.push({
                    id: docSnap.id,
                    ...storyData,
                    storyUrl: storyData.storyUrl, // ✅ Ensure storyUrl exists
                    filters: storyData.filters ?? { filter: "", brightness: 100, contrast: 100 }, // ✅ Provide default filter values
                });
            });

            setStories(userStories);
        };

        fetchStories();
    }, [userId]);

    useEffect(() => {
        if (stories.length === 0) return;

        let duration = stories[currentStoryIndex]?.type === "image" ? 5000 : 10000;
        let interval;

        if (!isPaused) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        nextStory();
                        return 0;
                    }
                    return prev + (100 / (duration / 100)); 
                });
            }, 100);
        }

        return () => clearInterval(interval);
    }, [currentStoryIndex, stories, isPaused]);

    // ✅ Fetch Like Count & Check if Current User Liked the Story
    useEffect(() => {
        if (stories.length === 0 || !currentUser) return;

        const storyId = stories[currentStoryIndex]?.id;
        if (!storyId) return;

        const likesRef = collection(db, `users/${userId}/stories/${storyId}/likes`);
        
        const unsubscribe = onSnapshot(likesRef, (snapshot) => {
            setLikeCount(snapshot.size); // ✅ Update like count in real-time
            setIsLiked(snapshot.docs.some(doc => doc.id === currentUser.uid)); // ✅ Check if user liked
        });

        return () => unsubscribe();
    }, [currentStoryIndex, stories]);

    const nextStory = () => {
        if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            setProgress(0);
        } else {
            navigate(-1);
        }
    };
    

    const prevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
            setProgress(0);
        } else {
            navigate(-1);
        }
    };

    // ✅ Handle Like/Unlike
    const handleLike = async () => {
        if (!currentUser) return;
    
        const storyId = stories[currentStoryIndex]?.id;
        if (!storyId) return;
    
        const storyOwnerId = userId; // The user who posted the story
        const likeRef = doc(db, `users/${storyOwnerId}/stories/${storyId}/likes/${currentUser.uid}`);
        const notificationRef = doc(db, `users/${storyOwnerId}/notifications`, `${storyId}-${currentUser.uid}`);
    
        if (isLiked) {
            await deleteDoc(likeRef); // ✅ Unlike the story
            await deleteDoc(notificationRef); // ✅ Remove like notification if unliked
        } else {
            await setDoc(likeRef, { likedAt: serverTimestamp() }); // ✅ Like the story
    
            // ✅ Fetch the current user's username for notification
            const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
            const currentUsername = currentUserDoc.exists() ? currentUserDoc.data().username : "Someone";
    
            // ✅ Add a notification to the story owner's notifications
            await setDoc(notificationRef, {
                senderId: currentUser.uid,
                senderUsername: currentUsername,
                message: "liked your story.",
                timestamp: serverTimestamp(),
                seen: false,
            });
        }
    };
    

    if (stories.length === 0) {
        return <div className="flex items-center justify-center h-screen bg-black text-white">No stories available.</div>;
    }
    const currentStory = stories[currentStoryIndex] ?? {}; // ✅ Ensure it’s always an object

    const filterStyle = {
        filter: `
            ${currentStory.filters?.filter ? `${currentStory.filters.filter}(100%)` : ""}
            brightness(${currentStory.filters?.brightness || 100}%)
            contrast(${currentStory.filters?.contrast || 100}%)
        `.trim(),
    };
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
            <div className="absolute inset-0 bg-opacity-70 backdrop-blur-lg"></div>

            <button className="absolute top-4 left-4 p-3 bg-gray-900 bg-opacity-50 rounded-full" onClick={() => navigate(-1)}>
                <PiArrowLeft size={24} className="text-white" />
            </button>

            <div className="relative w-full max-w-md h-screen flex flex-col">
                <div className="absolute top-4 left-4 right-4 flex gap-2">
                    {stories.map((_, index) => (
                        <div key={index} className="h-1 flex-1 rounded-full bg-gray-500">
                            <div className="h-1 bg-white rounded-full transition-all duration-100"
                                style={{
                                    width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? "100%" : "0%",
                                }}
                            ></div>
                        </div>
                    ))}
                </div>
                <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {formatDistanceToNow(stories[currentStoryIndex].timestamp?.toDate(), { addSuffix: true })}
                </div>

                <div className="flex-1 flex items-center justify-center relative">
                    {stories[currentStoryIndex].type === "image" ? (
                        <img src={stories[currentStoryIndex].storyUrl} alt="Story" className="max-w-full max-h-full object-contain" style={filterStyle}/>
                    ) : (
                        <video src={stories[currentStoryIndex].storyUrl} controls autoPlay className="max-w-full max-h-full" style={filterStyle} />
                    )}

                    {stories[currentStoryIndex]?.caption && (
                        <div className="absolute bottom-20 w-full px-4 text-center">
                            <p className="inline-block bg-black bg-opacity-60 text-white text-lg font-semibold px-4 py-2 rounded-lg">
                                {stories[currentStoryIndex].caption}
                            </p>
                        </div>
                    )}
                </div>

            
                <div className="absolute bottom-8 left-8 flex items-center space-x-2 z-50">
    <button 
        onClick={handleLike} // ✅ Ensure this references the correct function
        className="text-white text-3xl cursor-pointer focus:outline-none"
    >
        {isLiked ? <PiHeartFill className="text-red-500" /> : <PiHeart />}
    </button>
    <p className="text-white text-lg">{likeCount}</p>
</div>



                <div className="absolute inset-0 flex justify-between items-center px-4">
                    <button onClick={prevStory} className="text-white text-3xl">&lt;</button>
                    <button onClick={nextStory} className="text-white text-3xl">&gt;</button>
                </div>
            </div>
        </div>
    );
};

export default UserStoryViewer1;
