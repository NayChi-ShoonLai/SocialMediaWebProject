import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import { AiOutlineHeart, AiOutlineComment, AiOutlineShareAlt } from "react-icons/ai";

const Activity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const navigate = useNavigate();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const postsCollection = collection(db, "posts");
        const q = query(postsCollection, orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let userActivities = [];

            snapshot.docs.forEach((doc) => {
                const postData = doc.data();
                const postId = doc.id;

                if (Array.isArray(postData.likedBy) && postData.likedBy.includes(currentUser.uid)) {
                    userActivities.push({
                        type: "like",
                        postId,
                        timestamp: postData.timestamp || null,
                        postOwner: postData.user?.name || "Unknown User",
                        message: `You liked ${postData.user?.name || "someone"}'s post.`,
                    });
                }

                if (Array.isArray(postData.comments)) {
                    postData.comments.forEach((comment) => {
                        if (comment.userId === currentUser.uid) {
                            userActivities.push({
                                type: "comment",
                                postId,
                                timestamp: comment.timestamp || null,
                                postOwner: postData.user?.name || "Unknown User",
                                message: `You commented on ${postData.user?.name || "someone"}'s post.`,
                            });
                        }
                    });
                }

                if (postData.user?.uid === currentUser.uid && postData.shared) {
                    userActivities.push({
                        type: "share",
                        postId,
                        timestamp: postData.timestamp || null,
                        postOwner: postData.originalPost?.user?.name || "Unknown User",
                        message: `You shared ${postData.originalPost?.user?.name || "someone"}'s post.`,
                    });
                }
            });

            userActivities.sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return b.timestamp.toDate() - a.timestamp.toDate();
            });

            setActivities(userActivities);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleNavigateToPost = (postId) => {
        navigate(`/post/${postId}`);
    };

    return (
        <div className="flex min-h-screen bg-black text-white">
            {/* ✅ Left Sidebar (Fixed Width) */}
            <div className="w-[320px] flex-shrink-0 hidden lg:block">
                <LeftSidebar />
            </div>

            {/* ✅ Main Content (Fixed Centered Width) */}
            <div className="flex-1 flex justify-center">
                <div className="w-[900px] px-6">
                    <h2 className="text-2xl font-bold text-center text-white mb-6">Your Activity</h2>

                    {/* Filter Buttons */}
                    <div className="flex justify-center space-x-4 mb-6">
                        {["all", "like", "comment", "share"].map((type) => (
                            <button
                                key={type}
                                className={`px-5 py-2 text-sm font-semibold rounded-lg transition ${
                                    filter === type
                                        ? "bg-blue-500 text-white shadow-lg"
                                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                                }`}
                                onClick={() => setFilter(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Activity List */}
                    {loading ? (
                        <p className="text-center text-gray-300 text-sm">Loading...</p>
                    ) : activities.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm">No activities yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {activities
                                .filter((activity) => filter === "all" || activity.type === filter)
                                .map((activity, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center p-3 bg-white/10 border border-white/20 rounded-lg backdrop-blur-md cursor-pointer hover:scale-[1.02] hover:bg-white/20 transition-all"
                                        onClick={() => handleNavigateToPost(activity.postId)}
                                    >
                                        {/* Icon Based on Activity Type */}
                                        {activity.type === "like" && (
                                            <AiOutlineHeart className="text-red-500 mr-4" size={20} />
                                        )}
                                        {activity.type === "comment" && (
                                            <AiOutlineComment className="text-green-500 mr-4" size={20} />
                                        )}
                                        {activity.type === "share" && (
                                            <AiOutlineShareAlt className="text-purple-500 mr-4" size={20} />
                                        )}

                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{activity.message}</p>
                                            <p className="text-xs text-gray-400">
                                                {activity.timestamp
                                                    ? moment(activity.timestamp.toDate()).fromNow()
                                                    : "Unknown time"}
                                            </p>
                                        </div>

                                        <div className="ml-2 text-gray-400 transition-transform hover:scale-110">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* ✅ Right Sidebar (Fixed Width) */}
            <div className="w-[300px] flex-shrink-0 hidden lg:block">
                <RightSidebar />
            </div>
        </div>
    );
};

export default Activity;
