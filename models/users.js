const {Schema, model} = require('mongoose');
const bcrypt = require('bcrypt');
const userschema = new Schema({
    username : {type : String, required : true},
    email : {type : String, required : true, unique : true},
    password : {type : String, required : true},
    profilepic : {type : String, default : '/images/default.jpg'},
    bio: { type: String, default: '' }
},{timestamps : true});


const {generatetokenforuser} = require('../utils/auth');



userschema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});


userschema.static("matchpasswordtogeneratetoken", async function(email, password){     
    const user = await this.findOne({email});
    if(!user) throw new Error("No user found");

    const match = await bcrypt.compare(password, user.password);
    if(!match) throw new Error("Password doesn't match");
    const token = generatetokenforuser(user);
    return token;
});

const User = model('User', userschema);

module.exports = User;