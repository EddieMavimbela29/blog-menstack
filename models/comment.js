const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    comment_body: {
        type: String
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },
        username: String
    },
    creationDate: {
        type: Date,
        default: Date.now()
    },
});

module.exports = mongoose.model("comment", commentSchema);