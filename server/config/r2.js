// server/config/r2.js
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Initialize R2 Client (S3-compatible)
const r2Client = new S3Client({
  region: "auto", // R2 uses "auto" for region
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

console.log(process.env);

// Configure Multer to upload to R2
export const uploadToR2 = multer({
  storage: multerS3({
    s3: r2Client,
    bucket: process.env.R2_BUCKET_NAME,
    acl: "public-read", // Make files publicly accessible
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const folder = "profiles"; // Organize files in folders
      const fileName = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}${path.extname(file.originalname)}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  },
});

export default r2Client;
