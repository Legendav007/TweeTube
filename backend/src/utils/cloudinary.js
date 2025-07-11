import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadImageOnCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath ,{
            resource_type:"auto",
            folder : "Tweetube/photos",
        });
        fs.unlinkSync(localFilePath);
        // console.log("File has been uploaded successfully!" , response.url)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove locally saved temporary filed as upload option got failed
        console.log("Error uploading photo");
        return null;
    }
}

const uploadVideoOnCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto",
            folder : "Tweetube/videos",
            eager : [
                {
                    streaming_profile : "hd",
                    format : "m3u8"
                },
            ],
        });
        fs.unlinkSync(localFilePath);
        const hlsurl = response.eager?.[0]?.secure_url;
        return {...response , hlsurl};
    }
    catch(error){
        fs.unlinkSync(localFilePath);
        console.log("Error uploading videos");
        return null;
    }
}

const deleteImageOnCloudinary = async(URL)=>{
    try {
        if(!URL) return false;
        let ImageId = URL.match(/(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/)[2];
        const response = await cloudinary.uploader.destroy(
            `Tweetube/photos/${ImageId}`,
            {
                resource_type : "image",
            }
        );
        return response;
    } catch (error) {
        console.log("File delete error : " , error);
        return false;
    }    
}

const deleteVideoOnCloudinary = async(URL)=>{
    try {
        if(!URL) return false;
        let VideoId = URL.match(/(?:image|video)\/upload\/v\d+\/videotube\/(photos|videos)\/(.+?)\.\w+$/)[2];
        const response = await cloudinary.uploader.destroy(
            `Tweetube/videos/${VideoId}`,
            {
                resource_type : "video",
            }
        );
        return response;
    } catch (error) {
        console.log("File delete error : " , error);
        return false;
    }    
}

export {uploadImageOnCloudinary,deleteImageOnCloudinary,
    uploadVideoOnCloudinary,deleteVideoOnCloudinary
}

