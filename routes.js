const express = require("express");
const Trivia = require("./models/Trivia");
const User = require("./models/User");
const bcrypt = require('bcrypt-nodejs');
const router = express.Router();

//Create user
router.post("/user/create", (req, res) => {
    User.find({email: `${req.body.email}`}, (err, account) => {
        if(!account.length){            
            bcrypt.hash(req.body.password, null, null, (err, hash) => {
                const user = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    phone: req.body.phone,
                    hashedPassword: hash,
                    street: req.body.street,
                    city: req.body.city,
                    state: req.body.state,
                    zipCode: req.body.state,
                    isAdmin: false
                })
                user.save();
                res.send(user._id);
            })
        }
        else{
            res.status(409).send({error: "Account already exists"});
        }
    })
})

//Check if user exists
router.post("/user/validate", (req, res) => {
    User.find({email: `${req.body.email}`}, (err, account) => {
        if(account.length){
            bcrypt.compare(`${req.body.password}`, account[0].hashedPassword, (err, response) => {
                if(response){
                    res.send({
                        _id: account[0]._id,
                        firstName: account[0].firstName,
                        lastName: account[0].lastName,
                        email: account[0].email,
                        phone: account[0].phone,
                        street: account[0].street,
                        city: account[0].city,
                        state: account[0].state,
                        zipCode: account[0].state
                    });
                }
                else{
                    res.status(400).send({error: "Invalid credentials"})
                }
            })
        }
        else{
            res.status(400).send({error: "Invalid credentials"})
        }
    })
})

//Update user
router.put("/user/update", (req, res) => {
    // res.send(req.body)
    let bodyProps = ["firstName", "lastName", "phone", "email", "password", "street", "city", "state", "zipCode"];
    let validUpdate = true;
    for(let propIndex = 0; propIndex < bodyProps.length; propIndex++){
        if(!req.body.hasOwnProperty(bodyProps[propIndex])){
            validUpdate = false;
            break;
        }
    }

    if(validUpdate){
        User.find({email: `${req.body.email}`}, (err, account) => {
            if(account) {
                bcrypt.hash(`${req.body.password}`, null, null, (err,hash) => {
                    account[0].firstName = req.body.firstName,
                    account[0].lastName = req.body.lastName,
                    account[0].phone = req.body.phone,
                    account[0].hashedPassword = hash,
                    account[0].street = req.body.street,
                    account[0].city = req.body.city,
                    account[0].state = req.body.state,
                    account[0].zipCode = req.body.zipCode
    
                    account[0].save((error, user) => {
                        if(err) return console.error(err);
                        res.status(200).send(user);
                    })
                })
            }
            else{
                res.status(400).send({error: "User doesn't exist"})
            }
        })
    }
    else{
        res.status(400).send({error: "Invalid credentials"})
    }
})

//Create question
router.post("/question/create", (req, res) => {
    Trivia.find({question: `${req.body.question}`}, (err, questions) => {
        if(!questions.length){            
            const triviaQuestion = new Trivia({
                question: req.body.question,
                answer: req.body.answer,
                approved: false,
                category: req.body.category,
                createdAt: new Date().getTime(),
            })
            triviaQuestion.save();
            res.send(triviaQuestion);
        }
        else{
            res.status(409).send({error: "Trivia question already exists!"});
        }
    })
})

//Get questions not approved
router.get("/question/pending", (req, res) => {
    Trivia.find({approved: false}, (err, questions) => {
        if(questions){
            // questions.sort();
            res.send(questions);
        }
    })
})

//Set question to be approved
router.put("/question/approve/:id", (req, res) => {
    Trivia.findById(req.params.id, (error, question) => {
        if(question){
            question.approved = true;
            question.save();
            res.status(200).send({message: "Question approved"});
        }
        else{
            res.status(400).send({error: "Invalid question"});
        }
    })
})

//Set question to be rejected
router.put("/question/reject/:id", (req, res) => {
    Trivia.findById(req.params.id, (error, question) => {
        if(question){
            question.approved = false;
            question.save();
            res.status(200).send({message: "Question approved"});
        }
        else{
            res.status(400).send({error: "Invalid question"});
        }
    })
})

//Get questions by category
router.get("/question/:category", (req, res) => {
    Trivia.find({category: `${req.params.category}`}, (err, questions) => {
        res.send(questions);
    })
})

module.exports = router