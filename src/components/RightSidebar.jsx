// import React, { useEffect, useState } from "react";
// import { db, auth } from "../firebaseConfig";
// import { collection, getDocs, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";

// const RightSidebar = ({ followingList, handleFollowUpdate }) => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//    const [followingUsers, setFollowingUsers] = useState([]);
//     const [whoToFollow, setWhoToFollow] = useState([]);
//   const navigate = useNavigate();
//   const currentUser = auth.currentUser;

//   useEffect(() => {
//     if (!currentUser) return;

//     const usersRef = collection(db, "users");

//     // ✅ Real-time listener for changes in `users` collection
//     const unsubscribe = onSnapshot(usersRef, async (querySnapshot) => {
//       const usersList = [];
// const followingListUpdated = [];

// for (const docSnap of querySnapshot.docs) {
//     if (docSnap.id !== currentUser.uid) {
//         const userData = {
//             id: docSnap.id,
//             ...docSnap.data(),
//             isFollowing: followingList.includes(docSnap.id),
//         };

//         usersList.push(userData); // ✅ Add all users except the current user

//         if (userData.isFollowing) {
//             followingListUpdated.push(userData); // ✅ Add only the users the current user is following
//         }
//     }
// }


//       setUsers(usersList);
//       setLoading(false);
//       setWhoToFollow(usersList.filter(user => !user.isFollowing));// Users not followed
//       setFollowingUsers(followingListUpdated); // Users already followed
//     });

//     return () => unsubscribe(); // ✅ Clean up listener
//   }, [currentUser, followingList]); // 🔥 Updates when `followingList` changes

//   const handleFollow = async (userId) => {
//     if (!currentUser) {
//         toast.error("You must be logged in to follow users!");
//         return;
//     }

//     const followRef = doc(db, `users/${currentUser.uid}/following`, userId);
//     const followerRef = doc(db, `users/${userId}/followers`, currentUser.uid);
//     const userRef = doc(db, "users", userId);
//     const currentUserRef = doc(db, "users", currentUser.uid);
//     const notificationRef = doc(db, `users/${userId}/notifications`, `${currentUser.uid}_follow`); // Unique notification ID

//     const isCurrentlyFollowing = followingList.includes(userId);

//     try {
//         // ✅ Get current user's username for notification
//         const currentUserDoc = await getDoc(currentUserRef);
//         const currentUsername = currentUserDoc.exists() ? currentUserDoc.data().username : "Unknown User";

//         if (isCurrentlyFollowing) {
//             // 🔥 Unfollow User
//             await deleteDoc(followRef);
//             await deleteDoc(followerRef);
//             await updateDoc(userRef, { followers: Math.max((users.find(user => user.id === userId)?.followers || 0) - 1, 0) });
//             await updateDoc(currentUserRef, { following: Math.max((users.find(user => user.id === userId)?.following || 0) - 1, 0) });

//             // ❌ Remove notification if unfollowed
//             await deleteDoc(notificationRef);

//             setWhoToFollow(prev => [...prev, users.find(user => user.id === userId)]);
//             setFollowingUsers(prev => prev.filter(user => user.id !== userId));
//         } else {
//             // 🔥 Follow User
//             await setDoc(followRef, { followedAt: new Date() });
//             await setDoc(followerRef, { userId: currentUser.uid });
//             await updateDoc(userRef, { followers: (users.find(user => user.id === userId)?.followers || 0) + 1 });
//             await updateDoc(currentUserRef, { following: (users.find(user => user.id === userId)?.following || 0) + 1 });

//             // ✅ Send Notification
//             await setDoc(notificationRef, {
//                 type: "follow",
//                 senderId: currentUser.uid,
//                 senderUsername: currentUsername,
//                 timestamp: serverTimestamp(),
//                 seen: false,
//                 message: "started following you."
//             });

//             setWhoToFollow(prev => prev.filter(user => user.id !== userId));
//             setFollowingUsers(prev => [...prev, users.find(user => user.id === userId)]);
//         }

//         handleFollowUpdate(userId, !isCurrentlyFollowing); // 🔥 Sync with UserProfile
//     } catch (error) {
//         console.error("Error updating follow status:", error);
//     }
// };



//   return (
//     <div className="w-1/4 bg-white p-6 shadow-lg rounded-lg">      {/* 🔹 Who to Follow Section */}
//       <h2 className="text-xl font-semibold mb-4">Who to Follow</h2>
//       {loading ? (
//         <p className="text-gray-500">Loading users...</p>
//       ) : whoToFollow.length === 0 ? (
//         <p className="text-gray-500">No new suggestions.</p>
//       ) : (
//         whoToFollow.map(user => (
//           <div key={user.id} className="flex justify-between items-center mb-3 p-3 border rounded-lg">
//             <div className="flex items-center cursor-pointer" onClick={() => navigate(`/peofile1/${user.id}`)}>
//               <img src={user.profileImage || "/defaultpic.jpg"} alt={user.username} className="w-10 h-10 rounded-full mr-3" />
//               <div>
//                 <p className="text-sm font-semibold">{user.username}</p>
//                 <p className="text-xs text-gray-500">{user.followers} Followers</p>
//               </div>
//             </div>
//             <button
//               className="px-3 py-1 text-sm rounded-full bg-blue-500 text-white"
//               onClick={() => handleFollow(user.id)}
//             >
//               Follow
//             </button>
//           </div>
//         ))
//       )}

//       {/* 🔹 My Following Section */}
//       <h2 className="text-xl font-semibold mt-6 mb-4">My Following</h2>
//       {loading ? (
//         <p className="text-gray-500">Loading...</p>
//       ) : followingUsers.length === 0 ? (
//         <p className="text-gray-500">You're not following anyone yet.</p>
//       ) : (
//         followingUsers.map(user => (
//           <div key={user.id} className="flex justify-between items-center mb-3 p-3 border rounded-lg">
//             <div className="flex items-center cursor-pointer" onClick={() => navigate(`/peofile1/${user.id}`)}>
//               <img src={user.profileImage || "/defaultpic.jpg"} alt={user.username} className="w-10 h-10 rounded-full mr-3" />
//               <div>
//                 <p className="text-sm font-semibold">{user.username}</p>
//                 <p className="text-xs text-gray-500">{user.followers} Followers</p>
//               </div>
//             </div>
//             <button
//               className="px-3 py-1 text-sm rounded-full bg-gray-400 text-white"
//               onClick={() => handleFollow(user.id)}
//             >
//               Unfollow
//             </button>
//           </div>
//         ))
//       )}
//     </div>
//   );
// };

// export default RightSidebar;



// import React, { useEffect, useState } from "react";
// import { db, auth } from "../firebaseConfig";
// import { collection, onSnapshot } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";
// import { PiUserPlus, PiUserMinus } from "react-icons/pi";

// const RightSidebar = ({ followingList, handleFollowUpdate }) => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [followingUsers, setFollowingUsers] = useState([]);
//   const [whoToFollow, setWhoToFollow] = useState([]);
//   const navigate = useNavigate();
//   const currentUser = auth.currentUser;

//   useEffect(() => {
//     if (!currentUser) return;

//     const usersRef = collection(db, "users");
//     const unsubscribe = onSnapshot(usersRef, (querySnapshot) => {
//       const usersList = [];
//       const followingListUpdated = [];

//       querySnapshot.docs.forEach((docSnap) => {
//         if (docSnap.id !== currentUser.uid) {
//           const userData = {
//             id: docSnap.id,
//             ...docSnap.data(),
//             isFollowing: followingList.includes(docSnap.id),
//           };

//           usersList.push(userData);
//           if (userData.isFollowing) {
//             followingListUpdated.push(userData);
//           }
//         }
//       });

//       setUsers(usersList);
//       setLoading(false);
//       setWhoToFollow(usersList.filter((user) => !user.isFollowing));
//       setFollowingUsers(followingListUpdated);
//     });

//     return () => unsubscribe();
//   }, [currentUser, followingList]);

//   return (
//     <div className="fixed right-0 top-0 w-72 max-w-[300px] h-screen bg-white/10 backdrop-blur-lg shadow-lg border-l border-white/20 p-6 text-white z-50 rounded-l-3xl overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
//       {/* Who to Follow Section */}
//       <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">Who to Follow</h2>
//       {loading ? (
//         <p className="text-gray-500">Loading users...</p>
//       ) : whoToFollow.length === 0 ? (
//         <p className="text-gray-500">No new suggestions.</p>
//       ) : (
//         whoToFollow.map((user) => (
//           <UserCard key={user.id} user={user} navigate={navigate} handleFollowUpdate={handleFollowUpdate} isFollowing={false} />
//         ))
//       )}

//       {/* Following List Section */}
//       <h2 className="text-xl font-semibold mt-6 mb-4 border-b border-gray-600 pb-2">My Following</h2>
//       {loading ? (
//         <p className="text-gray-500">Loading...</p>
//       ) : followingUsers.length === 0 ? (
//         <p className="text-gray-500">You're not following anyone yet.</p>
//       ) : (
//         followingUsers.map((user) => (
//           <UserCard key={user.id} user={user} navigate={navigate} handleFollowUpdate={handleFollowUpdate} isFollowing={true} />
//         ))
//       )}
//     </div>
//   );
// };

// const UserCard = ({ user, navigate, handleFollowUpdate, isFollowing }) => {
//   return (
    
//     <div className="flex justify-between items-center mb-3 p-3 border border-gray-700 rounded-xl bg-gray-900 bg-opacity-60 transition hover:scale-105">
//       <div className="flex items-center cursor-pointer" onClick={() => navigate(`/profile/${user.id}`)}>
//         <img src={user.profileImage || "/defaultpic.jpg"} alt={user.username} className="w-12 h-12 rounded-full border border-gray-600 shadow-md" />
//         <div className="ml-3">
//           <p className="text-sm font-semibold">{user.username}</p>
//           <p className="text-xs text-gray-400">{user.followers} Followers</p>
//         </div>
//       </div>
//       <button
//         className="relative overflow-hidden flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white border border-white rounded-full transition-all duration-500 hover:text-black hover:border-black group"
//         onClick={() => handleFollowUpdate(user.id, !isFollowing)}
//       >
//         <span className="relative z-10 flex items-center">
//           {isFollowing ? <PiUserMinus className="mr-1" size={14} /> : <PiUserPlus className="mr-1" size={14} />}
//           {isFollowing ? "Unfollow" : "Follow"}
//         </span>
//         <span className="absolute inset-0 bg-white transition-all duration-500 transform scale-x-0 origin-center group-hover:scale-x-100"></span>
//       </button>
//     </div>
//   );
// };

// export default RightSidebar;

import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, doc, onSnapshot, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PiUserPlus, PiUserMinus } from "react-icons/pi";

const RightSidebar = ({ followingList, handleFollowUpdate }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [whoToFollow, setWhoToFollow] = useState([]);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, async (querySnapshot) => {
      const usersList = [];
      const followingListUpdated = [];

      for (const docSnap of querySnapshot.docs) {
        if (docSnap.id !== currentUser.uid) {
          const userData = {
            id: docSnap.id,
            ...docSnap.data(),
            isFollowing: followingList.includes(docSnap.id),
          };

          usersList.push(userData);
          if (userData.isFollowing) {
            followingListUpdated.push(userData);
          }
        }
      }

      setUsers(usersList);
      setLoading(false);
      setWhoToFollow(usersList.filter((user) => !user.isFollowing));
      setFollowingUsers(followingListUpdated);
    });

    return () => unsubscribe();
  }, [currentUser, followingList]);

  const handleFollow = async (userId, isFollowing) => {
    if (!currentUser) return;

    const followRef = doc(db, `users/${currentUser.uid}/following`, userId);
    const followerRef = doc(db, `users/${userId}/followers`, currentUser.uid);
    const userRef = doc(db, "users", userId);
    const currentUserRef = doc(db, "users", currentUser.uid);
    const notificationRef = doc(db, `users/${userId}/notifications`, `${currentUser.uid}_follow`);

    try {
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUsername = currentUserDoc.exists() ? currentUserDoc.data().username : "Unknown User";

      if (isFollowing) {
        // Unfollow
        await deleteDoc(followRef);
        await deleteDoc(followerRef);
        await updateDoc(userRef, { followers: Math.max((users.find(user => user.id === userId)?.followers || 0) - 1, 0) });
        await updateDoc(currentUserRef, { following: Math.max((users.find(user => user.id === userId)?.following || 0) - 1, 0) });
        await deleteDoc(notificationRef);

        setWhoToFollow(prev => [...prev, users.find(user => user.id === userId)]);
        setFollowingUsers(prev => prev.filter(user => user.id !== userId));
      } else {
        // Follow
        await setDoc(followRef, { followedAt: new Date() });
        await setDoc(followerRef, { userId: currentUser.uid });
        await updateDoc(userRef, { followers: (users.find(user => user.id === userId)?.followers || 0) + 1 });
        await updateDoc(currentUserRef, { following: (users.find(user => user.id === userId)?.following || 0) + 1 });

        await setDoc(notificationRef, {
          type: "follow",
          senderId: currentUser.uid,
          senderUsername: currentUsername,
          timestamp: serverTimestamp(),
          seen: false,
          message: "started following you."
        });

        setWhoToFollow(prev => prev.filter(user => user.id !== userId));
        setFollowingUsers(prev => [...prev, users.find(user => user.id === userId)]);
      }

      handleFollowUpdate(userId, !isFollowing);
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  return (
    <div className="fixed right-0 top-0 w-72 max-w-[300px] h-screen bg-white/10 backdrop-blur-lg shadow-lg border-l border-white/20 p-6 text-white z-50 rounded-l-3xl overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
      {/* Who to Follow Section */}
      <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">Who to Follow</h2>
      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : whoToFollow.length === 0 ? (
        <p className="text-gray-500">No new suggestions.</p>
      ) : (
        whoToFollow.map((user) => (
          <UserCard key={user.id} user={user} navigate={navigate} handleFollow={handleFollow} isFollowing={false} />
        ))
      )}

      {/* Following List Section */}
      <h2 className="text-xl font-semibold mt-6 mb-4 border-b border-gray-600 pb-2">My Following</h2>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : followingUsers.length === 0 ? (
        <p className="text-gray-500">You're not following anyone yet.</p>
      ) : (
        followingUsers.map((user) => (
          <UserCard key={user.id} user={user} navigate={navigate} handleFollow={handleFollow} isFollowing={true} />
        ))
      )}
    </div>
  );
};

const UserCard = ({ user, navigate, handleFollow, isFollowing }) => {
  return (
    <div className="flex justify-between items-center mb-3 p-3 border border-gray-700 rounded-xl bg-gray-900 bg-opacity-60 transition hover:scale-105">
      <div className="flex items-center cursor-pointer" onClick={() => navigate(`/peofile1/${user.id}`)}>
        <img src={user.profileImage || "/defaultpic.jpg"} alt={user.username} className="w-12 h-12 rounded-full border border-gray-600 shadow-md" />
        <div className="ml-3">
          <p className="text-sm font-semibold">{user.username}</p>
          <p className="text-xs text-gray-400">{user.followers} Followers</p>
        </div>
      </div>
      <button
        className="relative overflow-hidden flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white border border-white rounded-full transition-all duration-500 hover:text-black hover:border-black group"
        onClick={() => handleFollow(user.id, isFollowing)}
      >
        <span className="relative z-10 flex items-center">
          {isFollowing ? <PiUserMinus className="mr-1" size={14} /> : <PiUserPlus className="mr-1" size={14} />}
          {isFollowing ? "Unfollow" : "Follow"}
        </span>
        <span className="absolute inset-0 bg-white transition-all duration-500 transform scale-x-0 origin-center group-hover:scale-x-100"></span>
      </button>
    </div>
  );
};

export default RightSidebar;
