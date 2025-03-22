//src/pages/SearchBar.jsx
import React, { useState, useEffect } from "react";
import {
  auth,
  searchUsersByName,
  searchPostsByContentOrTags,
  getRecentSearches,
  saveSearchData,
  deleteSearchItem,
  clearAllSearches,
  getSavedPosts,
  clearAllSavedPosts,
} from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { BsThreeDots } from "react-icons/bs";
import "./SearchBar.css";
import Post from "./Post";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // ✅ Handles delete confirmation
  const [selectedPost, setSelectedPost] = useState(null);

  const [savedPosts, setSavedPosts] = useState([]);
  const [hoveredPost, setHoveredPost] = useState(null);
  const navigate = useNavigate();


  // ✅ Fetch initial data for recent searches, suggested friends, and friend requests
  useEffect(() => {
    const fetchData = async () => {
      setRecentSearches(await getRecentSearches());
      setSavedPosts(await getSavedPosts());
    };

    fetchData();

    // ✅ Listen for changes in saved posts
    const handleSavedPostsUpdate = async () => {
      setSavedPosts(await getSavedPosts());
    };

    window.addEventListener("savedPostsUpdated", handleSavedPostsUpdate);

    return () => {
      window.removeEventListener("savedPostsUpdated", handleSavedPostsUpdate);
    };
  }, []);


  // ✅ Fetch Initial Data
  useEffect(() => {
    fetchRecentSearches();
  }, []);

  const fetchRecentSearches = async (showAllData = false) => {
    const data = await getRecentSearches(showAllData ? 100 : 5);
    setRecentSearches(data);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim()) {
        const [users, posts] = await Promise.all([
          searchUsersByName(searchTerm),
          searchPostsByContentOrTags(searchTerm),
        ]);
        setUserResults(users);
        setPostResults(posts);

        fetchRecentSearches();
      } else {
        setUserResults([]);
        setPostResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault(); // Prevents form submission
      const [users, posts] = await Promise.all([
        searchUsersByName(searchTerm),
        searchPostsByContentOrTags(searchTerm),
      ]);
      setUserResults(users);
      setPostResults(posts);

      await saveSearchData(searchTerm); // ✅ Only saves when Enter is pressed
      fetchRecentSearches();
    }
  };


  // ✅ Navigate to User Profile on Click
  const handleUserClick = async (user) => {
    await saveSearchData(user.username); // ✅ Save the clicked username
    navigate(`/peofile1/${user.id}`);
    fetchRecentSearches();
  };


  const handlePostClick = async (post) => {
    if (post.content) {
      await saveSearchData(post.content.substring(0, 50) + "..."); // ✅ Save post content (trimmed for readability)
    } else {
      await saveSearchData(`Post ID: ${post.id}`); // ✅ Fallback: Save Post ID
    }
    setSelectedPost(post);
    fetchRecentSearches();
  };


  // ✅ Handle 'See All' Toggle
  const handleSeeAll = () => {
    setShowAll(!showAll);
    fetchRecentSearches(!showAll);
  };

  // ✅ Handle Clear All Searches
  const handleClearAll = async () => {
    await clearAllSearches();
    fetchRecentSearches();
  };

  // ✅ Show Delete Confirmation Modal
  // ✅ Track delete type (recent search or saved post)
  // ✅ Track delete type (recent search, saved post, or all saved posts)
  const confirmDelete = (id, type) => {
    setDeleteConfirm({ id, type }); // ✅ Store both ID and type
  };



  // ✅ Confirm and Delete Search
  // ✅ Delete Recent Search
  const handleConfirmDelete = async () => {
    if (deleteConfirm?.type === "search") {
      await deleteSearchItem(deleteConfirm.id);
      fetchRecentSearches(showAll);
    }
    setDeleteConfirm(null);
  };

  // ✅ Delete Saved Post
  const handleDeleteSavedPost = async () => {
    if (deleteConfirm?.type === "savedPost") {
      await deleteSavedPost(deleteConfirm.id);
      setSavedPosts((prev) => prev.filter((post) => post.id !== deleteConfirm.id)); // ✅ Remove from UI
    }
    setDeleteConfirm(null);
  };


  const handleDeleteAllSavedPosts = async () => {
    try {
      await clearAllSavedPosts();
      setSavedPosts([]); // ✅ Clear UI instantly
      setDeleteConfirm(null); // ✅ Hide confirmation modal
      console.log("✅ All saved posts deleted successfully.");
    } catch (error) {
      console.error("❌ Error deleting all saved posts:", error);
    }
  };

  const handleMouseEnter = (post) => {
    setHoveredPost(post);
  };

  const handleMouseLeave = () => {
    setHoveredPost(null);
  };


  return (
    <div className="search-bar">

      {selectedPost ? (
        <div className="p-4">
          <button onClick={() => setSelectedPost(null)} className="mb-3 text-blue-600 font-semibold">
            ← Back
          </button>
          <Post post={selectedPost} />
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search for users or posts..."
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            className="w-[500px] md:w-[600px] p-3 text-lg border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
          />

          {/* Search Results */}
          {(userResults.length > 0 || postResults.length > 0) && (
            <div className="search-results">
              {/* Users Section */}
              {userResults.length > 0 && (
                <div className="result-section">
                  <h3>Users:</h3>
                  {userResults.map((user) => (
                    <div key={user.id} className="search-item" onClick={() => handleUserClick(user)}>
                      <div className="search-user-info">
                        <p className="search-user-name">{user.username}</p>
                      </div>
                      <img src={user.profileImage || "/defaultpic.jpg"} alt={user.username} className="search-user-photo" />
                    </div>
                  ))}
                </div>
              )}
 
              {/* Posts Section with Hover Preview */}
              {postResults.length > 0 && (
                <div className="result-section">
                  <h3>Posts:</h3>
                  {postResults.map((post) => (
                    <div
                      key={post.id}
                      className="search-item relative"
                      onClick={() => handlePostClick(post)}
                      onMouseEnter={() => handleMouseEnter(post)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <p>{post.content}</p>
                      {post.photoUrls?.[0] && (
                        <img src={post.photoUrls[0]} alt="Post" className="search-post-photo" />
                      )}

                      {/* Hover Preview */}
                      {hoveredPost?.id === post.id && (
                        <div className="absolute top-0 left-28 w-56 p-2 bg-white shadow-lg rounded-lg z-10">
                          <h4 className="font-semibold">{hoveredPost.content}</h4>
                          {hoveredPost.photoUrls?.length > 0 && (
                            <img src={hoveredPost.photoUrls[0]} alt="Preview" className="w-full h-auto rounded-lg" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}


          {/* Recent Searches */}
          {userResults.length === 0 && postResults.length === 0 && recentSearches.length > 0 && (
            <div className="recent-searches">
              <div className="recent-searches-header">
                <h3>Recent Searches</h3>
                <div className="action-buttons">
                  <button onClick={handleSeeAll}>{showAll ? "See Less" : "See All"}</button>
                  <button onClick={handleClearAll}>Clear All</button>
                </div>
              </div>
              {recentSearches.map((search) => (
                <div key={search.id} className="search-item">
                  {search.term}
                  <button className="delete-dot" onClick={() => confirmDelete(search.id, "search")}>
                    <BsThreeDots size={18} />
                  </button>
                </div>
              ))}

            </div>
          )}
        </>
      )}

      {/* ✅ Enhanced Delete Confirmation Modal Inside Search Results */}
      {deleteConfirm && (
        <div className="fixed top-4 right-4 bg-white border border-gray-300 shadow-lg p-3 rounded-md w-80 z-50 transition-transform transform animate-slide-in">
          <p className="text-gray-800 text-sm font-medium">
            {deleteConfirm.type === "search"
              ? "Are you sure you want to delete this search?"
              : deleteConfirm.type === "allSavedPosts"
                ? "Are you sure you want to delete all saved posts?" // ✅ Correct message
                : "Are you sure you want to delete this saved post?"}
          </p>

          <div className="flex justify-end gap-2 mt-3">
            <button
              className="text-gray-600 hover:text-gray-800 text-sm"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </button>
            <button
              className="text-red-600 hover:text-red-800 text-sm font-medium"
              onClick={deleteConfirm.type === "search"
                ? handleConfirmDelete
                : deleteConfirm.type === "allSavedPosts"
                  ? handleDeleteAllSavedPosts // ✅ Call the correct function
                  : handleDeleteSavedPost}
            >
              Confirm
            </button>
          </div>
        </div>
      )}






      {savedPosts.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <h2 className="text-blue-600 text-lg font-bold">Saved Posts</h2>
          <button
            className="text-blue-600 hover:underline text-sm font-bold"
            onClick={() => confirmDelete(null, "allSavedPosts")} // ✅ Set type correctly
          >
            Delete All
          </button>

        </div>
      )}



      {/* ✅ Saved Posts Section */}
      <div className="savedposts-horizontal-scroll">
        {savedPosts.length === 0 ? (
          <p>No saved posts yet.</p>
        ) : (
          savedPosts.map((savedPost) => (
            <div
              key={savedPost.id}
              className="post-card relative cursor-pointer"
              onClick={() => handlePostClick(savedPost)} // ✅ Uses the same function as search results
            >


              {/* Delete Button (Three Dots) */}
              {/* <div className="absolute top-2 right-2">
                <button
                  className="p-2 rounded-full bg-white shadow-md text-gray-600 hover:bg-red-500 hover:text-white transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(savedPost.id);
                  }}
                  title="Delete Saved Post"
                >
                  <BsThreeDots size={18} />
                </button>
              </div> */}



              {/* Display Image if Available */}
              {savedPost.photoUrls && savedPost.photoUrls.length > 0 && (
                savedPost.photoUrls.map((image, index) => (
                  <img key={index} src={image} alt="Saved Post" className="post-photo" />
                ))
              )}

              {/* Display Video if Available */}
              {savedPost.videoUrls && savedPost.videoUrls.length > 0 && (
                savedPost.videoUrls.map((video, index) => (
                  <video key={index} controls className="post-video">
                    <source src={video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ))
              )}

              <div className="post-info">
                <p>{savedPost.content}</p>
                <small>By: {savedPost.user?.name || "Anonymous"}</small>
              </div>
            </div>
          ))
        )}
      </div>



    </div>
  );
};

export default SearchBar;

