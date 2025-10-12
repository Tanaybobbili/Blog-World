const express = require('express');
const router = express.Router();
const User = require('../models/users');
const {matchpasswordtogeneratetoken} = require('../models/users');
router.get('/signin', (req, res) => {
    res.render('signin');
}
);
router.get('/signup', (req, res) => {
    res.render('signup');
});    
router.get('/signin', (req, res) => {
    res.render('signin');
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

router.post('/signup', async (req, res) => {
    const {fullname, email, password} = req.body;
    await User.create({fullname, email, password});
    return res.redirect('/');
});

router.get('/signout', (req, res) => {
    res.clearCookie('token').redirect('/');
});
module.exports = router;