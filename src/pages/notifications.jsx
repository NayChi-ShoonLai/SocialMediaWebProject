import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { PiUserCheck, PiClock, PiHeart, PiPaperPlaneTilt, PiChatCircle } from "react-icons/pi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { HiTrash } from "react-icons/hi"; 
import { IoArrowBack } from "react-icons/io5"; 
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom"; 

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const currentUser = auth.currentUser;
  const navigate = useNavigate(); 

  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, `users/${currentUser.uid}/notifications`);
    const q = query(notificationsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allNotifications = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        allNotifications.push({ id: docSnap.id, ...data });
      });

      setNotifications(allNotifications);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.menu-button') && !e.target.closest('.menu-container')) {
        setMenuOpen(null); 
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  const markNotificationAsRead = async (notiId) => {
    if (!currentUser) return;
    const notiRef = doc(db, `users/${currentUser.uid}/notifications`, notiId);
    await updateDoc(notiRef, { seen: true });
  };

  const markNotificationAsUnread = async (notiId) => {
    if (!currentUser) return;
    const notiRef = doc(db, `users/${currentUser.uid}/notifications`, notiId);
    await updateDoc(notiRef, { seen: false });
  };

  const deleteNotification = async (notiId) => {
    if (!currentUser) return;
    const notiRef = doc(db, `users/${currentUser.uid}/notifications`, notiId);
    await deleteDoc(notiRef);
    setNotifications((prev) => prev.filter((noti) => noti.id !== notiId));
  };

  const deleteAllNotifications = async () => {
    if (!currentUser || notifications.length === 0) return;

    const batchDeletes = notifications.map(async (noti) => {
      const notiRef = doc(db, `users/${currentUser.uid}/notifications`, noti.id);
      await deleteDoc(notiRef);
    });

    await Promise.all(batchDeletes);
    setNotifications([]);
  };

  const toggleMenu = (id) => {
    setMenuOpen(menuOpen === id ? null : id);
  };

  const getNotificationIcon = (message) => {
    if (message.includes("liked your")) return <PiHeart className="text-red-500" size={24} />;
    if (message.includes("commented on")) return <PiChatCircle className="text-green-500" size={24} />;
    if (message.includes("shared a new post")) return <PiPaperPlaneTilt className="text-purple-500" size={24} />;
    return <PiUserCheck className="text-blue-500" size={24} />;
  };

  return (
    <div className="flex justify-center min-h-screen bg-[rgba(0,0,0,0.8)] w-screen w-screen backdrop-blur-sm ">
        <div className="mt-10 mb-10 relative w-full max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="">
      <button
        onClick={() => navigate(-1)}
        className="fixed left-15 top-4 p-2 rounded-full bg-white hover:bg-gray-500 transition-colors duration-200 mt-10"
      >
        <IoArrowBack className="text-gray-700" size={24} />
      </button>
      
      <div className="flex justify-between items-center mb-4">

        <h2 className="text-2xl text-black font-bold">Notifications</h2>

        {notifications.length > 0 && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-30 border border-gray-300 
                      text-gray-700 rounded-lg shadow-md backdrop-blur-md 
                      hover:bg-opacity-50 hover:scale-105 transition-all duration-200 ease-in-out"
            onClick={deleteAllNotifications}
          >
            <HiTrash className="text-gray-600" size={18} />
            <span className="font-medium">Delete All</span>
          </button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center">No notifications yet.</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((noti) => (
            <div
              key={noti.id}
              className={`p-4 text-black rounded-lg border flex items-center justify-between space-x-3 cursor-pointer relative 
                ${noti.seen ? "bg-gray-100" : "bg-blue-100 hover:bg-blue-200 transition"}`}
              onClick={() => markNotificationAsRead(noti.id)}
            >
              <div className="flex items-center space-x-3">
                {getNotificationIcon(noti.message)}
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{noti.senderUsername}</span> {noti.message}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <PiClock className="mr-1" size={14} />
                    {noti.timestamp ? formatDistanceToNow(noti.timestamp.toDate(), { addSuffix: true }) : "Just now"}
                  </p>
                </div>
              </div>

              {/* Notification Menu */}
              <div className="relative menu-container">
                <button
                  className="p-2 rounded-full hover:bg-gray-200 menu-button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the document click handler
                    toggleMenu(noti.id);
                  }}
                >
                  <BsThreeDotsVertical size={20} />
                </button>

                {menuOpen === noti.id && (
                  <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border z-50">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(noti.id);
                        setMenuOpen(null);
                      }}
                    >
                      Delete
                    </button>
                    {noti.seen ? (
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsUnread(noti.id);
                          setMenuOpen(null);
                        }}
                      >
                        Mark as Unread
                      </button>
                    ) : (
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsRead(noti.id);
                          setMenuOpen(null);
                        }}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
    </div>
    
  );
};

export default Notifications;