import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, orderBy, getDocs, doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PiArrowLeft, PiTrashFill, PiHeartFill } from "react-icons/pi";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";

const StoryViewer1 = () => {
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const fetchStories = async () => {
            const user = auth.currentUser;
            if (!user) return;
    
            const storiesRef = collection(db, `users/${user.uid}/stories`);
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
    }, []);
    
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

    // ✅ Fetch Like Count in Real-Time
    useEffect(() => {
        if (stories.length === 0) return;

        const user = auth.currentUser;
        if (!user) return;

        const storyId = stories[currentStoryIndex]?.id;
        if (!storyId) return;

        const likesRef = collection(db, `users/${user.uid}/stories/${storyId}/likes`);
        
        const unsubscribe = onSnapshot(likesRef, (snapshot) => {
            setLikeCount(snapshot.size); // ✅ Updates like count in real-time
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

    const handleDeleteStory = async () => {
        if (!stories[currentStoryIndex]) return;

        const storyId = stories[currentStoryIndex].id;
        const user = auth.currentUser;
        if (!user) return;

        const storyRef = doc(db, `users/${user.uid}/stories`, storyId);

        try {
            await deleteDoc(storyRef);
            toast.success("Story deleted successfully!");

            const updatedStories = stories.filter((_, index) => index !== currentStoryIndex);
            setStories(updatedStories);

            if (updatedStories.length === 0) {
                navigate(-1);
            } else {
                setCurrentStoryIndex((prevIndex) => Math.max(0, prevIndex - 1));
            }
        } catch (error) {
            console.error("Error deleting story:", error);
            toast.error("Failed to delete story.");
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
            {/* Background Blur */}
            <div className="absolute inset-0 bg-opacity-70 backdrop-blur-lg"></div>

            {/* Back Arrow (Exit) */}
            <button className="absolute top-4 left-4 p-3 bg-gray-900 bg-opacity-50 rounded-full" onClick={() => navigate(-1)}>
                <PiArrowLeft size={24} className="text-white" />
            </button>

            {/* Story Container */}
            <div className="relative w-full max-w-md h-screen flex flex-col">
                {/* Progress Bar */}
                <div className="absolute top-4 left-4 right-4 flex gap-2">
                    {stories.map((_, index) => (
                        <div key={index} className="h-1 flex-1 rounded-full bg-gray-500">
                            <div
                                className="h-1 bg-white rounded-full transition-all duration-100"
                                style={{
                                    width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? "100%" : "0%",
                                }}
                            ></div>
                        </div>
                    ))}
                </div>

                {/* Time Ago Display */}
                <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {formatDistanceToNow(stories[currentStoryIndex].timestamp?.toDate(), { addSuffix: true })}
                </div>

                {/* Delete Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStory(); }} 
                    className="absolute top-16 right-12 bg-red-600 bg-opacity-70 text-white p-2 rounded-full hover:bg-red-800 z-50"
                >
                    <PiTrashFill size={20} />
                </button>

                {/* Like Count */}
                <div className="absolute bottom-12 right-10 flex items-center space-x-1 z-50">
                    <PiHeartFill size={22} className="text-white" />
                    <span className="text-white text-lg">{likeCount}</span>
                </div>

  {/* Story Content */}
<div className="flex-1 flex items-center justify-center relative">
    {stories[currentStoryIndex].type === "image" ? (
        <img 
            src={stories[currentStoryIndex].storyUrl} 
            alt="Story" 
            className="max-w-full max-h-full object-contain"
            style={filterStyle}
        />
    ) : (
        <video 
        controls 
        autoPlay 
        playsInline 
        loop
        className="max-w-full max-h-full object-contain"
        style={filterStyle}
    >
        <source src={stories[currentStoryIndex].storyUrl} type="video/mp4" />
        Your browser does not support the video tag.
    </video>
    
        
    )}

    {/* ✅ Caption (If Available) */}
    {stories[currentStoryIndex]?.caption && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white text-lg font-semibold px-4 py-2 rounded-md text-center max-w-[90%]">
            {stories[currentStoryIndex]?.caption}
        </div>
    )}
</div>


                {/* Navigation Controls */}
                <div className="absolute inset-0 flex justify-between items-center px-4">
                    <button onClick={prevStory} className="text-white text-3xl">&lt;</button>
                    <button onClick={nextStory} className="text-white text-3xl">&gt;</button>
                </div>
            </div>
        </div>
    );
};

export default StoryViewer1;
