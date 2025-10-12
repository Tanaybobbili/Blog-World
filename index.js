    const express = require('express');
    const app = express();
    const path = require('path');
    const PORT = 8000;
    const mongoose = require('mongoose');
    const cookieparser = require('cookie-parser');
    const checkauthcookie = require('./middlewares/auth');
    mongoose.connect('mongodb://localhost:27017/blogworld')
    .then(()=>{
        console.log("Mongodb connected");
    })
    .catch((err)=>{
        console.log("Error in connecting to mongodb");
        console.log(err);
    });

    const userrouter = require('./routes/user');
    app.use(express.urlencoded({extended : true}));
    app.use(cookieparser());
    app.use(checkauthcookie('token'));
    app.use('/user', userrouter);
    app.set('view engine', 'ejs');
    app.set("views", path.resolve("./views"));
    app.get('/',(req,res)=>{
        res.render("home",{user : req.user});
    });

    app.listen(PORT,()=>{
        console.log(`Server is running on http://localhost:${PORT}`);
    });