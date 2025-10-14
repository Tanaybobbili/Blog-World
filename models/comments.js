const {Schema, model} = require('mongoose');

const commentschema = new Schema({
    content : {type : String, required : true},
    createdby : {type : Schema.Types.ObjectId, ref : 'User'},
    blog : {type : Schema.Types.ObjectId, ref : 'Blog'}
},{timestamps : true});

const Comment = model('Comment', commentschema);

module.exports = Comment;