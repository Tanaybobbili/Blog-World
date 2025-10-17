const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const Blog = require('../models/blogs');
const Comment = require('../models/comments');
const MarkdownIt = require('markdown-it');
const sanitizeHtml = require('sanitize-html');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });



const storage = multer.diskStorage({
  destination(req, file, cb){ cb(null, path.resolve('./public/uploads/')) },
  filename(req, file, cb){ cb(null, `${Date.now()}-${file.originalname}`) }
})

const upload = multer({ storage })

function ensureClosedFences(text){
  if (!text) return '';
  const backticks = (text.match(/```/g) || []).length;
  const tildes = (text.match(/~~~/g) || []).length;
  let out = text;
  if (backticks % 2 === 1) out = out + '\n\n```\n';
  if (tildes % 2 === 1) out = out + '\n\n~~~\n';
  return out;
}

function escapeHtml(str){
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}


router.get('/createnewblog', (req, res) => res.render('createblog', { user: req.user }));

router.get('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate('createdby');
  if (!blog) return res.status(404).send('Blog not found');
  const comments = await Comment.find({ blog: blog._id }).populate('createdby').sort({ createdAt: -1 });
  blog.comments = comments;

  const contentToRender = ensureClosedFences(blog.content || '');
  let contentForRender = contentToRender;
  const trimmed = contentForRender.trimStart();
  if (!trimmed.startsWith('```') && !trimmed.startsWith('~~~')) {
    contentForRender = contentForRender.replace(/^\s*#\s*(.+?)\s*(?:\r?\n)/, (m, h) => {
      if (String(h).trim().toLowerCase() === String(blog.title || '').trim().toLowerCase()) return '';
      return m;
    });
  }

  let rendered = md.render(contentForRender);

  const topPreMatch = rendered.match(/^\s*<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/i);
  if (topPreMatch) {
    const inner = topPreMatch[1];
    const normalized = inner.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const lines = normalized.split(/\r?\n/);
    let firstNonEmptyIdx = 0;
    while (firstNonEmptyIdx < lines.length && lines[firstNonEmptyIdx].trim() === '') firstNonEmptyIdx++;
    if (firstNonEmptyIdx < lines.length) {
      const firstLine = lines[firstNonEmptyIdx].trim();
      const titleText = String(blog.title || '').trim();
      let headingText = null;
      if (firstLine.startsWith('# ')) {
        headingText = firstLine.replace(/^#\s*/, '').trim();
      } else if (titleText && firstLine.toLowerCase() === titleText.toLowerCase()) {
        headingText = firstLine;
      }
      if (headingText) {
        lines.splice(firstNonEmptyIdx, 1);
        const remaining = lines.join('\n');
        const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const newPre = `<pre><code>${esc(remaining)}</code></pre>`;
        rendered = `<h1 class="post-title">${escapeHtml(headingText)}</h1>` + newPre + rendered.slice(topPreMatch[0].length);
      }
    }
  }

  const hasAnchorTag = /<a\s+href=/.test(rendered);
  if (!hasAnchorTag && /\[[^\]]+\]\(https?:\/\/[^\s)]+\)/.test(contentToRender)) {
    const replaced = contentToRender.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, text, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
    );
    rendered = md.render(replaced);
  }

  if (/`[^`]+`/.test(contentToRender) && !/<code>/.test(rendered)) {
    const replacedInline = contentToRender.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
    rendered = md.render(replacedInline);
  }

  const safeHtml = sanitizeHtml(rendered, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'pre', 'code']),
    allowedAttributes: Object.assign({}, sanitizeHtml.defaults.allowedAttributes, {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      code: ['class'],
      pre: ['class']
    }),
    allowProtocolRelative: false
  });

  return res.render('blog', { blog, user: req.user, comments, safeHtml });
});
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).send('Title and content are required.');
    }

    const safeContent = ensureClosedFences(content);

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const blog = await Blog.create({
      title,
      content: safeContent,
      imageurl: imageUrl,   
      createdby: req.user.id
    });

    res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating blog');
  }
});


router.post('/comment/:blogid', async (req,res) => {
    await Comment.create({
      content : req.body.content,
      blog : req.params.blogid,
      createdby : req.user.id,
    })
    res.redirect(`/blog/${req.params.blogid}`);
});

module.exports = router;