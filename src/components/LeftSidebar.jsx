

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  PiHouse, PiCompass, PiBell, PiEnvelope, PiUser, 
  PiPlusSquare, PiSignOut, PiList, 
  PiShare
} from "react-icons/pi";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, collection, onSnapshot, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";

const LeftSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  // ✅ Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  // ✅ Fetch notifications in real-time
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, `users/${currentUser.uid}/notifications`);
    const unsubscribe = onSnapshot(notificationsRef, (querySnapshot) => {
      const allNotifications = [];
      let count = 0;

      querySnapshot.forEach((doc) => {
        allNotifications.push({ id: doc.id, ...doc.data() });
        if (!doc.data().seen) count++; // Count only unread notifications
      });

      setNotifications(allNotifications);
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Mark notifications as read when viewed
  const handleViewNotifications = async () => {
    if (!currentUser) return;

    const batchUpdates = notifications.map(async (noti) => {
      if (!noti.seen) {
        const notiRef = doc(db, `users/${currentUser.uid}/notifications`, noti.id);
        await updateDoc(notiRef, { seen: true });
      }
    });

    await Promise.all(batchUpdates);
    setUnreadCount(0); // Reset unread count
  };
  const handleLogout = () => {
    Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, log out"
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/logout");
      }
    });
  };
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userChatsRef = doc(db, "userchats", currentUser.uid);
    const unSub = onSnapshot(userChatsRef, (res) => {
        const chats = res.data()?.chats || [];
        const unreadMessages = chats.filter(chat => !chat.isSeen).length;
        setUnreadChatCount(unreadMessages);
    });

    return () => unSub();
}, [currentUser?.uid]);

return (
  <div className="relative w-72 transition-all duration-300 bg-white/10 backdrop-blur-lg shadow-lg h-full p-4 border border-white/20 rounded-r-3xl"> 
    <div className="flex items-center mb-4 p-2 rounded-lg">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300">
          <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-semibold text-white ml-3">SocialHive</h2>
      </div>
    </div>

    <div className="flex items-center space-x-3 p-3 cursor-pointer rounded-lg bg-white/10 border border-white/20 shadow-md"
      onClick={() => navigate(`/peofile1`)}> 
      <img 
        src={userData?.profileImage || "/defaultpic.jpg"} 
        alt="Profile" 
        className="w-10 h-10 rounded-full border border-gray-300"
      />
      <div>
        <p className="text-sm font-semibold text-white">{userData?.username || "Loading..."}</p>
        <p className="text-xs text-gray-400">View Profile</p>
      </div>
    </div>

    <nav className="mt-6">
      <ul className="space-y-4">
        <SidebarLink to="/home" icon={<PiHouse size={24} />} text="Home" />
        <SidebarLink to="/explore" icon={<PiCompass size={24} />} text="Explore" />
        <SidebarLink to="/repost" icon={<PiShare size={24} />} text="Reposts" />
        <SidebarLink to="/activity" icon={<PiShare size={24} />} text="Your Activities" />
        <li>
          <Link 
            to="/notifications" 
            className="flex items-center p-3 rounded-lg bg-white/10 border border-white/20 shadow-md hover:scale-105 transition"
            onClick={handleViewNotifications}
          >
            <PiBell size={24} className="mr-3" /> Notifications
            {unreadCount > 0 && (
              <span className="absolute top-2 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-ping">
                {unreadCount}
              </span>
            )}
          </Link>
        </li>
        <li>
          <Link to="/chatting" className="flex items-center p-3 rounded-lg bg-white/10 border border-white/20 shadow-md hover:scale-105 transition">
            <PiEnvelope size={24} className="mr-3" /> {isExpanded && "Messages"}
            {unreadChatCount > 0 && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-ping">
            {unreadChatCount}
            </span>
            )}
          </Link>
        </li>
        <SidebarLink to="/create" icon={<PiPlusSquare size={24} />} text="Create" />
        <li>
        <button onClick={handleLogout} className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-100 transition text-red-600 font-medium">
            <PiSignOut size={24} className="mr-3" /> {isExpanded && "Log out"}
          </button>
        </li>
      </ul>
    </nav>
  </div>
);
};
const SidebarLink = ({ to, icon, text }) => (
  <li>
    <Link 
      to={to} 
      className="flex items-center p-3 rounded-lg bg-white/10 border border-white/20 shadow-md hover:scale-105 transition"
    >
      {icon}
      <span className="ml-3">{text}</span>
    </Link>
  </li>
);
export default LeftSidebar;

