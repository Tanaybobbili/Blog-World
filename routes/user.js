const express = require('express');
const router = express.Router();
const User = require('../models/users');
const { matchpasswordtogeneratetoken } = require('../models/users');
const multer = require('multer');
const { cloudinary } = require('../Cloudinary'); // cloudinary instance
const { generatetokenforuser } = require('../utils/auth');

// ---------------- Multer Setup ----------------
const storage = multer.memoryStorage(); // we will upload directly to Cloudinary
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 3 * 1024 * 1024 } // 3MB
});

// ---------------- Middleware ----------------
function ensureOwner(req, res, next) {
    if (!req.user) return res.redirect('/user/signin');
    if (String(req.user.id) !== String(req.params.id)) return res.status(403).send('Forbidden');
    return next();
}

// ---------------- Routes ----------------
router.get('/signin', (req, res) => res.render('signin'));
router.get('/signup', (req, res) => res.render('signup'));

// Signin POST
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const token = await User.matchpasswordtogeneratetoken(email, password);
        return res.cookie('token', token).redirect('/');
    } catch (error) {
        return res.render('signin', { error: 'Invalid Login Details' });
    }
});

// Signup POST
router.post('/signup', upload.single('profilepic'), async (req, res) => {
    try {
        const { username, email, bio, password } = req.body;
        let profilePath = '/images/default.jpg';

        if (req.file) {
            const result = await cloudinary.uploader.upload_stream({
                folder: 'Blog-World/Profiles'
            }, (error, result) => {
                if (error) throw error;
                return result;
            }).end(req.file.buffer);
            profilePath = result.secure_url;
        }

        const newUser = await User.create({
            username,
            email,
            bio: bio || '',
            password,
            profilepic: profilePath
        });

        const token = generatetokenforuser(newUser);
        return res.cookie('token', token).redirect('/');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Signup failed');
    }
});

// Update Profile POST
router.post('/profile/:id/update', ensureOwner, upload.single('profilepic'), async (req, res) => {
    try {
        const { bio } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send('User not found');

        if (typeof bio === 'string' && bio.trim().length > 0) {
            user.bio = bio.trim().slice(0, 300);
        }

        if (req.file) {
            // Delete old image from Cloudinary if not default
            if (user.profilepic && !user.profilepic.includes('/images/default.jpg')) {
                const publicId = user.profilepic.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`Blog-World/Profiles/${publicId}`).catch(() => {});
            }

            // Upload new image to Cloudinary folder
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'Blog-World/Profiles' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });

            user.profilepic = result.secure_url;
        }

        await user.save();
        const token = generatetokenforuser(user);
        res.cookie('token', token);

        return res.redirect(`/user/profile/${req.params.id}`);
    } catch (err) {
        console.error('Update error:', err);
        return res.status(500).send('Server error');
    }
});

router.get('/signout', (req, res) => res.clearCookie('token').redirect('/'));
router.get('/profile/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).render('404');
        return res.render('profile', { profileUser: user });
    } catch (error) {
        console.error(error);
        res.status(500).render('500');
    }
});

module.exports = router;
