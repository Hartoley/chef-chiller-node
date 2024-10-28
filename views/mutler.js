const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./Videosbox");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const validVideoMimeTypes = [
    "video/mp4",
    "video/avi",
    "video/quicktime",
    "video/x-ms-wmv",
    "video/x-flv",
    "video/x-matroska",
  ];
  if (validVideoMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid video file type"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10485760 },
});

module.exports = upload;
