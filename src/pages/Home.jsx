import React from "react";
import StoriesBar from "../components/StoriesBar";
import Feed from "../components/Feed";

const Home = () => {
    return (
        <div className=" justify-center bg-black">
            
            <div>
                <StoriesBar />
                <br></br>
                <Feed />
            </div>
           
        </div>
    );
};

export default Home;

