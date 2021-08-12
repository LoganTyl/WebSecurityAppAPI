//https://rahmanfadhil.com/express-rest-api/

const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:25567/trivia_app", {useNewUrlParser: true})
.then(() => {
    const express = require("express");
    const routes = require('./routes');
    const cors = require('cors');

    const app = express();
    app.use(cors());

    app.use(express.json());
    app.use("/api", routes)
    
    app.listen(3000, () => {
        console.log("Server has started")
    });
})