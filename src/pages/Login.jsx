import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [formData, setFormData] = useState({ loginEmail: "", loginPassword: "" });
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, formData.loginEmail, formData.loginPassword);
      toast.success("Logged in successfully!");
      navigate("/profile");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.loginEmail) {
      toast.error("Please enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.loginEmail);
      toast.success("Password reset email sent!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-cover bg-center" style={{ backgroundImage: "url('/bgwood.jpg')" }}>
      <div className="w-[35vw] h-[80vh] bg-[rgba(255, 255, 255, 0.53)] backdrop-blur-lg rounded-lg border border-[rgba(0,0,0,0.1)] flex justify-center items-center p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col items-center gap-5 w-full">
        <div className="flex flex-row items-center gap-2 mb-8">
            <img 
              src="/logoLogin.png" 
              alt="SocialHive Logo" 
              className="w-16 h-16" 
            />
            <h1 className="text-3xl font-bold text-gray-800">SocialHive</h1>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-5">Welcome back,</h2>
          <form onSubmit={handleLogin} className="flex flex-col items-center w-full gap-4">
            <input 
              type="email" 
              placeholder="Email" 
              name="loginEmail" 
              value={formData.loginEmail} 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-white text-gray-800 rounded-md outline-none border border-gray-300 focus:border-gray-500"
              autoComplete="username"
            />
            <input 
              type="password" 
              placeholder="Password" 
              name="loginPassword" 
              value={formData.loginPassword} 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-white text-gray-800 rounded-md outline-none border border-gray-300 focus:border-gray-500"
              autoComplete="current-password"
            />
            <button 
              type="submit" 
              className="w-full p-3 bg-gray-800 text-white rounded-md cursor-pointer font-medium hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              Sign In
            </button>
          </form>
          <p className="text-gray-600">
            <Link to="/register" className="mr-4 hover:text-gray-800 hover:underline">
              Don't have an account?
            </Link>
            <button onClick={handleForgotPassword} className="hover:text-gray-800 hover:underline">
              Forgot Password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;