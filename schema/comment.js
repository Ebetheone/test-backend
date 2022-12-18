"use strict";
var mongoose = require("mongoose");

/*
 * Photo can have comments and we stored them in the Photo object itself using
 * this Schema:
 */
var commentSchema = new mongoose.Schema({
  comment: String, // The text of the comment.
  date_time: { type: Date, default: Date.now }, // The date and time when the comment was created.
  user_id: mongoose.Schema.Types.ObjectId, // 	The ID of the user who created the comment.
});
var Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
