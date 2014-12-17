var express = require("express");

var session = require("express-session");

var multer = require("multer");

var bcrypt = require("bcrypt"); 

var db = require("./models/index.js");

var cloudinary = require("cloudinary");

var flash = require("connect-flash");

var app = express();



app.set("view engine","ejs");

app.use(express.static(__dirname + "/public"));

app.use(multer({dest: __dirname + "/uploads"}));

app.use(session({
    // secret can be anything you use. its a salt for your session (DY)
    secret: "doggy play",
    resave: false,
    saveUninitialized: true
}))
 
// flash goes after the session (DY) 12.11.14 
app.use(flash());
// 


// middleware (DY)
// the middleware function that is created for the app (DY)
// has three parameters. (DY)
app.use(function(req, res, next) {
    req.getUser = function() {
        return req.session.user || false;
    }
    next();
})
// 


// added this code (DY) 12.11.14 
// grabs all alerts and then pass it down to each get route (DY) 12.11.14 
// the star is a wildcard and passes it along all get routes (DY) 12.11.14 
app.get("*", function(req, res, next) {
     var alerts = req.flash();
     res.locals.alerts = alerts;
     next();
})
// 


app.get("/",function(req,res){

    // res.send(req.flash());

    // added middleware chain for var user. (DY)
    var user = req.getUser();
   
    res.render("index",{"user":user});
    // 


});

// app.get("/restricted",function(req,res){


//     // adding authentic to access restricted page (DY)
//     if (req.getUser()) {
//         res.render("/");
//     }
//     else {

//         // the req.flash method is usually flash followed by the res.redirect for the message when declaring.. (DY) 12.11.14
//         // the variable above with the wild card "*" that works for all the get routes (DY) 12.11.14
//         req.flash("danger", "ACCESS DENIED");
//         res.redirect("/");
//         // 


//         // res.send("ACCESS DENIED");
//     }
//     // 


// });

//login form
app.get("/auth/login",function(req,res){
    res.render('login');
});

app.post("/auth/login",function(req,res){
    //do login here (check password and set session value)
    // res.send(req.body);

    // created db fine
    db.user.find({where: {"email":req.body.email}}).then(function(userObj) {
        if(userObj) {
            // check password

            // bcrypt comparing authentic user wrapping over session. In the function the "match" is a parameter (DY)
            // that can specified to be anything of choice by the developer. (DY)
            bcrypt.compare(req.body.password, userObj.password, function(err, match) {
                if (match === true) {


                    // session portion (DY)
                    // store user object in session (DY)
                    req.session.user = {
                        id: userObj.id,
                        email: userObj.email,
                        name: userObj.name
                    };
                    res.redirect("/dogs");


                }
                else {

                    // adding req.flash alert for else statement (DY) 12.11.14
                    req.flash("danger", "invalid password");
                    res.redirect("/auth/login");
                    // 
                }
            })

            // res.send("we will check the password now");
        }
        else {

            // adding req.flash alert for else statement (DY) 12.11.14
            req.flash("danger", "Unknown user.");
            res.redirect("/auth/login");
            // 
        }
    })
    // 


    //user is logged in forward them to the home page
    // res.redirect('/');
});

//sign up form
app.get("/auth/signup",function(req,res){
    res.render("signup");
});

app.post("/auth/signup",function(req,res){
    //do sign up here (add user to database)


    // code we wrote below (DY)
    db.user.findOrCreate({
        where: {
            "email":req.body.email},
        defaults:{
            "email":req.body.email,
            "password":req.body.password,
            "name":req.body.name,
            "address":req.body.address,
            "distance":req.body.distance}

        }).spread(function(user, created) {
            // res.send(user);
            res.redirect("/auth/login");
            // res.send({"data":data});
            // user.createDog({
            //     "breed":req.body.breed
            // })

            // .then(function(dogInfo) {
            //     dogInfo.updateAttributes({
            //         "name":req.body.name,
            //         "gender":req.body.gender,
            //         "age":req.body.age,
            //         "weight":req.body.weight
            //     }).then(function(dogInfo) {
            //         res.redirect("/auth/signupdog");
            //     })
            // })
    
    })
    .catch(function(error) {
        // res.send(error);

        // added code to check error and displaying flash msg.(DY) 12.11.14 
        if(error && Array.isArray(error.errors)) {
            error.errors.forEach(function(errorItem) {
                req.flash("danger",errorItem.message);
            });
        }
        else {
            req.flash("danger", "Unknown error");
        }
        res.redirect("/auth/login");
    })
    // 


    //user is signed up forward them to the home page
    // res.redirect('/');
});


app.get("/dogs/new", function(req, res) {
    res.render("signupdog");
})

app.post("/dogs", function(req, res) {
    var user = req.getUser();

    if (user) {
        db.user.find(user.id).then(function(user) {
            user.createDog({
                "breed":req.body.breed
            }).then(function(dogInfo) {
                dogInfo.updateAttributes({
                    "name":req.body.name,
                    "gender":req.body.gender,
                    "age":req.body.age,
                    "weight":req.body.weight
                }).then(function(dogInfo) {
                    res.redirect("/dogs");
                })
            })
        })
    } else {
        res.redirect("/auth/login");
    }
});



app.get("/dogs", function(req, res) {
    var user = req.getUser();

    if (user) {
        db.dog.findAll({where: {"userId":user.id}}).then(function(dogs) {
            // res.send(dogs);
            res.render("dogs", {"dogs": dogs});  
        })
    } else {
        res.redirect("/auth/login")
    }
    
})


app.get("/dogs/list", function(req, res) {
    var user = req.getUser();

    if (user) {
        db.dog.findAll({order: "id DESC"}).then(function(alldogs) {
            // res.send(alldogs);
            res.render("dogslist", {"alldogs": alldogs});
        })
    }
    else {
        res.redirect("auth/login")
    }

})




//logout
//sign up form
app.get("/auth/logout",function(req, res){

    // res.send('logged out'); 

    // learn new thing here (DY)
    delete req.session.user;

    // req.flash takes two parameters, first is the bootstrap color labels similar (DY) 12.11.14
    // to button, second is your msg (DY) 12.11.14 
    req.flash("info", "You have been log out");
    // 

    res.redirect("/");
    // 

});

app.listen(3000);