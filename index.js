//https://rahmanfadhil.com/express-rest-api/

const express = require("express");
const mongoose = require("mongoose");
const routes = require('./routes');

mongoose.connect("mongodb://localhost:25567/trivia_app", {useNewUrlParser: true})
.then(() => {
    const app = express();
    app.use(express.json());
    app.use("/api", routes)
    
    app.listen(3000, () => {
        console.log("Server has started")
    })
})