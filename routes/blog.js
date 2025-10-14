const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const Blog = require('../models/blogs');
const Comment = require('../models/comments');



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

router.get('/:id', async (req, res) => {
    const blog = await Blog.findById(req.params.id).populate('createdby');
    const comments = await Comment.find({blog : blog._id}).populate('createdby').sort({ createdAt: -1 });
    blog.comments = comments;
    if(!blog) return res.status(404).send('Blog not found');
    return res.render('blog', {blog, user : req.user, comments});
});
router.post('/', upload.single('image'), async (req,res) => {
    const {title, content} = req.body;
    const blog = await Blog.create({
        title,
        content,
        imageurl : `/uploads/${req.file.filename}`,
        createdby : req.user.id
    });
    res.redirect(`/blog/${blog._id}`); 
})

router.post('/comment/:blogid', async (req,res) => {
    await Comment.create({
      content : req.body.content,
      blog : req.params.blogid,
      createdby : req.user.id,
    })
    res.redirect(`/blog/${req.params.blogid}`);
});

module.exports = router;