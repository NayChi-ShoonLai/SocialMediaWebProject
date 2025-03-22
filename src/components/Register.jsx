// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Link } from "react-router-dom";
// import { auth, db } from "../firebaseConfig";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { doc, setDoc } from "firebase/firestore";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";


// const Register = () => {
//     const [formData, setFormData] = useState({ username: "", email: "", password: "" });
//     const [avatar, setAvatar] = useState(null);
//     const navigate = useNavigate();

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     // const handleAvatar = (e) => {
//     //     if (e.target.files.length > 0) {
//     //         setAvatar(e.target.files[0]); // Store the selected file
//     //     }
//     // };

//     const handleSignUp = async (e) => {
//         e.preventDefault();
//         try {
//             const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
//             const user = userCredential.user;
    
//             // Create user document
//             const userDoc = setDoc(doc(db, "users", user.uid), {
//                 uid: user.uid,
//                 username: formData.username,
//                 email: formData.email,
//                 createdAt: new Date().toISOString(),
//             });
    
//             // Create userchats document
//             const userChatsDoc = setDoc(doc(db, "userchats", user.uid), {
//                 uid: user.uid,
//                 chats: [],
//             });
    
//             // Ensure both documents are created before proceeding
//             await Promise.all([userDoc, userChatsDoc]);
    
//             toast.success("Account created successfully!");
//             navigate("/profile"); // Redirect to profile after signup
//         } catch (error) {
//             toast.error(error.message);
//         }
//     };
    
    

//     return (
        
//         <div className="loginContainer">
//             <div className="login">
//             <div className="item">
//                     <h2 style={{ fontSize: "20px"}}>Create an Account</h2>
//                     <p class="text-lg text-red-800 font-semibold">tailwind test</p>

//                     <form onSubmit={handleSignUp}>
//                         {/* <label htmlFor="file">
//                             <img src={avatar ? URL.createObjectURL(avatar) : "./avatar.png"} alt="Avatar" />
//                             Upload an image
//                         </label> */}
//                         {/* <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} /> */}
//                         <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleChange} required />
//                         <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleChange} required />
//                         <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} required />
//                         <button type="submit">Sign Up</button>
//                     </form>
//                     <p>
//                         You do have an account?  
//                         <Link to="/login" style={{ marginLeft: "15px", marginRight: "5px" }}>Login</Link>
//                     </p>
      
//                 </div>
              
//             </div>
//         </div> 
//     );
// };

// export default Register;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Create user document
      const userDoc = setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: formData.username,
        email: formData.email,
        blocked: [],
        createdAt: new Date().toISOString(),
      });

      // Create user chats document
      const userChatsDoc = setDoc(doc(db, "userchats", user.uid), {
        uid: user.uid,
        chats: [],
      });

      await Promise.all([userDoc, userChatsDoc]);

      toast.success("Account created successfully!");
      navigate("/peofile1");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-cover bg-center text-white" style={{ backgroundImage: "url('/bg.jpg')" }}>
      <div className="w-[35vw] h-[80vh] bg-[rgba(17,25,40,0.75)] backdrop-blur-lg rounded-lg border border-[rgba(255,255,255,0.125)] flex justify-center items-center p-6">
        <div className="flex flex-col items-center gap-5 w-full">
          <h2 className="text-xl">Create an Account</h2>

          <form onSubmit={handleSignUp} className="flex flex-col items-center w-full gap-4">
            <input 
              type="text" 
              placeholder="Username" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-[rgba(17,25,40,0.6)] text-white rounded-md outline-none"
            />
            <input 
              type="email" 
              placeholder="Email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-[rgba(17,25,40,0.6)] text-white rounded-md outline-none"
            />
            <input 
              type="password" 
              placeholder="Password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-[rgba(17,25,40,0.6)] text-white rounded-md outline-none"
            />
            <button 
              type="submit" 
              className="w-full p-3 bg-[#1f8ef1] text-white rounded-md cursor-pointer font-medium hover:bg-[#1c7ed6] disabled:cursor-not-allowed disabled:bg-[#1f8ff19c]"
            >
              Sign Up
            </button>
          </form>

          <p>
            Already have an account? 
            <Link to="/login" className="ml-4 text-blue-400 hover:text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
