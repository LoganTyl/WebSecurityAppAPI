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

const authorizeAdmin = async (req, res, next) => {
    console.log(req.body);
    if (req.body.email && req.body.token) {
        await User.find({email: req.body.email, token: req.body.token}, (err, account) => {
            if (account.length && account[0].isAdmin) next();
            else res.status(401).send({error: 'Unauthorized Access'});
        });
    } else res.status(401).send({error: 'Unauthorized Access'});
}

// const checkIfUnalteredCredentials = async (req,res,next) => {
//     let user = JSON.parse(localStorage.getItem('user'));
// }

//Create user
router.post("/user/create", async (req, res) => {
    console.log(req.body);
    await User.find({email: `${req.body.email}`}, async (err, account) => {
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
                zipCode: req.body.zipCode,
                isAdmin: false,
                token: ""
            })
            await user.save();
            let data = {
                _id: user._id
            }
            res.status(200).send({data: data, message: "Successfully created user"});
        }
        else{
            res.status(409).send({error: "Account already exists"});
        }
    })
})

//Check if user exists
router.post("/user/validate", async (req, res) => {
    console.log(req.body);
    await User.find({email: `${req.body.email}`}, async (err, account) => {
        if(account.length){
            let isAuth = bcrypt.compareSync(`${req.body.password}`, account[0].hashedPassword);
            
            if(isAuth){
                let token = uuid.v4();
                
                await User.updateOne({email: account[0].email}, {$set: { token }});

                let data = {
                    _id: account[0]._id,
                    firstName: account[0].firstName,
                    lastName: account[0].lastName,
                    email: account[0].email,
                    phone: account[0].phone,
                    street: account[0].street,
                    city: account[0].city,
                    state: account[0].state,
                    zipCode: account[0].zipCode,
                    isAdmin: account[0].isAdmin,
                    token
                }
                res.status(200).send({data: data, message: "Successfully validated user"});
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
router.put("/user/update", authorize, async (req, res) => {
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
        await User.find({email: `${req.body.email}`}, async (err, account) => {
            if(account) {
                let hash = bcrypt.hashSync(`${req.body.password}`, 10);
                
                account[0].firstName = req.body.firstName,
                account[0].lastName = req.body.lastName,
                account[0].phone = req.body.phone,
                account[0].hashedPassword = hash,
                account[0].street = req.body.street,
                account[0].city = req.body.city,
                account[0].state = req.body.state,
                account[0].zipCode = req.body.zipCode

                await account[0].save((error, user) => {
                    if(err) return console.error(err);
                    res.status(200).send({data: user, message: "Successfully updated user"});
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
router.post("/question/create", authorize, async (req, res) => {
    await Trivia.find({question: `${req.body.question}`}, async (err, questions) => {
        if(!questions.length) {
            const triviaQuestion = new Trivia({
                question: req.body.question,
                answer: req.body.answer,
                approved: false,
                category: req.body.category,
                createdAt: new Date().getTime(),
            })
            await triviaQuestion.save();
            res.status(200).send({data: triviaQuestion, message: "Successfully created question"});
        }
        else{
            res.status(409).send({error: "Trivia question already exists!"});
        }
    })
})

//Get questions not approved
router.post("/question/pending", authorizeAdmin, async (req, res) => {
    await Trivia.find({approved: false}, async (err, questions) => {
        if(questions){
            // questions.sort();
            res.status(200).send({data: questions, message: "Successfully got questions"});
        }
    })
})

//Set question to be approved
router.put("/question/approve/:id", authorizeAdmin, async (req, res) => {
    await Trivia.findById(req.params.id, async (error, question) => {
        if(question){
            question.approved = true;
            await question.save();
            res.status(200).send({message: "Question approved"});
        }
        else{
            res.status(400).send({error: "Invalid question"});
        }
    })
})

//Set question to be rejected
router.put("/question/reject/:id", authorizeAdmin, async (req, res) => {
    await Trivia.findById(req.params.id, async (error, question) => {
        if(question){
            await Trivia.deleteOne({_id: req.params.id}, (err, result) => {
                if (result.deletedCount > 0) res.status(200).send({message: "Question rejected"});
                else res.status(404).send({error: "Could not remove question"});
            });
        }
        else{
            res.status(400).send({error: "Invalid question"});
        }
    })
})

//Get questions by category
router.get("/question/:category", async (req, res) => {
    await Trivia.find({category: `${req.params.category}`, approved: true}, async (err, questions) => {
        res.status(200).send({data: questions, message: "Successfully got questions in a category"});
    })
})

module.exports = router
