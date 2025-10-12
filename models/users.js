const {Schema, model} = require('mongoose');
const userschema = new Schema({
    fullname : {type : String, required : true},
    email : {type : String, required : true, unique : true},
    password : {type : String, required : true},
    profilepic : {type : String, default : '.././public/default.png'},
    role : {type : String, enum : ['admin','user'], default : 'user'}
},{timestamps : true});


const {generatetokenforuser} = require('../utils/auth');


userschema.static("matchpasswordtogeneratetoken", async function(email, password){     
    const user = await this.findOne({email});
    if(!user) throw new Error("No user found");

    if(user.password !== password){
        throw new Error("Password doesn't match");
    }
    const token = generatetokenforuser(user);
    return token;
});

const User = model('user', userschema);

module.exports = User;