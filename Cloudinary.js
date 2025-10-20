// cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({ secure: true }); // uses process.env.CLOUDINARY_URL

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Blog-World',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
