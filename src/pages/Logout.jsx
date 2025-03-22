import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                await signOut(auth);
                toast.success("Logged out successfully!");
                navigate("/login"); 
            } catch (error) {
                console.error("Logout Error:", error);
                toast.error("Failed to log out!");
            }
        };

        handleLogout();
    }, [navigate]);

    return (
        <div>
            Logging out...
        </div>
    );
};

export default Logout;
