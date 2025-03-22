// // //src/App.jsx
// // import React, { useEffect, useState } from "react";
// // import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
// // import LeftSidebar from "./components/LeftSidebar";
// // import RightSidebar from "./components/RightSidebar";

// // import Login from "./pages/Login";
// // import { auth, db } from "./firebaseConfig";
// // import { onAuthStateChanged } from "firebase/auth";
// // import { ToastContainer } from "react-toastify";
// // import SearchBar from './pages/SearchBar';
// // import Post from './pages/Post';
// // import UserProfile1 from "./pages/UserProfile1";
// // import ProfileEdit1 from "./pages/ProfileEdit1";
// // import Logout from "./pages/Logout";

// // import { collection, getDocs } from "firebase/firestore";
// // import Notifications from "./pages/notifications";

// // import Home from "./pages/Home";

// // import Register from "./pages/Register";
// // import Chatting from "./Chatting";
// // import Peofile1 from "./pages/Peofile1";
// // import CreatePost1 from "./pages/CreatePost1";
// // import UserStoryViewer1 from "./pages/UserStoryViewer1";
// // import StoryViewer1 from "./pages/StoryViewer1";
// // const AppContent = ({ user, loading, followingList, handleFollowUpdate }) => {
// //   const location = useLocation();
// //   const showSidebars = user && (location.pathname.startsWith("/peofile1") || location.pathname.startsWith("/create") || location.pathname.startsWith("/home") || location.pathname.startsWith("/explore"));

// //   if (loading) return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>;

// //   return (
// //     <div className="flex">
// //       {showSidebars && <LeftSidebar />}
// //       <div className="flex-1">
// //         <Routes>
// //           <Route path="/" element={!user ? <Login /> : <Navigate to="/home" />} />
// //           <Route path="/login" element={!user ? <Login /> : <Navigate to="/peofile1" />} />
          
// //            <Route path="/peofile1" element={user ? <Peofile1 user={user} /> : <Navigate to="/login" />} />

// //           <Route path="/home" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
// //           <Route path="/peofile1/edit" element={user ? <ProfileEdit1 user={user} /> : <Navigate to="/login" />} />
         
// //           <Route path="/explore" element={user ? <SearchBar user={user} /> : <Navigate to="/login" />} />
// //           <Route path="/post/:postId" element={<Post />} />


// //           <Route path="/create" element={user ? <CreatePost1 user={user} /> : <Navigate to="/login" />} />
          
// //           <Route path="/logout" element={<Logout />} />
// //           {<Route path="/register" element={!user ? <Register /> : <Navigate to="/peofile1" />} />} 
      
         
// //          <Route path="/user-stories/:userId" element={<UserStoryViewer1 />} />
// //           <Route path="/notifications" element={<Notifications />} />

// //           <Route path="/peofile1/:userId" element={<UserProfile1 handleFollowUpdate={handleFollowUpdate} followingList={followingList} />} />
          
         
// //           <Route path="/stories" element={<StoryViewer1 />} />
// //            <Route path="/create/:postId" element={<CreatePost1 />} />            
// //           <Route path="/chatting" element={<Chatting />} />
// //         </Routes>
// //       </div>
// //       {showSidebars && <RightSidebar handleFollowUpdate={handleFollowUpdate} followingList={followingList} />}

// //     </div>
// //   );
// // };

// // const App = () => {
// //   const [user, setUser] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [followingList, setFollowingList] = useState([]);

// //   useEffect(() => {
// //     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
// //       setUser(currentUser);
// //       setLoading(false);

// //       if (currentUser) {
// //         const followingRef = collection(db, `users/${currentUser.uid}/following`);
// //         const followingSnapshot = await getDocs(followingRef);
// //         const followingData = followingSnapshot.docs.map(doc => doc.id);
// //         setFollowingList(followingData);
// //       }
// //     });

// //     return () => unsubscribe();
// //   }, []);

// //   const handleFollowUpdate = async (userId, isFollowing) => {
// //     setFollowingList(prev => {
// //       const updatedList = isFollowing ? [...prev, userId] : prev.filter(id => id !== userId);
// //       return [...updatedList]; // ✅ Ensure React re-renders with new state
// //     });

// //     try {
// //       const currentUser = auth.currentUser;
// //       if (!currentUser) return;

// //       const followingRef = doc(db, `users/${currentUser.uid}/following`, userId);
// //       const followerRef = doc(db, `users/${userId}/followers`, currentUser.uid);

// //       if (isFollowing) {
// //         // 🔥 Follow the user
// //         await setDoc(followingRef, { followedAt: new Date() });
// //         await setDoc(followerRef, { userId: currentUser.uid });
// //       } else {
// //         // 🔥 Unfollow the user
// //         await deleteDoc(followingRef);
// //         await deleteDoc(followerRef);
// //       }
// //     } catch (error) {
// //       console.error("Error updating follow status:", error);
// //     }
// //   };


// //   return (
// //     <Router>
// //       <ToastContainer />
// //       <AppContent user={user} loading={loading} followingList={followingList} handleFollowUpdate={handleFollowUpdate} />
// //     </Router>
// //   );

// // };

// // export default App;

// //src/App.jsx
// import React, { useEffect, useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
// import LeftSidebar from "./components/LeftSidebar";
// import RightSidebar from "./components/RightSidebar";

// import Login from "./pages/Login";
// import { auth, db } from "./firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";
// import { ToastContainer } from "react-toastify";
// import SearchBar from './pages/SearchBar';
// import Post1 from './pages/Post1';
// import UserProfile1 from "./pages/userprofile1";
// import ProfileEdit1 from "./pages/ProfileEdit1";
// import Logout from "./pages/Logout";

// import { collection, getDocs } from "firebase/firestore";
// import Notifications from "./pages/notifications";

// import Home1 from "./pages/Home1";

// import Register from "./pages/Register";
// import Chatting from "./Chatting";
// import Peofile1 from "./pages/Peofile1";
// import CreatePost1 from "./pages/CreatePost1";
// import UserStoryViewer1 from "./pages/UserStoryViewer1";
// import StoryViewer1 from "./pages/StoryViewer1";
// const AppContent = ({ user, loading, followingList, handleFollowUpdate }) => {
//   const location = useLocation();
//   const showSidebars = user && (location.pathname.startsWith("/peofile1") || location.pathname.startsWith("/create") || location.pathname.startsWith("/home") || location.pathname.startsWith("/explore"));

//   if (loading) return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>;

//   return (
//     <div className="flex">
//       {showSidebars && <LeftSidebar />}
//       <div className="flex-1">
//         <Routes>
//           <Route path="/" element={!user ? <Login /> : <Navigate to="/home" />} />
//           <Route path="/login" element={!user ? <Login /> : <Navigate to="/peofile1" />} />
          
//            <Route path="/peofile1" element={user ? <Peofile1 user={user} /> : <Navigate to="/login" />} />

//           <Route path="/home1" element={user ? <Home1 user={user} /> : <Navigate to="/login" />} />
//           <Route path="/peofile1/edit" element={user ? <ProfileEdit1 user={user} /> : <Navigate to="/login" />} />
         
//           <Route path="/explore" element={user ? <SearchBar user={user} /> : <Navigate to="/login" />} />
//           <Route path="/post1/:postId" element={<Post1 />} />


//           <Route path="/create" element={user ? <CreatePost1 user={user} /> : <Navigate to="/login" />} />
          
//           <Route path="/logout" element={<Logout />} />
//           {<Route path="/register" element={!user ? <Register /> : <Navigate to="/peofile1" />} />} 
      
         
//          <Route path="/user-stories/:userId" element={<UserStoryViewer1 />} />
//           <Route path="/notifications" element={<Notifications />} />

//           <Route path="/peofile1/:userId" element={<UserProfile1 handleFollowUpdate={handleFollowUpdate} followingList={followingList} />} />
          
         
//           <Route path="/stories" element={<StoryViewer1 />} />
//            <Route path="/create/:postId" element={<CreatePost1 />} />            
//           <Route path="/chatting" element={<Chatting />} />
//         </Routes>
//       </div>
//       {showSidebars && <RightSidebar handleFollowUpdate={handleFollowUpdate} followingList={followingList} />}

//     </div>
//   );
// };

// const App = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [followingList, setFollowingList] = useState([]);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       setUser(currentUser);
//       setLoading(false);

//       if (currentUser) {
//         const followingRef = collection(db, `users/${currentUser.uid}/following`);
//         const followingSnapshot = await getDocs(followingRef);
//         const followingData = followingSnapshot.docs.map(doc => doc.id);
//         setFollowingList(followingData);
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleFollowUpdate = async (userId, isFollowing) => {
//     setFollowingList(prev => {
//       const updatedList = isFollowing ? [...prev, userId] : prev.filter(id => id !== userId);
//       return [...updatedList]; // ✅ Ensure React re-renders with new state
//     });

//     try {
//       const currentUser = auth.currentUser;
//       if (!currentUser) return;

//       const followingRef = doc(db, `users/${currentUser.uid}/following`, userId);
//       const followerRef = doc(db, `users/${userId}/followers`, currentUser.uid);

//       if (isFollowing) {
//         // 🔥 Follow the user
//         await setDoc(followingRef, { followedAt: new Date() });
//         await setDoc(followerRef, { userId: currentUser.uid });
//       } else {
//         // 🔥 Unfollow the user
//         await deleteDoc(followingRef);
//         await deleteDoc(followerRef);
//       }
//     } catch (error) {
//       console.error("Error updating follow status:", error);
//     }
//   };


//   return (
//     <Router>
//       <ToastContainer />
//       <AppContent user={user} loading={loading} followingList={followingList} handleFollowUpdate={handleFollowUpdate} />
//     </Router>
//   );

// };

// export default App;

//src/App.jsx

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import RightSidebar from "./components/RightSidebar";
import Repost from "./pages/Repost";
import Login from "./pages/Login";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ToastContainer } from "react-toastify";
import SearchBar from './pages/SearchBar';
import Post from './pages/Post';
import UserProfile1 from "./pages/userprofile1";
import ProfileEdit1 from "./pages/ProfileEdit1";
import Logout from "./pages/Logout";
import Activity from "./pages/Activity";
import { collection, getDocs } from "firebase/firestore";
import Notifications from "./pages/notifications";

import Home from "./pages/Home";

import Register from "./pages/Register";
import Chatting from "./Chatting";
import Peofile1 from "./pages/Peofile1";
import CreatePost1 from "./pages/CreatePost1";
import UserStoryViewer1 from "./pages/UserStoryViewer1";
import StoryViewer1 from "./pages/StoryViewer1";
const AppContent = ({ user, loading, followingList, handleFollowUpdate }) => {
  const location = useLocation();
  const showSidebars = user && (location.pathname.startsWith("/peofile1") || location.pathname.startsWith("/create") || location.pathname.startsWith("/home") || location.pathname.startsWith("/explore"));

  if (loading) return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>;

  return (
    <div className="flex">
      {showSidebars && <LeftSidebar />}
      <div className="w-[950px]">
        <Routes>
          <Route path="/" element={!user ? <Login /> : <Navigate to="/home" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/peofile1" />} />
          
           <Route path="/peofile1" element={user ? <Peofile1 user={user} /> : <Navigate to="/login" />} />

          <Route path="/home" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
          <Route path="/peofile1/edit" element={user ? <ProfileEdit1 user={user} /> : <Navigate to="/login" />} />
         
          <Route path="/explore" element={user ? <SearchBar user={user} /> : <Navigate to="/login" />} />
          <Route path="/post/:postId" element={<Post />} />


          <Route path="/create" element={user ? <CreatePost1 user={user} /> : <Navigate to="/login" />} />
          
          <Route path="/logout" element={<Logout />} />
          {<Route path="/register" element={!user ? <Register /> : <Navigate to="/peofile1" />} />} 
          <Route path="/post/:postId" element={<Post />} />

      
         
         <Route path="/user-stories/:userId" element={<UserStoryViewer1 />} />
          <Route path="/notifications" element={<Notifications />} />

          <Route path="/peofile1/:userId" element={<UserProfile1 handleFollowUpdate={handleFollowUpdate} followingList={followingList} />} />
          
         
          <Route path="/stories" element={<StoryViewer1 />} />
           <Route path="/create/:postId" element={<CreatePost1 />} />            
          <Route path="/chatting" element={<Chatting />} />
          <Route path="/repost" element={<Repost />} />  {/* ✅ Route for Repost */}
          <Route path="/activity" element={<Activity />} />  {/* ✅ Route for Repost */}
        </Routes>
      </div>
      {showSidebars && <RightSidebar handleFollowUpdate={handleFollowUpdate} followingList={followingList} />}

    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followingList, setFollowingList] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const followingRef = collection(db, `users/${currentUser.uid}/following`);
        const followingSnapshot = await getDocs(followingRef);
        const followingData = followingSnapshot.docs.map(doc => doc.id);
        setFollowingList(followingData);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFollowUpdate = async (userId, isFollowing) => {
    setFollowingList(prev => {
      const updatedList = isFollowing ? [...prev, userId] : prev.filter(id => id !== userId);
      return [...updatedList]; // ✅ Ensure React re-renders with new state
    });

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const followingRef = doc(db, `users/${currentUser.uid}/following`, userId);
      const followerRef = doc(db, `users/${userId}/followers`, currentUser.uid);

      if (isFollowing) {
        // 🔥 Follow the user
        await setDoc(followingRef, { followedAt: new Date() });
        await setDoc(followerRef, { userId: currentUser.uid });
      } else {
        // 🔥 Unfollow the user
        await deleteDoc(followingRef);
        await deleteDoc(followerRef);
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };


  return (
    <Router>
      <ToastContainer />
      <AppContent user={user} loading={loading} followingList={followingList} handleFollowUpdate={handleFollowUpdate} />
    </Router>
  );

};

export default App;
