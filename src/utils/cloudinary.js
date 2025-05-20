import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload thefile on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // file has been upload successfully
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath); // remove the locally saved temp file
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
};

export default uploadOnCloudinary;

// ✅ Flow Samjho:---------------->

// 📥 File aayi multer ke through — local path pe temporary save hui
// ☁️ File gayi Cloudinary pe cloudinary.uploader.upload(req.file.path) se
// ✅ Cloudinary ne URL de diya → kaam khatam!
// 🗑️ Ab fs.unlinkSync() ya fs.promises.unlink() se local file delete kar di jati hai
