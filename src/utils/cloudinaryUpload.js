import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

const uploadImage = async (fileBuffer, folder = "nysc-connect/accommodations") => {
  // Compress and resize the image using Sharp
  const optimizedImage = await sharp(fileBuffer)
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 80,
    })
    .toBuffer();

  // Upload the optimized image to Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      },
    );

    uploadStream.end(optimizedImage);
  });
};

export default uploadImage;