const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const Blog = require('../models/blogs');



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`))
  },
  filename: function (req, file, cb) {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  }
})

const upload = multer({ storage: storage })


router.get('/createnewblog', (req, res) => {
    return res.render('createblog', {user : req.user});
});

router.post('/', upload.single('image'), async (req,res) => {
    const {title, content} = req.body;
    const blog = await Blog.create({
        title,
        content,
        imageurl : `/uploads/${req.file.filename}`,
        createdby : req.user._id
    });
    res.redirect(`/blog/${blog._id}`); 
})

module.exports = router;