const {Schema, model} = require('mongoose');
const userschema = new Schema({
    fullname : {type : String, required : true},
    email : {type : String, required : true, unique : true},
    password : {type : String, required : true},
    profilepic : {type : String, default : '.././public/default.png'},
    role : {type : String, enum : ['admin','user'], default : 'user'}
},{timestamps : true});

const User = model('user', userschema);

module.exports = User;