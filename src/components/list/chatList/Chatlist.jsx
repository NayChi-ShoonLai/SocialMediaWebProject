import { useEffect, useState, useRef } from "react";
import AddUser from "./addUser/addUser";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useUserStore } from "../../../userStore";
import { useChatStore } from "../../../chatStore";

const Chatlist = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState("");
    const addUserRef = useRef(null);

    const { currentUser } = useUserStore();
    const { changeChat } = useChatStore();

    // Fetch chats and user data
    // useEffect(() => {
    //     const unSub = onSnapshot(doc(db, "userchats", currentUser.uid), async (res) => {
    //         const items = res.data().chats;

    //         // Fetch user data for each chat
    //         const promises = items.map(async (item) => {
    //             const userDocRef = doc(db, "users", item.receiverId);
    //             const userDocSnap = await getDoc(userDocRef);
    //             const user = userDocSnap.data();

    //             // Handle profileImage (URL or Base64)
    //             const profileImage = user?.profileImage
    //                 ? user.profileImage.startsWith("http") // Check if it's a URL
    //                     ? user.profileImage // Use as-is if it's a URL
    //                     : `data:image/jpeg;base64,${user.profileImage}` // Add prefix if it's Base64
    //                 : "/defaultpic.jpg"; // Fallback to default image

    //             return { ...item, user: { ...user, profileImage } };
    //         });

    //         const chatData = await Promise.all(promises);
    //         setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
    //     });

    //     return () => unSub();
    // }, [currentUser.uid]);
    useEffect(() => {
        const unSub = onSnapshot(doc(db, "userchats", currentUser.uid), async (res) => {
            const items = res.data().chats;
            const promises = items.map(async (item) => {
                const userDocRef = doc(db, "users", item.receiverId);
                const userDocSnap = await getDoc(userDocRef);
                const user = userDocSnap.data();
                return { ...item, user };
            });
            const chatData = await Promise.all(promises);
            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });
        return () => unSub();
    }, [currentUser.uid]);


    // Handle chat selection
    const handleSelect = async (chat) => {
        const userChats = chats.map((item) => {
            const { user, ...rest } = item;
            return rest;
        });

        const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
        userChats[chatIndex].isSeen = true;

        try {
            await updateDoc(doc(db, "userchats", currentUser.uid), { chats: userChats });
            changeChat(chat.chatId, chat.user);
        } catch (err) {
            console.log(err);
        }
    };

    // Handle clicks outside the AddUser component
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (addUserRef.current && !addUserRef.current.contains(event.target)) {
                setAddMode(false);
            }
        };

        if (addMode) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [addMode]);

    // Filter chats based on search input
    // const filteredChats = chats.filter((c) =>
    //     c.user.username.toLowerCase().includes(input.toLowerCase())
    // );
    const filteredChats = chats.filter((c) => c.user.username.toLowerCase().includes(input.toLowerCase()));

    return (
        <div className="group flex flex-col flex-1 p-4 overflow-y-auto gap-4 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full group-hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
            {/* Search Bar */}
            <div className="flex items-center gap-5 p-5">
                <div className="flex items-center gap-5 bg-gray-800 bg-opacity-50 rounded-lg p-2 flex-1">
                    <img src="/search.png" alt="Search" className="w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="bg-transparent border-none outline-none text-white flex-1"
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <img
                    src={addMode ? "./minus.png" : "./plus.png"}
                    alt="Toggle Add User"
                    className="w-9 h-9 bg-gray-800 bg-opacity-50 p-2 rounded-lg cursor-pointer"
                    onClick={() => setAddMode((prev) => !prev)}
                />
            </div>

            {/* Chat List */}
            {filteredChats.map((chat) => {
                console.log("Profile Image:", chat.user?.profileImage); // Debugging
                return (
                    <div
                        key={chat.chatId}
                        className={`flex items-center gap-5 p-4 cursor-pointer border-b border-gray-700 ${
                            chat?.isSeen ? "bg-transparent" : "bg-gray-800]"
                        }`}
                        onClick={() => handleSelect(chat)}
                    >
                        {/* Profile Image */}
                        {/* <img
                            className="w-10 h-10 rounded-full object-cover"
                            src={chat.user?.profileImage || "/defaultpic.jpg"} // Use URL or default image
                            alt="Profile"
                            onError={(e) => {
                                e.target.src = "/defaultpic.jpg"; // Fallback to default image if the URL is invalid
                            }}
                        /> */}
                        <img className="w-10 h-10 rounded-full object-cover"
                            src={chat.user?.profileImage || "/defaultpic.jpg"}
                            alt="Profile"
                         />
                        <div className="flex flex-col gap-2">
                            <span className="font-medium text-black">{chat.user.username}</span>
                            <p className="text-sm font-light text-gray-800">{chat.lastMessage}</p>
                        </div>
                    </div>
                );
            })}

            {/* Add User Component */}
            {addMode && <AddUser onClose={() => setAddMode(false)} />}
        </div>
    );
};

export default Chatlist;