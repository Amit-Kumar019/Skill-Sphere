const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and unlinks (deletes) the local temp file.
 * @param {string} localFilePath - Path to the local temporary file
 * @param {string} folder - Target folder name on Cloudinary
 * @returns {Promise<object|null>} - Cloudinary upload response object or null if failed
 */
const uploadOnCloudinary = async (localFilePath, folder = "skillsphere") => {
    try {
        if (!localFilePath) return null;
        
        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Let Cloudinary auto-detect (PDF, raw doc, image, etc.)
            folder: folder,
        });
        
        // File has been uploaded successfully, remove local temp file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    } catch (error) {
        // Remove the locally saved temporary file if the upload operation failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload failed:", error);
        return null;
    }
};

module.exports = { uploadOnCloudinary };
