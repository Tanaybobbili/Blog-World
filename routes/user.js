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
    const {username, email, password,} = req.body;
    const profile = req.file.filename;

    await User.create({username, email, password, profilepic : `/profiles/${profile}`});
    return res.redirect('/');
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
        res.render('profile', { user });
    } catch (error) {
        console.error(error);
        res.status(500).render('500');
    }
});

router.post('/profile/:id/avatar', function(req, res, next) {
    if (!req.user) {
        return res.redirect('/user/signin');
    }
    if (String(req.user.id) !== String(req.params.id)) {
        return res.status(403).send('Forbidden');
    }
    upload.single('profilepic')(req, res, function (err) {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).send(err.message || 'Upload failed');
        }

        (async () => {
            try {
                if (!req.file) return res.status(400).send('No file uploaded');

                const filename = req.file.filename;
                const profilePath = `/profiles/${filename}`;

                const user = await User.findById(req.params.id);
                if (!user) return res.status(404).send('User not found');

                user.profilepic = profilePath;
                await user.save();
                
                const {generatetokenforuser} = require('../utils/auth');
                const token = generatetokenforuser(user);
                res.cookie('token', token);

                return res.redirect(`/user/profile/${req.params.id}`);
            } catch (e) {
                console.error(e);
                return res.status(500).send('Server error');
            }
        })();
    });
});

module.exports = router;