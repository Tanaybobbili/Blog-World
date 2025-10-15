const express = require('express');
const router = express.Router();
const User = require('../models/users');
const {matchpasswordtogeneratetoken} = require('../models/users');
const multer = require('multer');
const path = require('path');



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve(`./public/profiles/`))
    },
    filename: function (req, file, cb) {
      const name = `${Date.now()}-${file.originalname}`;
      cb(null, name);
    }
});
function imageFileFilter (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
}

const upload = multer({ 
    storage: storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 3 * 1024 * 1024 } 
});

// middleware to ensure the request is from the logged-in owner
function ensureOwner(req, res, next) {
    if (!req.user) return res.redirect('/user/signin');
    if (String(req.user.id) !== String(req.params.id)) return res.status(403).send('Forbidden');
    return next();
}


router.get('/signin', (req, res) => {
    res.render('signin');
}
);
router.get('/signup', (req, res) => {
    res.render('signup');
}); 

router.post('/signin', async (req, res) => {
    const {email, password} = req.body;
    try{
        const token = await User.matchpasswordtogeneratetoken(email, password);
        return res.cookie('token', token).redirect('/');
    }
    catch (error){
        return res.render('signin', {error: "Invalid Login Details" });
    }
});

router.post('/signup', upload.single('profilepic'), async (req, res) => {
    try {
        const {username, email, bio, password} = req.body;
        let profilePath = '/images/default.jpg';
        if (req.file && req.file.filename) {
            profilePath = `/profiles/${req.file.filename}`;
        }

        await User.create({username, email, bio: bio || '', password, profilepic: profilePath});
        return res.redirect('/');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Signup failed');
    }
});

router.post('/profile/:id/update', ensureOwner, upload.single('profilepic'), async (req, res) => {
    try {
        const { bio } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send('User not found');

        if (typeof bio === 'string') {
            const trimmed = bio.trim();
            if (trimmed.length > 0) user.bio = trimmed.slice(0,300);
        }

        if (req.file && req.file.filename) {
            user.profilepic = `/profiles/${req.file.filename}`;
        }

        await user.save();

        const {generatetokenforuser} = require('../utils/auth');
        const token = generatetokenforuser(user);
        res.cookie('token', token);

        return res.redirect(`/user/profile/${req.params.id}`);
    } catch (err) {
        console.error('Update error:', err);
        return res.status(500).send('Server error');
    }
});

router.get('/signout', (req, res) => {
    res.clearCookie('token').redirect('/');
});

router.get('/profile/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).render('404');
        }
        return res.render('profile', { profileUser: user });
        } catch (error) {
            console.error(error);
            res.status(500).render('500');
        }
});



module.exports = router;