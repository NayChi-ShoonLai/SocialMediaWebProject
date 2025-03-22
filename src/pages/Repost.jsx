
import React, { useEffect, useState } from "react";
import StoriesBar from "../components/StoriesBar";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import { db, auth } from "../firebaseConfig";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import Post from "../pages/Post"; // ✅ Reuse the Post component

const Repost = () => {
    const [reposts, setReposts] = useState([]);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const fetchUserReposts = () => {
            const repostsCollection = collection(db, "posts");
            const q = query(
                repostsCollection,
                where("shared", "==", true),
                where("user.uid", "==", currentUser.uid), // ✅ Fetch only the logged-in user's reposts
                orderBy("timestamp", "desc")
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedReposts = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setReposts(fetchedReposts);
            });

            return () => unsubscribe();
        };

        fetchUserReposts();
    }, [currentUser]);

    return (
        <div className="flex min-h-screen  bg-black text-white">
            {/* ✅ Left Sidebar (Fixed Width) */}
            <div className="w-[280px] flex-shrink-0 hidden lg:block">
                <LeftSidebar />
            </div>

            {/* ✅ Main Content (Fixed Centered Width) */}
            <div className="flex-1 flex  justify-center">
                <div className="w-[950px] px-6">
                    <StoriesBar />
                    <h2 className="text-2xl font-bold text-white mb-4 text-center"></h2>

                    {reposts.length > 0 ? (
                        reposts.map((post) => <Post key={post.id} post={post} />)
                    ) : (
                        <p className="text-center text-gray-400">You haven't reposted anything yet.</p>
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

export default Repost;
