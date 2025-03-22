//src/pages/ProfileEdit.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { PiPencilSimple, PiMapPin, PiEnvelopeSimple, PiPhone, PiUser, PiBriefcase, PiGraduationCap, PiNotePencil, PiLock } from "react-icons/pi";
import { toast } from "react-toastify";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";


const ProfileEdit1 = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: "Fill your info",
    location: "Fill your info",
    email: "Fill your info",
    phone: "Fill your info",
    work: "Fill your info",
    education: "Fill your info",
    bio: "Fill your info",
    profileImage: "/defaultpic.jpg",
    backgroundImage: "/defaultcover.jpg",
  });

  const [loading, setLoading] = useState(true);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserData({
            ...userData,
            profileImage: userData.profileImage || "/defaultpic.jpg",
            backgroundImage: userData.backgroundImage || "/defaultcover.jpg",
          });
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUserData((prev) => ({ ...prev, profileImage: reader.result })); // ✅ Update state with base64 image
        };
        reader.readAsDataURL(file);
    }
};


const handleBackgroundImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUserData((prev) => ({ ...prev, backgroundImage: reader.result })); // ✅ Update state with base64 image
        };
        reader.readAsDataURL(file);
    }
};

const handlePasswordChange = async () => {
  const user = auth.currentUser;
  if (!user) {
    toast.error("You must be logged in to change your password!");
    return;
  }

  if (!currentPassword || !newPassword) {
    toast.error("Please fill in both current and new password fields!");
    return;
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    toast.success("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
  } catch (error) {
    toast.error("Error updating password: " + error.message);
    console.error("Password Update Error:", error);
  }
};



const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
        toast.error("You must be logged in to update your profile!");
        return;
    }

    try {
        // ✅ Save to Firestore with both images
        await setDoc(
            doc(db, "users", user.uid),
            { 
                ...userData,
                profileImage: userData.profileImage || "/defaultpic.jpg", // ✅ Store profile image (base64 or default)
                backgroundImage: userData.backgroundImage || "/defaultcover.jpg" // ✅ Store background image (base64 or default)
            },
            { merge: true }
        );

        toast.success("Profile updated successfully!");
        navigate("/peofile1"); // ✅ Redirect to profile
    } catch (error) {
        toast.error("Error updating profile: " + error.message);
        console.error("❌ Firestore Update Error:", error);
    }
};



  if (loading) return <p className="text-center text-lg">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto  bg-black border-black-700 rounded-3xl p-6 rounded-lg text-white shadow-lg">
      {/* Background Cover Image Section */}
      <div className="relative w-full h-58 bg-cover bg-center rounded-lg" style={{ backgroundImage: `url(${userData.backgroundImage})` }}>
        <label htmlFor="background-input" className="absolute bottom-2 right-2 p-2 bg-gray-800 text-white rounded-full cursor-pointer">
          <PiPencilSimple size={12} />
        </label>
        <input type="file" id="background-input" className="hidden" onChange={handleBackgroundImageChange} />
      </div>

      {/* Profile Image Section */}
      <div className="flex flex-col items-center mt-4">
        <div className="relative">
          <img src={userData.profileImage} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white shadow-md" />
          <label htmlFor="profile-input" className="absolute bottom-0 right-0 p-2 bg-gray-800 text-white rounded-full cursor-pointer">
            <PiPencilSimple size={12} />
          </label>
          <input type="file" id="profile-input" className="hidden" onChange={handleProfileImageChange} />
        </div>
      </div>

      {/* Form Fields */}
      <form className="mt-6 grid grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-gray-700">Name</label>
          <div className="flex items-center border rounded p-2">
            <PiUser className="text-gray-500 mr-2" />
            <input type="text" name="username" className="w-full outline-none" value={userData.username} onChange={handleChange} />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700">Location</label>
          <div className="flex items-center border rounded p-2">
            <PiMapPin className="text-gray-500 mr-2" />
            <input type="text" name="location" className="w-full outline-none" value={userData.location} onChange={handleChange} />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700">Email Address</label>
          <div className="flex items-center border rounded p-2">
            <PiEnvelopeSimple className="text-gray-500 mr-2" />
            <input type="email" name="email" className="w-full outline-none" value={userData.email} readOnly />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700">Phone Number</label>
          <div className="flex items-center border rounded p-2">
            <PiPhone className="text-gray-500 mr-2" />
            <input type="text" name="phone" className="w-full outline-none" value={userData.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700">Work</label>
          <div className="flex items-center border rounded p-2">
            <PiBriefcase className="text-gray-500 mr-2" />
            <input type="text" name="work" className="w-full outline-none" value={userData.work} onChange={handleChange} />
          </div>
        </div>

        <div className="relative">
          <label className="block text-gray-700">Education</label>
          <div className="flex items-center border rounded p-2">
            <PiGraduationCap className="text-gray-500 mr-2" />
            <input type="text" name="education" className="w-full outline-none" value={userData.education} onChange={handleChange} />
          </div>
        </div>
      </form>

      {/* Bio Section */}
      <div className="relative mt-4">
        <label className="block text-gray-700">Bio</label>
        <div className="flex items-center border rounded p-2">
          <PiNotePencil className="text-gray-500 mr-2" />
          <input type="text" name="bio" className="w-full outline-none" value={userData.bio} onChange={handleChange} />
        </div>
      </div>


      <div className="relative mt-4">
  <label className="block text-gray-700">Change Password</label>

  <input
    type="password"
    autoComplete="new-password"
    style={{ display: 'none' }}
  />

  <div className="flex items-center border rounded p-2">
    <PiLock className="text-gray-500 mr-2" />
    <input
      type="text" 
      placeholder="Current Password"
      className="w-full outline-none"
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
      autoComplete="off" 
      readOnly 
      onFocus={(e) => {
        e.target.removeAttribute('readOnly'); 
        e.target.type = 'password'; 
      }}
    />
  </div>
  <div className="flex items-center border rounded p-2 mt-2">
    <PiLock className="text-gray-500 mr-2" />
    <input
      type="text" 
      placeholder="New Password"
      className="w-full outline-none"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      autoComplete="off" 
      readOnly 
      onFocus={(e) => {
        e.target.removeAttribute('readOnly'); 
        e.target.type = 'password';
      }}
    />
  </div>
  <button onClick={handlePasswordChange} className="mt-2 w-50 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
    Change Password
  </button>
</div>

      {/* Save Button */}
      <button onClick={handleSave} className="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg">
        Save Changes
      </button>
    </div>
  );
};

export default ProfileEdit1;
