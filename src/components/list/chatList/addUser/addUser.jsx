import { useState, useEffect, useRef } from "react";
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useUserStore } from "../../../../userStore";

const AddUser = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [imageFile, setImageFile] = useState(null); // State for image file
  const [setImagePreview] = useState(""); // State for image preview
  const { currentUser } = useUserStore();
  const addUserRef = useRef(null);

  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addUserRef.current && !addUserRef.current.contains(e.target)) {
        onClose(); // Close the Add User box
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  
  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        const userData = querySnapShot.docs[0].data();
        setUser({
          ...userData,
          profileImage: userData.profileImage || "/defaultpic.jpg", 
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Handle adding a user
  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatRef = collection(db, "userchats");

    try {
      // Check if a chat already exists between the two users
      const userChatDoc = await getDoc(doc(userChatRef, currentUser.uid));

      if (userChatDoc.exists()) {
        const chats = userChatDoc.data().chats || [];
        const chatExists = chats.some((chat) => chat.receiverId === user.uid);

        if (chatExists) {
          alert("Chat already exists!");
          return;
        }
      }

      // Create a new chat
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Update the receiver's userchats
      await updateDoc(doc(userChatRef, user.uid), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastmessage: "",
          receiverId: currentUser.uid,
          updatedAt: Date.now(),
          ...(imageFile && { profileImage: imageFile }), // Add Base64 image if available
        }),
      });

      await updateDoc(doc(userChatRef, currentUser.uid), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastmessage: "",
          receiverId: user.uid,
          updatedAt: Date.now(),
          ...(imageFile && { profileImage: imageFile }), 
        }),
      });

      onClose(); 
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      className="w-max h-max p-8 bg-gray-800 rounded-lg absolute top-0 bottom-0 left-0 right-0 m-auto z-50"
      onClick={(e) => e.stopPropagation()} 
      ref={addUserRef} 
    >
      <form onSubmit={handleSearch} className="flex gap-5">
        <input
          type="text"
          placeholder="Username"
          name="username"
          className="p-5 rounded-lg border-none outline-none"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          className="p-5 rounded-lg bg-blue-600 text-white border-none cursor-pointer"
          onClick={(e) => e.stopPropagation()} 
        >
          Search
        </button>
      </form>


      {user && (
        <div className="mt-12 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <img
              className="w-12 h-12 rounded-full object-cover"
              src={user.profileImage} 
              alt="Profile"
            />
            <span>{user.username}</span>
          </div>
          <button
            className="p-2 rounded-lg bg-blue-600 text-white border-none cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); 
              handleAdd();
            }}
          >
            Add User
          </button>
        </div>
      )}
    </div>
  );
};

export default AddUser;