const {Schema, model} = require('mongoose');
const blogschema = new Schema({
    title : {type : String, required : true},
    content : {type : String, required : true},
    imageurl : {type : String},
    createdby : {type : Schema.Types.ObjectId, ref : 'User'}
},{timestamps : true});

const Blog = model('Blog', blogschema);

module.exports = Blog;