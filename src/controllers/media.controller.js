import uploadImage from "../utils/cloudinaryUpload.js";

const uploadAccommodationImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Please upload at least one image",
      });
    }

    const imageUrls = await Promise.all(
      req.files.map((file) => uploadImage(file.buffer)),
    );

    return res.status(200).json({
      status: "success",
      message: "Images uploaded successfully",
      data: {
        photos: imageUrls,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { uploadAccommodationImages };