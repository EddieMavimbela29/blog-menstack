const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

    title: {
        type: String
    },
    description: {
        type: String
    },
    creationDate: {
        type: Date,
        default: Date.now()
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },
        username: String
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category"
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment"
    }],
    image: String,

    imageId: String

});

module.exports = mongoose.model("post", postSchema);