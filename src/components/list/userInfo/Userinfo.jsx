import { useUserStore } from "../../../userStore";

const Userinfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="p-5 flex items-center justify-between">
      <div className="flex items-center gap-5">
        {/* <img src="./avatar.png" alt="User Avatar" className="w-10 h-10 rounded-full object-cover" /> */}
        <img className="w-10 h-10 rounded-full object-cover"
                            src={currentUser?.profileImage || "/defaultpic.jpg"}
                            alt="Profile"
                         />
        <h2 className="text-lg font-semibold text-black">{currentUser.username}</h2>
        {/* <h2 className="text-lg font-semibold text-white">
          {currentUser?.username || "User"}
        </h2> */}
      </div>
      <div className="flex gap-5">
        <img src="./more.png" alt="More Options" className="w-5 h-5 cursor-pointer" />
        <img src="./video.png" alt="Video Call" className="w-5 h-5 cursor-pointer" />
        <img src="./edit.png" alt="Edit Profile" className="w-5 h-5 cursor-pointer" />
      </div>
    </div>
  );
};

export default Userinfo;
