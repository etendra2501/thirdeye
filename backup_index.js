var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');                         //passport
var passport = require('passport');                               //passport
var passportLocalMongoose = require('passport-local-mongoose');   //passport
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var faceapi = require('face-api.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/views'));

app.use(session({                               //passport express-session
    secret: "This the secret line",              //passport express-session
    resave: false,                               //passport express-session
    saveUninitialized: false                     //passport express-session
}));                                            //passport express-session
app.use(passport.initialize());                 //passport
app.use(passport.session());                    //passport
app.use(methodOverride('_method'));
app.use(flash());

mongoose.connect("mongodb://localhost:27017/face_recognition", { useNewUrlParser: true, useUnifiedTopology: true });


//==================MongooseSchemasAndModels=======================
var userSchema = new mongoose.Schema({ username: String, password: String });
userSchema.plugin(passportLocalMongoose);           //passport
var User = mongoose.model("User", userSchema);
//==================///MongooseSchemasAndModels=====================


passport.use(new LocalStrategy(User.authenticate())); //passport colt
//passport.use(User.createStrategy());                //passport passport-local-mongoose angela
passport.serializeUser(User.serializeUser());       //passport passport-local-mongoose
passport.deserializeUser(User.deserializeUser());   //passport passport-local-mongoose

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

//========================Auth============================

app.get("/register", function (req, res) {
    res.render('register');
});

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash('error', err.message);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                req.flash('success', 'Welcome ' + user.username);
                res.redirect("/dashboard");
            });
        }
    });

});

app.post("/api/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) return res.status(500).json({ "result": err });
        else return res.status(200).json({ "result": "ok","user":user });
    });
});


app.get("/login", function (req, res) {
    res.render('login');
});

app.post("/login", passport.authenticate("local", { successRedirect: "/dashboard", failureRedirect: "/" }), function (req, res) { });

app.post('/api/login', passport.authenticate('local'), function (req, res) {
    return res.status(200).json({ "result": "ok","user":req.user});
});

app.get("/logout", function (req, res) {
    req.logout();
    req.flash('success', 'Successfuly Logged Out');
    res.redirect('/');
});

//=================///Auth===============

//=================FaceRecognitionAPI=============

app.get("/api/img",function(req,res){
    // Promise.all([
    //     faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    //     faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    //     faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    //   ]).then(function () { console.log("LOADED") })
    console.log(faceapi.nets)

      res.send('hi')
});

//==============///FaceRecognitionAPI=============

app.get("/", isLoggedIn, function (req, res) {
    res.render('face')
});
app.get("/dashboard", isLoggedIn, function (req, res) {
    res.render('dashboard')
});

app.get("/all-students", isLoggedIn, function (req, res) {
    res.render('all-dashboard-cards', {
        data: [
            { name: 'Tarun Jain', image: 'avatar.png', phone: '+917009950116' }, { name: 'Pratham Goyal', image: 'avatar.png', phone: '+919988034040' }, { name: 'Rajat Mittal', image: 'avatar.png', phone: '+919041950023' }, { name: 'Etendra Verma', image: 'avatar.png', phone: '+918601062439' }, { name: 'John Doe', image: 'avatar.png', phone: '+919999999999' }
        ]
    }
    )
});

app.get("/submitted", isLoggedIn, function (req, res) {
    res.render('all-dashboard-cards', {
        data: [
            { name: 'Tarun Jain', image: 'avatar.png', phone: '+917009950116' }, { name: 'Pratham Goyal', image: 'avatar.png', phone: '+919988034040' }
        ]
    }
    )
});

app.get("/verification-failed", isLoggedIn, function (req, res) {
    res.render('all-dashboard-cards', {
        data: [
            // {name:'Rajat Mittal',image:'avatar.png',phone:'+919041950023'}
        ]
    }
    )
});

app.get("/absentees", isLoggedIn, function (req, res) {
    res.render('all-dashboard-cards', {
        data: [
            { name: 'Etendra Verma', image: 'avatar.png', phone: '+918601062439' }
        ]
    }
    )
});


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error', 'You must login first');
        res.redirect('/login');
    }
}

app.listen(4000, function () {
    console.log("Listening at port 4000");
});