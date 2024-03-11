const express = require("express");
const bodyPaser = require("body-parser");
const path = require("path");
const multer = require("multer");

const AWS = require("aws-sdk");
require("dotenv").config();

process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";
AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const bucketName = process.env.S3_BUCKET_NAME;
const tableName = process.env.DYNAMODB_TABLE_NAME;

const storage = multer.memoryStorage({
  destination(req, file, cb) {
    cb(null, "");
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 200000 },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
});
function checkFileType(file, cb) {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  return cb("Error:image invalid /jpeg|jpg|png|gif/");
}



const homeRouter = require("./route/home");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyPaser.urlencoded({ extended: false }));
app.use(upload.single("image"));
app.use(express.static(path.join(__dirname, "public")));

app.use(homeRouter);


// app.post("/save", upload.single("image"), (req, res) => {
//   try {
//     const id = Number(req.body.id);
//     const name = req.body.name;
//     const course_type = req.body.course_type;
//     const semester = req.body.semester;
//     const department = req.body.department;

//     const image = req.file?.originalname.split(".");
//     const fileType = image[image.length - 1];
//     const filePath = `${id}_${Date.now().toString()}.${fileType}`;

//     const paramsS3 = {
//       Bucket: bucketName,
//       Key: filePath,
//       Body: req.file.buffer,
//       ContentType: req.file.mimetype,
//     };

//     s3.upload(paramsS3, async (err, data) => {
//       if (err) {
//         console.log(err);
//         return res.send("Internal server error");
//       }
//       const imageURL = data.Location;

//       const paramsDynamoDb = {
//         TableName: tableName,
//         Item: {
//           id: id,
//           name: name,
//           course_type: course_type,
//           semester: semester,
//           department: department,
//           imageUrl: imageURL,
//         },
//       };
//       await dynamodb.put(paramsDynamoDb).promise();
//       return res.redirect("/");
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

app.listen(8080, () => {
  console.log("Server ready");
});
