const mongoose = require("mongoose");

const subpageSchema = new mongoose.Schema({
   
    title: String,
    more: String,
    name: String,
    address: String,
    lists: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "List"
        }
    ],
    message: 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Message"
        },
    type: 
        {
            type: String,
            default: 'motorcycle'
        },
    text: String,
    pictures: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Picture"
        }
    ]
});

module.exports = mongoose.model("Subpage", subpageSchema);