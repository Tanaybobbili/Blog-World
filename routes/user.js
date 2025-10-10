const express = require('express');
const router = express.Router();
const User = require('../models/users');

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
    const user = await User.findOne({email, password});
    if(user){
        console.log(user);
        return res.redirect('/');
    }
    return res.redirect('/user/signin');
});

router.post('/signup', async (req, res) => {
    const {fullname, email, password} = req.body;
    await User.create({fullname, email, password});
    return res.redirect('/');
});
module.exports = router;