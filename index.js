    const express = require('express');
    const app = express();
    const path = require('path');
    const mongoose = require('mongoose');
    const cookieparser = require('cookie-parser');
    const checkauthcookie = require('./middlewares/auth');
    const Blog = require('./models/blogs');
    const searchRouter = require('./routes/search');
    require('dotenv').config();
    
    const PORT = process.env.PORT || 8000;

    mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log("Mongodb connected");
    })
    .catch((err)=>{
        console.log("Error in connecting to mongodb");
        console.log(err);
    });

    const userrouter = require('./routes/user');
    app.use(express.urlencoded({extended : true}));
    app.use(express.json());
    app.use(cookieparser());
    app.use(checkauthcookie('token'));
    app.use(express.static(path.resolve('./public')));
    
    app.use('/user', userrouter);
    app.set('view engine', 'ejs');
    app.set("views", path.resolve("./views"));
    const blogrouter = require('./routes/blog');
    app.use('/blog', blogrouter);
    app.use('/search', searchRouter);

    app.get('/',async (req,res)=>{
        const blogs = await Blog.find({}).sort({ createdAt: -1 });
        res.render("home",{user : req.user, blogs, q: ''});
    });

    

    app.listen(PORT,()=>{
        console.log(`Server is running on http://localhost:${PORT}`);
    });