// // import React, { useEffect, useState } from "react";
// // import { db, auth } from "../firebaseConfig";
// // import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
// // import { useNavigate } from "react-router-dom";

// // const StoriesBar = () => {
// //     const navigate = useNavigate();
// //     const [hasMyStory, setHasMyStory] = useState(false);
// //     const [profileImage, setProfileImage] = useState("/defaultpic.jpg");
// //     const [followedUsersWithStories, setFollowedUsersWithStories] = useState([]);

// //     useEffect(() => {
// //         const fetchStories = async () => {
// //             const currentUser = auth.currentUser;
// //             if (!currentUser) return;

// //             const userId = currentUser.uid;
// //             const now = Date.now();
// //             const cutoffTime = now - 24 * 60 * 60 * 1000; // 24 hours ago

// //             // ✅ Fetch logged-in user's profile data (ALWAYS SHOW USER PROFILE)
// //             const userDocRef = doc(db, "users", userId);
// //             const userDocSnap = await getDoc(userDocRef);
// //             if (userDocSnap.exists()) {
// //                 const userData = userDocSnap.data();
// //                 setProfileImage(userData.profileImage || "/defaultpic.jpg");
// //             }

// //             // ✅ Check if the logged-in user has a valid story
// //             const myStoryRef = collection(db, `users/${userId}/stories`);
// //             const myStorySnapshot = await getDocs(myStoryRef);
// //             let myValidStory = false;

// //             for (const docSnap of myStorySnapshot.docs) {
// //                 const storyData = docSnap.data();
// //                 if (storyData.timestamp.toMillis() > cutoffTime) {
// //                     myValidStory = true;
// //                 } else {
// //                     await deleteDoc(docSnap.ref); // ✅ Delete expired story
// //                 }
// //             }
// //             setHasMyStory(myValidStory); // ✅ Update story status

// //             // ✅ Fetch followed users who have valid stories
// //             const followingRef = collection(db, `users/${userId}/following`);
// //             const followingSnapshot = await getDocs(followingRef);

// //             let followedUsersList = [];

// //             for (const docSnap of followingSnapshot.docs) {
// //                 const followedUserId = docSnap.id;
// //                 const userStoryRef = collection(db, `users/${followedUserId}/stories`);
// //                 const storySnapshot = await getDocs(userStoryRef);

// //                 let hasValidStory = false;

// //                 for (const storyDoc of storySnapshot.docs) {
// //                     const storyData = storyDoc.data();
// //                     if (storyData.timestamp.toMillis() > cutoffTime) {
// //                         hasValidStory = true;
// //                         break;
// //                     } else {
// //                         await deleteDoc(storyDoc.ref); // ✅ Delete expired story
// //                     }
// //                 }

// //                 if (hasValidStory) {
// //                     const followedUserRef = doc(db, "users", followedUserId);
// //                     const followedUserSnap = await getDoc(followedUserRef);
// //                     if (followedUserSnap.exists()) {
// //                         const userData = followedUserSnap.data();
// //                         followedUsersList.push({
// //                             id: followedUserId,
// //                             username: userData.username || "Unknown",
// //                             profileImage: userData.profileImage || "/defaultpic.jpg",
// //                             hasStory: true,
// //                         });
// //                     }
// //                 }
// //             }

// //             setFollowedUsersWithStories(followedUsersList);
// //         };

// //         fetchStories();
// //     }, []);

// //     // ✅ Navigate to the correct story viewer
// //     const openStory = (userId) => {
// //         if (userId === auth.currentUser?.uid) {
// //             navigate("/stories"); // ✅ Navigate to your own story
// //         } else {
// //             navigate(`/user-stories/${userId}`); // ✅ Navigate to other user's story
// //         }
// //     };

// //     return (
// //         <div className="w-full p-4 bg-white shadow-md flex overflow-x-auto space-x-4">
// //             {/* 🔹 Show My Profile (ALWAYS VISIBLE) */}
// //             <div className="flex flex-col items-center cursor-pointer" onClick={() => openStory(auth.currentUser.uid)}>
// //                 <img
// //                     src={profileImage}
// //                     alt="My Profile"
// //                     className={`w-16 h-16 rounded-full border-4 ${
// //                         hasMyStory ? "border-green-500" : "border-gray-300"
// //                     }`}
// //                 />
// //                 <p className="text-xs mt-1">You</p>
// //             </div>

// //             {/* 🔹 Show Followed Users Who Have Valid Stories */}
// //             {followedUsersWithStories.map((user) => (
// //                 <div 
// //                     key={user.id} 
// //                     className="flex flex-col items-center cursor-pointer" 
// //                     onClick={() => openStory(user.id)}
// //                 >
// //                     <img
// //                         src={user.profileImage}
// //                         alt={user.username}
// //                         className="w-16 h-16 rounded-full border-4 border-green-500"
// //                     />
// //                     <p className="text-xs mt-1">{user.username}</p>
// //                 </div>
// //             ))}
// //         </div>
// //     );
// // };

// // export default StoriesBar;


// import React, { useEffect, useState } from "react";
// import { db, auth } from "../firebaseConfig";
// import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";

// const StoriesBar = () => {
//     const navigate = useNavigate();
//     const [hasMyStory, setHasMyStory] = useState(false);
//     const [profileImage, setProfileImage] = useState("/defaultpic.jpg");
//     const [followedUsersWithStories, setFollowedUsersWithStories] = useState([]);

//     useEffect(() => {
//         const fetchStories = async () => {
//             const currentUser = auth.currentUser;
//             if (!currentUser) return;

//             const userId = currentUser.uid;
//             const now = Date.now();
//             const cutoffTime = now - 24 * 60 * 60 * 1000;

//             const userDocRef = doc(db, "users", userId);
//             const userDocSnap = await getDoc(userDocRef);
//             if (userDocSnap.exists()) {
//                 const userData = userDocSnap.data();
//                 setProfileImage(userData.profileImage || "/defaultpic.jpg");
//             }

//             const myStoryRef = collection(db, `users/${userId}/stories`);
//             const myStorySnapshot = await getDocs(myStoryRef);
//             let myValidStory = false;

//             for (const docSnap of myStorySnapshot.docs) {
//                 const storyData = docSnap.data();
//                 if (storyData.timestamp.toMillis() > cutoffTime) {
//                     myValidStory = true;
//                 } else {
//                     await deleteDoc(docSnap.ref);
//                 }
//             }
//             setHasMyStory(myValidStory);

//             const followingRef = collection(db, `users/${userId}/following`);
//             const followingSnapshot = await getDocs(followingRef);

//             let followedUsersList = [];

//             for (const docSnap of followingSnapshot.docs) {
//                 const followedUserId = docSnap.id;
//                 const userStoryRef = collection(db, `users/${followedUserId}/stories`);
//                 const storySnapshot = await getDocs(userStoryRef);

//                 let hasValidStory = false;

//                 for (const storyDoc of storySnapshot.docs) {
//                     const storyData = storyDoc.data();
//                     if (storyData.timestamp.toMillis() > cutoffTime) {
//                         hasValidStory = true;
//                         break;
//                     } else {
//                         await deleteDoc(storyDoc.ref);
//                     }
//                 }

//                 if (hasValidStory) {
//                     const followedUserRef = doc(db, "users", followedUserId);
//                     const followedUserSnap = await getDoc(followedUserRef);
//                     if (followedUserSnap.exists()) {
//                         const userData = followedUserSnap.data();
//                         followedUsersList.push({
//                             id: followedUserId,
//                             username: userData.username || "Unknown",
//                             profileImage: userData.profileImage || "/defaultpic.jpg",
//                             hasStory: true,
//                         });
//                     }
//                 }
//             }

//             setFollowedUsersWithStories(followedUsersList);
//         };

//         fetchStories();
//     }, []);

//     const openStory = (userId) => {
//         if (userId === auth.currentUser?.uid) {
//             navigate("/stories");
//         } else {
//             navigate(`/user-stories/${userId}`);
//         }
//     };

//     return (
//         <div className="w-full p-4 bg-black backdrop-blur-lg shadow-xl border border-white/20 rounded-3xl flex overflow-x-auto space-x-4 text-white">
//             <div className="flex flex-col items-center cursor-pointer" onClick={() => openStory(auth.currentUser.uid)}>
//                 <img
//                     src={profileImage}
//                     alt="My Profile"
//                     className={`w-16 h-16 rounded-full border-4 ${hasMyStory ? "border-green-500" : "border-gray-500"}`}
//                 />
//                 <p className="text-xs mt-1 text-white">You</p>
//             </div>
//             {followedUsersWithStories.map((user) => (
//                 <div 
//                     key={user.id} 
//                     className="flex flex-col items-center cursor-pointer bg-black backdrop-blur-md p-2 rounded-lg border border-white/20 shadow-md hover:scale-105 transition"
//                     onClick={() => openStory(user.id)}
//                 >
//                     <img
//                         src={user.profileImage}
//                         alt={user.username}
//                         className="w-16 h-16 rounded-full border-4 border-green-500"
//                     />
//                     <p className="text-xs mt-1 text-white">{user.username}</p>
//                 </div>
//             ))}
//         </div>
//     );
// };

// export default StoriesBar;



import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const StoriesBar = () => {
    const navigate = useNavigate();
    const [myStory, setMyStory] = useState(null);
    const [followedUsersWithStories, setFollowedUsersWithStories] = useState([]);

    useEffect(() => {
        const fetchStories = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const userId = currentUser.uid;
            const now = Date.now();
            const cutoffTime = now - 24 * 60 * 60 * 1000; // 24 hours ago

            // ✅ Fetch logged-in user's profile & story data
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            let myStoryData = {
                id: userId,
                username: "You",
                profileImage: userDocSnap.exists() ? userDocSnap.data().profileImage || "/defaultpic.jpg" : "/defaultpic.jpg",
                hasStory: false,
            };

            const myStoryRef = collection(db, `users/${userId}/stories`);
            const myStorySnapshot = await getDocs(myStoryRef);

            for (const docSnap of myStorySnapshot.docs) {
                const storyData = docSnap.data();
                if (storyData.timestamp.toMillis() > cutoffTime) {
                    myStoryData.hasStory = true;
                } else {
                    await deleteDoc(docSnap.ref); // ✅ Delete expired story
                }
            }
            setMyStory(myStoryData);

            // ✅ Fetch followed users who have valid stories
            const followingRef = collection(db, `users/${userId}/following`);
            const followingSnapshot = await getDocs(followingRef);

            let followedUsersList = [];

            for (const docSnap of followingSnapshot.docs) {
                const followedUserId = docSnap.id;
                const userStoryRef = collection(db, `users/${followedUserId}/stories`);
                const storySnapshot = await getDocs(userStoryRef);

                let hasValidStory = false;

                for (const storyDoc of storySnapshot.docs) {
                    const storyData = storyDoc.data();
                    if (storyData.timestamp.toMillis() > cutoffTime) {
                        hasValidStory = true;
                        break;
                    } else {
                        await deleteDoc(storyDoc.ref); // ✅ Delete expired story
                    }
                }

                if (hasValidStory) {
                    const followedUserRef = doc(db, "users", followedUserId);
                    const followedUserSnap = await getDoc(followedUserRef);
                    if (followedUserSnap.exists()) {
                        const userData = followedUserSnap.data();
                        followedUsersList.push({
                            id: followedUserId,
                            username: userData.username || "Unknown",
                            profileImage: userData.profileImage || "/defaultpic.jpg",
                            hasStory: true,
                        });
                    }
                }
            }

            setFollowedUsersWithStories(followedUsersList);
        };

        fetchStories();
    }, []);

    // ✅ Navigate to the correct story viewer
    const openStory = (userId) => {
        if (userId === auth.currentUser?.uid) {
            navigate("/stories"); // ✅ Navigate to your own story
        } else {
            navigate(`/user-stories/${userId}`); // ✅ Navigate to other user's story
        }
    };

    return (
        <div className="w-full p-4 bg-white/10 backdrop-blur-lg shadow-md border border-white/20 rounded-3xl flex overflow-x-auto space-x-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {/* 🔹 Show My Story (Now Same UI as Other Users) */}
            {myStory && (
                <div 
                    className="flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105" 
                    onClick={() => openStory(myStory.id)}
                >
                    <img
                        src={myStory.profileImage}
                        alt="My Story"
                        className={`w-16 h-16 rounded-full border-4 ${
                            myStory.hasStory ? "border-green-500" : "border-gray-500"
                        }`}
                    />
                    <p className="text-xs mt-1">{myStory.username}</p>
                </div>
            )}

            {/* 🔹 Show Followed Users Who Have Stories */}
            {followedUsersWithStories.map((user) => (
                <div 
                    key={user.id} 
                    className="flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105" 
                    onClick={() => openStory(user.id)}
                >
                    <img
                        src={user.profileImage}
                        alt={user.username}
                        className="w-16 h-16 rounded-full border-4 border-green-500"
                    />
                    <p className="text-xs mt-1">{user.username}</p>
                </div>
            ))}
        </div>
    );
};

export default StoriesBar;

