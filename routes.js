const express = require("express");
const Trivia = require("./models/Trivia");
const User = require("./models/User");
const bcrypt = require('bcryptjs');
const router = express.Router();
const uuid = require('uuid');

const authorize = async (req, res, next) => {
    console.log(req.body);
    if (req.body.email && req.body.token) {
        await User.find({email: req.body.email, token: req.body.token}, (err, account) => {
            if (account.length) next();
            else res.status(401).send({error: 'Unauthorized Access'});
        });
    } else res.status(401).send({error: 'Unauthorized Access'});
}

// const checkIfUnalteredCredentials = async (req,res,next) => {
//     let user = JSON.parse(localStorage.getItem('user'));
// }

//Create user
router.post("/user/create", (req, res) => {
    console.log(req.body);
    User.find({email: `${req.body.email}`}, (err, account) => {
        if(!account.length){
            let hash = bcrypt.hashSync(req.body.password, 10);
            
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
                isAdmin: false,
                token: ""
            })
            user.save();
            res.send({
                _id: user._id
            });
        }
        else{
            res.status(409).send({error: "Account already exists"});
        }
    })
})

//Check if user exists
router.post("/user/validate", async (req, res) => {
    await User.find({email: `${req.body.email}`}, async (err, account) => {
        if(account.length){
            let isAuth = bcrypt.compareSync(`${req.body.password}`, account[0].hashedPassword);
            
            if(isAuth){
                let token = uuid.v4();
                
                await User.updateOne({email: account[0].email}, {$set: { token }});

                res.send({
                    _id: account[0]._id,
                    firstName: account[0].firstName,
                    lastName: account[0].lastName,
                    email: account[0].email,
                    phone: account[0].phone,
                    street: account[0].street,
                    city: account[0].city,
                    state: account[0].state,
                    zipCode: account[0].state,
                    isAdmin: account[0].isAdmin,
                    token
                });
            }
            else{
                res.status(400).send({error: "Invalid credentials"})
            }
        }
        else{
            res.status(400).send({error: "Invalid credentials"})
        }
    })
})

//Update user
router.put("/user/update", authorize, (req, res) => {
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
                let hash = bcrypt.hashSync(`${req.body.password}`, 10);
                
                account[0].firstName = req.body.firstName,
                account[0].lastName = req.body.lastName,
                account[0].phone = req.body.phone,
                account[0].hashedPassword = hash,
                account[0].street = req.body.street,
                account[0].city = req.body.city,
                account[0].state = req.body.state,
                account[0].zipCode = req.body.zipCode,
                account[0].isAdmin = req.body.isAdmin

                account[0].save((error, user) => {
                    if(err) return console.error(err);
                    res.status(200).send(user);
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
router.post("/question/create", authorize, (req, res) => {
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
router.put("/question/approve/:id", authorize, (req, res) => {
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
router.put("/question/reject/:id", authorize, (req, res) => {
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
