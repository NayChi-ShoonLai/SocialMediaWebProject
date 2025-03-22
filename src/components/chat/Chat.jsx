import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useChatStore } from "../../chatStore";
import { useUserStore } from "../../userStore";
import upload from "../../upload";

const Chat = () => {
  const [chat, setChat] = useState();
  const [openEmojiPicker, setOpenEmojiPicker] = useState(false);
  const [openSettingsEmojiPicker, setOpenSettingsEmojiPicker] = useState(false);
  const [text, setText] = useState("");
  //const [img, setImg] = useState({ file: null, url: "" });
  const [image, setImage] = useState({img: null, url: "" });

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    chatMessageColor: "#3b82f6",
    quickReaction: "👍",
    theme: "light",
    nicknames: "",
    notifications: true,
  });

  // Track unsaved settings changes
  const [unsavedSettings, setUnsavedSettings] = useState({ ...settings });

  const [clickedMessageId, setClickedMessageId] = useState(null);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const endRef = useRef(null);
  const lastMessageRef = useRef(null);

  // Scroll to bottom only when a new message is added
  useEffect(() => {
    if (chat?.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage !== lastMessageRef.current) {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
        lastMessageRef.current = lastMessage;
      }
    }
  }, [chat?.messages]);

  // Fetch chat messages
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  // Fetch chat-specific settings
  useEffect(() => {
    const fetchChatSettings = async () => {
      const chatSettingsRef = doc(db, "chats", chatId);
      const chatSettingsSnapshot = await getDoc(chatSettingsRef);

      if (chatSettingsSnapshot.exists()) {
        const chatSettings = chatSettingsSnapshot.data().chatSettings || {};
        setSettings((prev) => ({
          ...prev,
          chatMessageColor: chatSettings.chatMessageColor || "#3b82f6",
          quickReaction: chatSettings.quickReaction || "👍",
          nicknames: chatSettings.nicknames || {},
        }));
        setUnsavedSettings((prev) => ({
          ...prev,
          chatMessageColor: chatSettings.chatMessageColor || "#3b82f6",
          quickReaction: chatSettings.quickReaction || "👍",
          nicknames: chatSettings.nicknames || {},
        }));
      }
    };

    fetchChatSettings();
  }, [chatId]);

  const handleEmoji = (e, setTextFunction) => {
    setTextFunction((prev) => prev + e.emoji);
    setOpenEmojiPicker(false);
    setOpenSettingsEmojiPicker(false);
  };

  // const handleImg = (e) => {
  //   if (e.target.files[0]) {
  //     setImg({
  //       file: e.target.files[0],
  //       url: URL.createObjectURL(e.target.files[0]),
  //     });
  //   }
  // };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage({ 
                img: reader.result,
                url: URL.createObjectURL(file),
                      }); // ✅ Update state with base64 image
        };
        reader.readAsDataURL(file);
    }
};

  const handleSend = async (messageText) => {
    if (messageText === "") return;
    let imgUrl = null;

    try {
      // if (img.file) {
      //   imgUrl = await upload(img.file);
      // }
      // await updateDoc(doc(db, "chats", chatId), {
      //   messages: arrayUnion({
      //     senderId: currentUser.uid,
      //     text: messageText,
      //     createdAt: new Date(),
      //     ...(imgUrl && { img: imgUrl }),
      //   }),
      // });
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.uid,
          text,
          createdAt: new Date(),
          // img : image.img,
          ...(image.img && { img: image.img }),
        }),
      });

      const userIDs = [currentUser.uid, user.uid];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

          userChatsData.chats[chatIndex].lastMessage = messageText;
          userChatsData.chats[chatIndex].isSeen = id === currentUser.uid ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
    } catch (err) {
      console.log(err);
    }

    setImage({ file: null, url: "" });
    setText("");
  };

  const handleSettingsChange = (field, value) => {
    setUnsavedSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      const chatSettingsRef = doc(db, "chats", chatId);

      await updateDoc(chatSettingsRef, {
        chatSettings: {
          chatMessageColor: unsavedSettings.chatMessageColor || "#3b82f6",
          quickReaction: unsavedSettings.quickReaction || "👍",
          nicknames: unsavedSettings.nicknames || {},
        },
      }, { merge: true });

      // Sync the settings state with unsavedSettings
      setSettings({ ...unsavedSettings });
      console.log("Chat settings saved successfully!");
      setShowSettings(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleCancelSettings = () => {
    // Revert unsavedSettings to the original settings
    setUnsavedSettings({ ...settings });
    setShowSettings(false);
  };

  const handleInfoClick = () => {
    setShowSettings(true);
  };

  return (
    <div className="flex flex-col flex-[2] border-x border-gray-200 h-full relative bg-[rgba(0,0,0,0.1)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          {/* <img
            src={user?.profileImage || "/defaultpic.jpg"}
            alt="User"
            className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
          /> */}
          <img className="w-12 h-12 rounded-full object-cover"
                            src={user?.profileImage || "/defaultpic.jpg"}
                            alt="Profile"
                         />
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-gray-800">
              {settings.nicknames?.[user?.uid] || user?.username}
            </span>
          </div>
        </div>
        <div className="flex gap-4 bg-white">
          <img src="./phone.png" alt="Call" className="w-6 h-6 cursor-pointer hover:opacity-80" />
          <img src="./video.png" alt="Video Call" className="w-6 h-6 cursor-pointer hover:opacity-80" />
          <img src="./info.png" alt="Info" className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={handleInfoClick} />
        </div>
      </div>

      {/* Chat Box */}
      <div className="flex flex-col flex-1 p-4 overflow-y-auto gap-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {chat?.messages?.map((message, index) => {
          const isSameSender = index > 0 && message.senderId === chat.messages[index - 1]?.senderId;
          const isLastMessage = index === chat.messages.length - 1 || message.senderId !== chat.messages[index + 1]?.senderId;

          const messageId = message.createdAt?.toMillis?.() || message.createdAt;
          const isClicked = clickedMessageId === messageId;

          return (
            <div
              key={`${messageId}-${Math.random()}`}
              className={`max-w-[70%] flex gap-3 ${
                message.senderId === currentUser?.uid ? "self-end" : "self-start"
              } ${isLastMessage ? "justify-end" : ""} ${
                message.senderId !== currentUser?.uid && !isLastMessage ? "ml-13" : ""
              }`}
              onClick={() => setClickedMessageId(isClicked ? null : messageId)}
            >
              {isLastMessage && message.senderId !== currentUser?.uid && (
                // <img
                //   src="./avatar.png"
                //   alt="Sender Logo"
                //   className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                // />
                <img className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                            src={user?.profileImage || "/defaultpic.jpg"}
                            alt="Profile"
                         />
              )}
              <div className="flex flex-col gap-1">
                {message.img && (
                  <img
                    src={message.img}
                    alt="Sent"
                    className="w-full max-h-80 rounded-md object-cover shadow-sm"
                  />
                )}
                <p
                  style={{
                    backgroundColor:
                      message.senderId === currentUser?.uid
                        ? settings.chatMessageColor
                        : "#e5e7eb",
                  }}
                  className={`p-3 rounded-lg text-gray-800 cursor-pointer shadow-md hover:shadow-lg transition-shadow`}
                >
                  {message.text}
                </p>
                {isClicked && (
                  <span className="text-sm text-gray-500">
                    {new Date(message.createdAt?.toMillis?.() || message.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {image.url && (
          <div className="self-end">
            <img
              src={image.img}
              alt="Preview"
              className="w-full max-h-80 rounded-md object-cover shadow-sm"
            />
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      {/* Chat Input */}
      <div className="flex items-center p-4 border-t border-gray-200 bg-white shadow-sm gap-4">
        <div className="flex gap-4">
          <label htmlFor="file" className="cursor-pointer hover:opacity-80">
            <img src="./img.png" alt="Upload" className="w-6 h-6" />
          </label>
          <input type="file" id="file" className="hidden" onChange={handleImg} />
          <img src="./camera.png" alt="Camera" className="w-6 h-6 cursor-pointer hover:opacity-80" />
          <img src="./mic.png" alt="Mic" className="w-6 h-6 cursor-pointer hover:opacity-80" />
        </div>

        {/* Type Message Box */}
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked ? "You cannot send messages" : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend(text);
            }
          }}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
          className="flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-full outline-none disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 border"
        />

        <div className="relative">
          <img
            src="./emoji.png"
            alt="Emoji"
            className="w-6 h-6 cursor-pointer hover:opacity-80"
            onClick={() => setOpenEmojiPicker((prev) => !prev)}
          />
          {openEmojiPicker && (
            <div className="absolute bottom-10 left-0 z-10">
              <EmojiPicker onEmojiClick={(e) => handleEmoji(e, setText)} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xl cursor-pointer hover:opacity-80"
            onClick={() => handleSend(settings.quickReaction)}
          >
            {settings.quickReaction}
          </span>
        </div>

        {/* Send Button */}
        <button
          className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          onClick={() => handleSend(text)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[350px] shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Chat Message Color:</label>
                <select
                  value={unsavedSettings.chatMessageColor}
                  onChange={(e) => handleSettingsChange("chatMessageColor", e.target.value)}
                  className="w-full p-2 mt-1 bg-gray-100 rounded-md text-gray-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="#3b82f6">Blue</option>
                  <option value="#ef4444">Red</option>
                  <option value="#10b981">Green</option>
                  <option value="#f08853">Orange</option>
                  <option value="#8b5cf6">Purple</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quick Reaction:</label>
                <div className="relative">
                  <button
                    onClick={() => setOpenSettingsEmojiPicker((prev) => !prev)}
                    className="w-full p-2 mt-1 bg-gray-100 rounded-md text-gray-800 focus:ring-2 focus:ring-blue-500"
                  >
                    {unsavedSettings.quickReaction || "Pick an emoji"}
                  </button>
                  {openSettingsEmojiPicker && (
                    <div className="absolute bottom-0 left-full ml-2 z-10">
                      <EmojiPicker
                        onEmojiClick={(e) => {
                          handleSettingsChange("quickReaction", e.emoji);
                          setOpenSettingsEmojiPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Your Nickname:</label>
                <input
                  type="text"
                  value={unsavedSettings.nicknames?.[currentUser.uid] || ""}
                  onChange={(e) =>
                    handleSettingsChange("nicknames", {
                      ...unsavedSettings.nicknames,
                      [currentUser.uid]: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-1 bg-gray-100 rounded-md text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{user.username}'s Nickname:</label>
                <input
                  type="text"
                  value={unsavedSettings.nicknames?.[user.uid] || ""}
                  onChange={(e) =>
                    handleSettingsChange("nicknames", {
                      ...unsavedSettings.nicknames,
                      [user.uid]: e.target.value,
                    })
                  }
                  className="w-full p-2 mt-1 bg-gray-100 rounded-md text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={handleSaveSettings}
                >
                  Save Settings
                </button>
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                  onClick={handleCancelSettings}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
