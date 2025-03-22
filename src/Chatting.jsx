import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./pages/Login";
import Notification from "./components/notification/Notification";
import { useUserStore } from "./userStore";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useChatStore } from "./chatStore";

const Chatting = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen text-white text-2xl font-semibold bg-[rgba(17,25,40,0.9)] rounded-lg p-12">
        Loading...
      </div>
    );

  return (
    <div
      className="flex items-center justify-center w-screen h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/bgwood.jpg')" }}
    >
      <div className="w-[90vw] h-[90vh] bg-[rgba(255, 255, 255, 0.53)] backdrop-blur-lg rounded-lg border border-[rgba(0,0,0,0.1)] flex shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {currentUser ? (
          <>
            <List />
            {chatId && <Chat />}
            {chatId && <Detail />}
          </>
        ) : (
          <Login />
        )}
        <Notification />
      </div>
    </div>
  );
};

export default Chatting;
