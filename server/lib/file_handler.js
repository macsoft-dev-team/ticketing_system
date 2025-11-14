const multer = require("multer");
const fs = require("fs");

function getMulterStorage(dirPath) {
  // Set up multer for file uploads
  const maxSize = 10 * 1024 * 1024; // 10MB
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      //create folder if not exist
      const dir = req.params.id ? `${process.env.FILE_UPLOAD_PATH}/${dirPath}/${req.params.id}` : `${process.env.FILE_UPLOAD_PATH}/${dirPath}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
    limits: {
      fileSize: maxSize, // bytes
    },
  });
  return storage;
}

module.exports = getMulterStorage;
