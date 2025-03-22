// import ChatList from "./chatList/Chatlist";

// import "./list.css"
// import Userinfo from "./userInfo/Userinfo";

// const List = () => {
//   return (
//     <div className='list'>
//         <Userinfo />
//         <ChatList />
//     </div>
//   );
// };

// export default List;

import ChatList from "./chatList/Chatlist";
import Userinfo from "./userInfo/Userinfo";

const List = () => {
  return (
    <div className="flex flex-1 flex-col">
      <Userinfo />
      <ChatList />
    </div>
  );
};

export default List;
