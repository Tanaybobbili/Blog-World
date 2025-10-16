const express = require('express');
const router = express.Router();
const Blog = require('../models/blogs');


router.get('/suggestions', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);

    const blogs = await Blog.find({ title: { $regex: q, $options: 'i' } })
      .select('_id title')
      .limit(10);

    res.json(blogs);
  } catch (err) {
    console.error("Search suggestion error:", err);
    res.status(500).json([]);
  }
});


router.get('/', async (req, res) => {
  try {
    const q = req.query.q?.trim() || '';
    let blogs = [];

    if (q) {
      blogs = await Blog.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { content: { $regex: q, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      blogs = await Blog.find({}).sort({ createdAt: -1 });
    }

    res.render('home', { user: req.user, blogs, q });
  } catch (err) {
    console.error("Search error:", err);
    res.render('home', { user: req.user, blogs: [], q: '' });
  }
});

module.exports = router;
