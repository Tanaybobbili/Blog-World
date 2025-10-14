const jwt = require('jsonwebtoken');
const secretkey = "20BlOg$29$WoRlD25";

function generatetokenforuser(user){
    const payload = {
        id: user._id, 
        username: user.username,
        email: user.email, 
        profilepic : user.profilepic, 
        role : user.role
    };
    const token = jwt.sign(payload, secretkey, {expiresIn: '24h'});
    return token;
}

function verifytoken(token){
    const payload = jwt.verify(token, secretkey);
    return payload;
}

module.exports = {generatetokenforuser, verifytoken};