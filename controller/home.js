const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const bucketName = process.env.S3_BUCKET_NAME;
const tableName = process.env.DYNAMODB_TABLE_NAME;

exports.getAll = async (req, res) => {
  try {
    const params = { TableName: tableName };
    const data = await dynamodb.scan(params).promise();
    console.log("data=", data.Items);
    return res.render("home.ejs", { data: data.Items });
  } catch (error) {
    console.error("Error retrieving data from DynamoDB", error);
    return res.status(500).send("Internal Sever Error");
  }
};
exports.addCourse = async (req, res, next) => {
  try {
    const id = Number(req.body.id);
    const name = req.body.name;
    const course_type = req.body.course_type;
    const semester = req.body.semester;
    const department = req.body.department;

    const image = req.file?.originalname.split(".");
    const fileType = image[image.length - 1];
    const filePath = `${id}_${Date.now().toString()}.${fileType}`;

    const paramsS3 = {
      Bucket: bucketName,
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    s3.upload(paramsS3, async (err, data) => {
      if (err) {
        console.log(err);
        return res.send("Internal server error");
      }
      const imageURL = data.Location;

      const paramsDynamoDb = {
        TableName: tableName,
        Item: {
          id: id,
          name: name,
          course_type: course_type,
          semester: semester,
          department: department,
          imageUrl: imageURL,
        },
      };
      await dynamodb.put(paramsDynamoDb).promise();
      return res.redirect("/");
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteCourse = (req, res, next) => {
  const listCheckboxSelected = Object.keys(req.body);
  console.log(listCheckboxSelected);
  if (!listCheckboxSelected || listCheckboxSelected.length < 0) {
    return res.redirect("/");
  }
  try {
    function onDelete(length) {
      const params = {
        TableName: tableName,
        Key: {
          id: Number(listCheckboxSelected[length]),
        },
      };

      dynamodb.delete(params, (err, data) => {
        if (err) {
          console.log(err);
          return res.send("Internal server error");
        } else if (length > 0) onDelete(length - 1);
        else return res.redirect("/");
      });
    }
    onDelete(listCheckboxSelected.length - 1);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};
