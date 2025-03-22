import { useEffect, useState } from "react";
import { useChatStore } from "../../chatStore";
import { auth, db } from "../../firebaseConfig";
import { useUserStore } from "../../userStore";
import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Detail = () => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
  const { currentUser } = useUserStore();
  const [sharedImages, setSharedImages] = useState([]);

  const [chat, setChat] = useState();

  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      const chatData = res.data();
      if (chatData?.messages) {
        const images = chatData.messages.filter((msg) => msg.img).map((msg) => msg.img);
        setSharedImages(images);
      }
    });

    return () => unSub();
  }, [chatId]);

  const handleBlocked = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", currentUser.uid);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteMessages = async () => {
    try {
      const chatRef = doc(db, "chats", chatId);
      //const userChatsRef = doc(db, "userchats", user.uid);

      await updateDoc(chatRef, {
        messages: [],
      });

  
      setSharedImages([]); // Clear shared images state
      console.log("All messages deleted successfully");
    } catch (err) {
      console.error("Error deleting messages:", err);
    }
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Sign out the user
      //await auth.signOut();
      // Redirect to /logout page
      navigate("/logout");
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  };

  // Fetch nickname
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  return (
    <div className="flex-1">
      <div className="p-4 flex flex-col items-center gap-2 border-b border-gray-300/20">
        {/* <img src="./avatar.png" alt="" className="w-16 h-16 rounded-full object-cover" /> */}
        <img className="w-16 h-16 rounded-full object-cover"
                            src={user?.profileImage || "/defaultpic.jpg"}
                            alt="Profile"
                         />
                         
        <h2 className="text-lg text-black font-semibold">{chat?.chatSettings?.nicknames?.[user?.uid] || user?.username}</h2>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div>
          <div className="font-semibold text-black">Shared photos</div>
          <div className="flex flex-col gap-5 mt-5">
            {sharedImages.length > 0 ? (
              sharedImages.map((img, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={img} alt={`Shared ${index}`} className="w-10 h-10 rounded-md object-cover" />
                    <span className="text-xs text-gray-400 font-light">
                      {decodeURIComponent(new URL(img).pathname.split("/").pop()).slice(0, 12) + "..."}
                    </span>
                  </div>
                  <a href={img} download>
                    <img src="./download.png" alt="Download" className="w-7 h-7 bg-gray-800/30 p-2 rounded-full cursor-pointer" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No shared images yet.</p>
            )}
          </div>
        </div>

        <button
          onClick={handleDeleteMessages}
          className="p-2 bg-red-400 text-white rounded-md hover:bg-red-600 transition">
          Delete Conversation
        </button>
        <button
          onClick={handleBlocked}
          className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-800 transition"
        >
          {isCurrentUserBlocked ? "You are Blocked" : isReceiverBlocked ? "User Blocked" : "Block User"}
        </button>
        <button
          className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-800 transition"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;
