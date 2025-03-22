import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebaseConfig";




const upload = async (file)=>{

    if (!file) return Promise.reject("No file provided");
    

  const date = new Date()  
  const storageRef = ref(storage, `images/${date + file.name}`);
 
// const fileName = `${Date.now()}_${file.name}`;
// const storageRef = ref(storage, `images/${fileName}`);

    
const uploadTask = uploadBytesResumable(storageRef, file);

return new Promise((resolve,reject)=>{

    uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        }, 
        (error) => {
          reject("something went wrong" + error.code)
        }, 
        () => {
          
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL)
          });
        }
      );
    
});
};


export default upload