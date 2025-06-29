const { Schema, model } = require('mongoose');

const likeSchema = new Schema({
    blogId: {
        type: Schema.Types.ObjectId,
        ref: "blog",
        required: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
    }
}, { timestamps: true });

const Like = model("like", likeSchema);
module.exports = Like;