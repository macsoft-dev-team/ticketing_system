const db = require("../model/db");
const path = require("path");
const fs = require("fs");

//createSpareRequest
const createSpareRequest = async (req, res) => {
  //use sql and db.query to create spare reqest
  //parse req.body for data
  // customername, controllerno, partname, quantity, serialno, remarks, status
  const userId = req.user.id;
  const { 
    customername,
    controllerno,
    partname,
    quantity,
    serialno,
    remarks,
    status,
  } = req.body;

  let sql = "select max(id) as id from spare_requests";
  //get the max id from spare_requests
  const result = await db.query(sql);
  const maxId = result[0][0]["id"] || 0;
  const requestcode = `SR${String(maxId + 1).padStart(4, "0")}`;

  sql =
    "INSERT INTO spare_requests (requestcode, customername, controllerno, partname, quantity, serialno, remarks, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  try {
    //padd prefix 4 zeros to the id and increment it by 1
    let result2 = await db.query(sql, [
      requestcode,
      customername,
      controllerno,
      partname,
      quantity,
      serialno,
      remarks,
      status,
      userId,
    ]);

    let id = result2[0].insertId;

     // Create a directory for the request code if it doesn't exist
     const uploadDir = path.join(process.env.uploads, `${requestcode}`);
     if (!fs.existsSync(uploadDir)) {
       fs.mkdirSync(uploadDir, { recursive: true });
     }
 
     // use req.files and upsert into spare_request_photos
     sql =
       "INSERT INTO spare_request_photos (id, spare_request_id, photo_path) VALUES (?, ?, ?)";
 
     // Save in-memory files to the directory
     if (req.files && req.files.length > 0) {
       req.files.forEach(async (file) => {
         const newFilePath = path.join(
           `/uploads`,
           requestcode,
           file.originalname
         ); // Use the original file name
         fs.writeFileSync(
           path.join(process.env.uploads, requestcode, file.originalname),
           file.buffer
         );
         await db.query(sql, [
           file.originalname,
           id,
           newFilePath
         ]);
       });
     }
 
     sql = "SELECT * FROM spare_requests WHERE id = ?";
     const result3 = await db.query(sql, [id]);
     const updatedRequest = result3[0][0];
 
     sql = "SELECT * FROM spare_request_photos WHERE spare_request_id = ?";
     const result4 = await db.query(sql, [id]);
     const photos = result4[0];
   
    
    return res
      .status(200)
      .send({
        data: updatedRequest,
        photos: photos,
        message: "Spare request created successfully",
      });
  } catch (error) {
     return res.status(500).send({ message: "Error creating spare request" });
  }
};

//get spareRequest for the user
const getSpareRequests = async (req, res) => {
  const userId = req.user.id;
  let sql = "SELECT * FROM spare_requests WHERE user_id = ?";
  try {
    const result = await db.query(sql, [userId]);
    return res.status(200).send(result[0]);
  } catch (error) {
     return res.status(500).send({ message: "Error fetching spare requests" });
  }
};

const getSpareRequestPhotos = async (req, res) => {
  const { id } = req.params;

  let sql = "SELECT * FROM spare_request_photos WHERE spare_request_id = ?";
  try {
    const result = await db.query(sql, [id]);
    return res.status(200).send(result[0]);
  } catch (error) {
     return res
      .status(500)
      .send({ message: "Error fetching spare request photos" });
  }
};

//update sparerequests
const updateSpareRequest = async (req, res) => {
  const { id } = req.params;
  const {
    requestcode,
    customername,
    controllerno,
    partname,
    quantity,
    serialno,
    remarks,
    status,
    removedPhotos
  } = req.body;

  let sql =
    "UPDATE spare_requests SET customername = ?, controllerno = ?, partname = ?, quantity = ?, serialno = ?, remarks = ?, status = ? WHERE id = ?";

  try {
    // Update the spare request in the database
    await db.query(sql, [
      customername,
      controllerno,
      partname,
      quantity,
      serialno,
      remarks,
      status,
      id,
    ]);

    // Create a directory for the request code if it doesn't exist
    const uploadDir = path.join(process.env.uploads, `${requestcode}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Handle removed photos. removedPhotos is comma seperate string
    if (removedPhotos) {
      const removedPhotoIds = removedPhotos.split(",");
      for (const photoId of removedPhotoIds) {
        // Delete the file from the upload directory
        const fullPath = path.join(process.env.uploads, requestcode, photoId);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }

        // Delete the photo entry from the database
        sql = "DELETE FROM spare_request_photos WHERE id = ?";
        await db.query(sql, [photoId]);
      }
    }

    // use req.files and upsert into spare_request_photos
    sql =
      "INSERT INTO spare_request_photos (id, spare_request_id, photo_path) VALUES (?, ?, ?)";

    // Save in-memory files to the directory
    if (req.files && req.files.length > 0) {
      req.files.forEach(async (file) => {
        const newFilePath = path.join(
          `/uploads`,
          requestcode,
          file.originalname
        ); // Use the original file name
        fs.writeFileSync(
          path.join(process.env.uploads, requestcode, file.originalname),
          file.buffer
        );
        const result = await db.query(sql, [
          file.originalname,
          parseInt(id),
          newFilePath
        ]);
       });
    }

    sql = "SELECT * FROM spare_requests WHERE id = ?";
    const result = await db.query(sql, [id]);
    const updatedRequest = result[0][0];

    sql = "SELECT * FROM spare_request_photos WHERE spare_request_id = ?";
    const result2 = await db.query(sql, [id]);
    const photos = result2[0];


    return res
      .status(200)
      .send({
        data: updatedRequest,
        photos: photos,
        message: "Spare request updated successfully",
      });
  } catch (error) {
     return res.status(500).send({ message: "Error updating spare request" });
  }
};

//delete spare request
const deleteSpareRequest = async (req, res) => {
  const { id } = req.params;
  let sql = "DELETE FROM spare_requests WHERE id = ?";
  try {
    await db.query(sql, [id]);
    return res
      .status(200)
      .send({ message: "Spare request deleted successfully" });
  } catch (error) {
     return res.status(500).send({ message: "Error deleting spare request" });
  }
};

//close spare request
const closeSpareRequest = async (req, res) => {
  const { id } = req.params;
  let sql = "UPDATE spare_requests SET status = 'closed' WHERE id = ?";
  try {
    await db.query(sql, [id]);
    return res
      .status(200)
      .send({ message: "Spare request closed successfully" });
  } catch (error) {
     return res.status(500).send({ message: "Error closing spare request" });
  }
};

module.exports = {
  createSpareRequest,
  getSpareRequests,
  getSpareRequestPhotos,
  updateSpareRequest,
  deleteSpareRequest,
  closeSpareRequest,
};
