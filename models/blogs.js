const {Schema, model} = require('mongoose');
const blogschema = new Schema({
    title : {type : String, required : true},
    content : {type : String, required : true},
    imageurl : {type : String},
    createdby : {type : Schema.Types.ObjectId, ref : 'user'}
},{timestamps : true});

const blog = model('blog', blogschema);

module.exports = blog;