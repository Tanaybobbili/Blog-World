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

const upload = multer({ storage: storage });


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




module.exports = router;