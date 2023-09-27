var express = require("express")
var app = express()
const morgan = require("morgan")
//const bcrypt = require('bcrypt')
const bcrypt = require('bcryptjs')
const bodyParser = require("body-parser")
const nodemailer = require("nodemailer")
const path = require("path")
const jwt = require('jsonwebtoken')
const mongoose = require("mongoose")
const contactForm = require("./Model/enquiryData")
const user = require('./Model/user')
const randomString = require("randomstring")
//const {check} = require('express-validator')
//const { userRegValidator } = require("./Controller/validation")
const { error } = require("console")
const url = "mongodb+srv://kaviuln1335:kaviuln@cluster0.hcagxgu.mongodb.net/?retryWrites=true&w=majority"
require("dotenv").config();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

var port = process.env.port || 8080;

try{
    mongoose.connect(url, {useUnifiedTopology: true}, {useNewUrlParser: true},
        () => console.log("Mongoose connected"),
        );
    } catch (e) {
        console.log("Mongoose not connected!");
    }
    
    const db = mongoose.connection
    
    db.on('error', (err) => {
        console.log(err)
    })
    
    db.once('open', () => {
        console.log("Database Connection Established!")
    })

    app.get('/enquiry', (req, res) => {
        res.sendFile(__dirname+'/contactUs.html');
    })

    

    app.get('/register', (req, res) => {
        res.sendFile(__dirname+'/register.html');
    })

    app.get('/login', (req, res) => {
        res.sendFile(__dirname+'/login.html');
    })


app.post('/enquiry', (req, res) => {
    let enquiry = new contactForm  ({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message
    });

    enquiry.save()
    .then(enquiry => {
        res.json({message: "Thanks for contacting us!"})
    })
    .catch(error => {
        res.json({message: "An error occured! Try again. Student id must be of exactly 10 characters"})
    })
    
})


 //Function for hashing the password

 const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 2);
        return passwordHash;

    } catch (error) {
        console.log("Error with password hashing: ", error.message);
    }
 }
 
 
 // Regustration API
 
 app.post('/register',  async (req, res) => {

//  bcrypt.hash(req.body.password, 2, function(err, hashedPass){
//         if(err) {
//             res.json({
//                 error: err
//             })
//         }
    const userPassword = await securePassword(req.body.password);
        
    let users = new user ({
        name: req.body.name,
        std_id: req.body.std_id,
        email: req.body.email,
        password: userPassword
       
        
    });
    // users.save()
    // .then(user => {
    //                 res.json({
    //                     message: 'User registered successfully!'
    //                 })
    //             })
    //             .catch(error => {res.json({
    //                 message: "An error occured! Try again. Double check the student id and email."
            
    //             })
    //         })

    const userdata = await users.save();

        if (userdata){
            sendVerifyMail(req.body.name, req.body.email, userdata._id);
            res.json({message: "Your registration is successfull, please verify your email."})
        } else {
            res.json({message: "User not registered!"})
        }

        
})


//Login API

 app.post('/login', (req, res) => {

        var email = req.body.email
        var password = req.body.password
    
        user.findOne({$or: [{email:email}, {std_id:email}] })
        .then(user => {
            if(user.is_verified == 1){
                bcrypt.compare(password, user.password, function(err, result) {
                    if(err){
                        res.json({error: err})
                    }
                    if(result){
                       let token = jwt.sign({name: user.name}, 'verySecretValue', {expiresIn: '2h'})
                       res.json({message:"Login Successful! ", token})
                       //res.send("Login Successful")
                
                        
                    }
                    else{
                        res.json({
                            message: "Email/ID or Password Invalid!"
                        })
                        //res.send("Login Failed! Email or Password invalid.")
                    }
    
                })
    
            }
            else {
                res.json({message: 'No user found!'})
            }
        })
        .catch(error => {
            res.json({
                message:"No user found!"
            })
        })
    
    
    })



// Forgot Password Mail Config

const forgotPassMail = async(name, email, token) => {
    try{

       const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: 'Password Reset',
            html: '<p> Hello '+name+', Please copy the <a href="http://127.0.0.1:8080/reset-password?token='+token+'"> link </a> and reset your password'
        }

    transporter.sendMail(mailOptions, function(error, info)
    {
        if(error){
            console.log(error);
        } else{
            console.log("Mail has been sent: ", info.response);
        }
    })

        
    } catch (error) {

        res.json({message: "An error occured!"})

    }

}


// Forgot Password API

app.post('/forgot-password', async (req, res) => {
//const forgot_password = async (req, res) => {

    try {
        const email = req.body.email
        const userData = await user.findOne({email: email});

        if (userData) {

            const string = randomString.generate();
            const data = await user.updateOne({email:email}, {$set: {token:string}});
            forgotPassMail(userData.name, userData.email, string);
            res.json({message: "Please check your email to reset your password. Thank you! Token: ", token})
            
        } else {
            res.json({message: "User not found! Try again."})
        }
        
    } catch (error) {

        res.json({message: "An error occured!"})
        
    }
})

// Reset Password API

app.post('/reset-password', async (req, res) => {

    try {
        const token = req.query.token;
        const tokenData = await user.findOne({token: token});

        if (tokenData) {

            const password = req.body.password;
            const newPassword = await securePassword(password)
            const passUpdate = await user.findByIdAndUpdate({_id:tokenData._id}, {$set: {password: newPassword, token: ''}}, {new: true})
            res.json({message:" Password has been reset!", data: passUpdate})
        } else {
            res.json({message: "This link has been expired."})
        }
        
    } catch (error) {

        res.json({message: "An error occured!"})
        
    }

})


// User Verification Mail Config

const sendVerifyMail = async (name, email, user_id) => {
    try {
 
        const transporterMail = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASSWORD
            }
    
 });

 const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: 'Email Verification',
    html: '<p> Hello '+name+', Please copy the <a href="http://127.0.0.1:8080/email-verify?id='+user_id+'"> link </a> to verify your email.'
}

transporterMail.sendMail(mailOptions, function(error, info)
{
if(error){
    console.log(error);
} else{
    console.log("Verfication Email has been sent: ", info.response);
}
})

    } catch (error) {
        console.log(error.message)


    }
}

app.get('/email-verify', async (req, res) => {

        try{

        const updateInfo = await user.updateOne({_id:req.query.id}, { $set:{ is_verified:1 } });
        console.log(updateInfo);
        res.render("email-verfied");


        } catch (error) {
            console.log(error.message);
    
    }

})


app.listen(port,()=>{
    console.log("App listening to: " + port)
})