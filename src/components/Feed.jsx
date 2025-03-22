import React, { useState, useEffect } from "react";
import Post from "../pages/Post";
import { db } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const Feed = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const postsCollection = collection(db, "posts");
        const q = query(postsCollection, orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map((doc) => {
                const data = doc.data();

                return {
                    id: doc.id,
                    ...data,
                    photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
                    videoUrls: Array.isArray(data.videoUrls) ? data.videoUrls : [],
                    fileUrls: Array.isArray(data.fileUrls) ? data.fileUrls : [],
                    photoFilters: Array.isArray(data.photoFilters) ? data.photoFilters : [], // ✅ Fetch photo filters
                    videoFilters: Array.isArray(data.videoFilters) ? data.videoFilters : [], // ✅ Fetch video filters

                    originalPost: data.originalPost
                        ? {
                              ...data.originalPost,
                              photoUrls: Array.isArray(data.originalPost.photoUrls)
                                  ? data.originalPost.photoUrls
                                  : [],
                              videoUrls: Array.isArray(data.originalPost.videoUrls)
                                  ? data.originalPost.videoUrls
                                  : [],
                              photoFilters: Array.isArray(data.originalPost.photoFilters)
                                  ? data.originalPost.photoFilters
                                  : [], // ✅ Fetch photo filters for shared posts
                              videoFilters: Array.isArray(data.originalPost.videoFilters)
                                  ? data.originalPost.videoFilters
                                  : [], // ✅ Fetch video filters for shared posts
                          }
                        : { 
                            photoUrls: [], 
                            videoUrls: [], 
                            photoFilters: [], 
                            videoFilters: [] 
                          },
                };
            });

            console.log("Fetched Posts with Filters:", fetchedPosts); // ✅ Debugging to check if filters are loaded
            setPosts(fetchedPosts);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex flex-1 justify-center w-full">
            <div className="max-w-5xl w-full mx-auto px-6 space-y-6">
                {posts.length > 0 ? (
                    posts.map((post) => <Post key={post.id} post={post} />)
                ) : (
                    <p className="text-center text-gray-600">No posts available</p>
                )}
            </div>
        </div>
    );
};

export default Feed;
