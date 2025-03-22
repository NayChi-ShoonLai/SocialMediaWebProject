

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { auth, db, googleProvider } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Validate password strength
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) return "Password must be at least 8 characters long.";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter.";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter.";
    if (!hasNumber) return "Password must contain at least one number.";
    if (!hasSpecialChar) return "Password must contain at least one special character.";
    
    return "";
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle email/password sign-up
  const handleSignUp = async (e) => {
    e.preventDefault();
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      toast.error(passwordError);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await Promise.all([
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          username: formData.username,
          email: formData.email,
          blocked: [],
          createdAt: new Date().toISOString(),
        }),
        setDoc(doc(db, "userchats", user.uid), {
          uid: user.uid,
          chats: [],
        }),
      ]);

      toast.success("Account created successfully!");
      navigate("/peofile1");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await Promise.all([
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          username: user.displayName || "Google User",
          email: user.email,
          blocked: [],
          createdAt: new Date().toISOString(),
        }),
        setDoc(doc(db, "userchats", user.uid), {
          uid: user.uid,
          chats: [],
        }),
      ]);

      toast.success("Signed in with Google successfully!");
      navigate("/profile");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-cover bg-center" style={{ backgroundImage: "url('/bgwood.jpg')" }}>
      <div className="w-[35vw] h-[85vh] bg-[rgba(255, 255, 255, 0.53)] backdrop-blur-lg rounded-lg border border-[rgba(0,0,0,0.1)] flex justify-center items-center p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Logo and Title */}
          <div className="flex flex-row items-center gap-2 mb-3">
            <img 
              src="/logoLogin.png" 
              alt="SocialHive Logo" 
              className="w-16 h-16" 
            />
            <h1 className="text-3xl font-bold text-gray-800">SocialHive</h1>
          </div>

          <h2 className="text-xl font-bold text-gray-800">Create an Account</h2>

          {/* Email/Password Sign-Up Form */}
          <form onSubmit={handleSignUp} className="flex flex-col items-center w-full gap-4">
            <input 
              type="email" 
              placeholder="Email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-white text-gray-800 rounded-md outline-none border border-gray-300 focus:border-gray-500"
              autoComplete="email"
            />
            <input 
              type="text" 
              placeholder="Username" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-white text-gray-800 rounded-md outline-none border border-gray-300 focus:border-gray-500"
              autoComplete="username"
            />
            <input 
              type="password" 
              placeholder="Password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="w-full p-3 bg-white text-gray-800 rounded-md outline-none border border-gray-300 focus:border-gray-500"
              autoComplete="new-password"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button 
              type="submit" 
              className="w-full p-3 bg-gray-800 text-white rounded-md cursor-pointer font-medium hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              Sign Up
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center w-full gap-2">
            <div className="flex-1 h-px bg-gray-400"></div>
            <span className="text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-400"></div>
          </div>

          {/* Google Sign-In Button */}
          <button 
            onClick={handleGoogleSignIn} 
            className="w-full p-3 bg-white text-gray-700 rounded-md cursor-pointer font-medium hover:bg-gray-100 flex items-center justify-center gap-4"
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png" 
              alt="Google Logo" 
              className="w-5 h-5" 
            />
            <span>Sign Up with Google</span>
          </button>

          {/* Link to Login Page */}
          <p className="text-gray-600">
            Already have an account? 
            <Link to="/login" className="ml-4 hover:text-gray-800 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
