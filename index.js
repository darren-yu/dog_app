var express = require("express");

var session = require("express-session");

var multer = require("multer");

var bodyParser = require("body-parser");

var bcrypt = require("bcrypt"); 

var db = require("./models/");

var cloudinary = require("cloudinary");

var flash = require("connect-flash");

var sendgrid = require("sendgrid")(
    process.env.SENDGRID_USERNAME, 
    process.env.SENDGRID_PASSWORD
);

var app = express();


app.set("view engine","ejs");

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({extended:false}));

app.use(multer({dest: __dirname + "/uploads"}));

app.use(session({
    secret: "doggy play",
    resave: false,
    saveUninitialized: true
}));
 
app.use(flash());

// middleware for sessions.
app.use(function(req, res, next) {
    req.getUser = function() {
        return req.session.user || false;
    }
    next();
});

// passing alerts and user for all get routes
app.get("*", function(req, res, next) {
     var alerts = req.flash();
     res.locals.alerts = alerts;
     res.locals.user = req.getUser();
     next();
});


// main landing page
app.get("/",function(req,res){
    res.render("index"); 
});


//login form
app.get("/auth/login",function(req,res){
    var user = req.getUser();

    if(user) {
        res.redirect("/dogs");
    }
    else {
        res.render("login");
    }
});


app.post("/auth/login",function(req,res){
    //do login here (check password and set session value)
    // res.send(req.body);
    db.user.find({where: {"email":req.body.email}}).then(function(userObj) {
        if(userObj) {
            // check password

            // bcrypt comparing user authentication.
            bcrypt.compare(req.body.password, userObj.password, function(err, match) {
                if (match === true) {

                    // store user object in session.
                    req.session.user = {
                        "id": userObj.id,
                        "email": userObj.email,
                        "name": userObj.name
                    };
                    res.redirect("/dogs");
                }
                else {
                    req.flash("danger", "invalid password");
                    res.redirect("/auth/login");
                }
            })

            // res.send("we will check the password now");
        }
        else {
            req.flash("danger", "Unknown user.");
            res.redirect("/auth/login");
        }
    })
});


//sign up form
app.get("/auth/signup",function(req,res){
    res.render("signup");
});


app.post("/auth/signup",function(req,res){
    //do sign up here (add user to database)
    // console.log(req.body);

    db.user.findOrCreate({
        where: {
            "email":req.body.email},
        defaults: {
            "email":req.body.email,
            "password":req.body.password,
            "name":req.body.name,
            "address":req.body.address,
            "distance":req.body.distance}

        })
        .spread(function(user, created) {
            // res.send(user);
            res.redirect("/auth/login");
        })
        .catch(function(error) {
            // res.send(error);

            // added code to check error and displaying flash msg.
            if(error && Array.isArray(error.errors)) {
                error.errors.forEach(function(errorItem) {
                    req.flash("danger",errorItem.message);
                });
            }
            else {
                req.flash("danger", "Unknown error");
            }
            res.redirect("/auth/signup");
        })
  
});


// get route "/dogs/new" is for user to add their dogs
app.get("/dogs/new", function(req, res) {
    var user = req.getUser();

    if (user) {
        res.render("signupdog");
    }
    else {
        res.redirect("/auth/login")
    }
})


// post route "/dogs" is for user to input their own dogs
app.post("/dogs", function(req, res) {

    // console.log("--------------------dog img", req.files.dogImg) ;
    // return;
    if(!req.files.dogImg) {
        req.flash("danger", "Please attach a image of your dog");
        res.redirect("/dogs/new");
        return;
    }

    var user = req.getUser();
    var myImgPath = req.files.dogImg.path;

    if (user) {
        db.user.find(user.id).then(function(user) {
            user.createDog({
                "breed":req.body.breed
            })
            .then(function(dogInfo) {
                dogInfo.updateAttributes({
                    "name":req.body.name,
                    "gender":req.body.gender,
                    "age":req.body.age,
                    "weight":req.body.weight
                })
                .then(function(dogInfo) {
                    // uploading image to cloudinary
                    cloudinary.uploader.upload(myImgPath,function(result) {
                        // console.log(result);
                        res.redirect("/dogs");

                    },{"public_id":"dog_" + dogInfo.id});
                    
                })
            })
        })
    } 
    else {
        res.redirect("/auth/login");
    }
});


// user's landing page to display all their dogs
app.get("/dogs", function(req, res) {
    var user = req.getUser();

    if (user) {
        db.dog.findAll({where: {"userId":user.id}}).then(function(dogs) {
            // res.send(dogs);

            dogs = dogs.map(function(element) {
                element.thumb = cloudinary.url("dog_" + element.id + ".png", {
                    width: 70,
                    height: 70, 
                    crop: "fill",
                    gravity: "face",
                    radius: "max"
                });
                return element;
            });

            res.render("dogs", {"dogs":dogs,"user":user});  
        })
    } 
    else {
        res.redirect("/auth/login")
    }
    
})


// delete button to remove user specific dogs
app.delete("/dogs/:id", function(req, res) {
    // console.log("-----------------*********-------------",req.params.id)
    db.dog.destroy({where: {"id":req.params.id}}).then(function(data){
        res.send({"delete": data});
    })
})


// get route for all the dogs in the dogs models 
app.get("/dogs/list", function(req, res) {

    var user = req.getUser();
    // res.send(user);

    // filter object to check against db per the req.queries.
    var filters = {userId:{ne:user.id}};

    // filtering dogs by criteria and passing the filtered key/value pair to check against dogs db.
    if(req.query.weight) {
        filters.weight=req.query.weight;
    }
    if(req.query.gender) {
        filters.gender=req.query.gender;
    }

    if (user) {
        db.dog.findAll({where:filters, order: "id DESC"}).then(function(alldogs) {
            // res.send(alldogs);

            alldogs = alldogs.map(function(element) {
                element.thumb = cloudinary.url("dog_" + element.id + ".png", {
                    width: 70,
                    height: 70, 
                    crop: "fill",
                    gravity: "face",
                    radius: "max"
                });
                return element;
            });

            res.render("dogslist", {"alldogs":alldogs});
        })
    }
    else {
        res.redirect("/auth/login");
    }

})


// get route for users to select a park and comment to other dog owners.
app.get("/dogs/play/:id", function(req, res) {
    var user = req.getUser();

    if (user) {
        res.render("parkscomment");
    }
    else {
        res.redirect("/auth/login");
    }
})


app.post("/dogs/play/:id", function(req, res) {

    var user = req.getUser();

    if (user) {

        db.dog.find(req.params.id).then(function(dog) {
            dog.getUser().then(function(otherUser) {

                var mailBody = "";
                mailBody += user.name + ", would like their dog to meet yours at " + req.body["dog-park"] + "." + "\r\n\r\n";
                mailBody += req.body.comment;
                var mailData={
                    to: otherUser.email,
                    from: user.email,
                    subject: "Doggy Play Pals: Incoming Play Date!",
                    text: mailBody
                };

                // console.log('mail data',mailData);
                sendgrid.send(mailData, function(err, json) {
                    if (err) {
                        req.flash("danger", err);
                    }
                    else {
                        req.flash("success", "An email has been sent to doggy owner for play date.");
                        // console.log('json response',json);
                    }
                    res.redirect("/dogs/list");
                });
            });
        });
    }
    else {
        res.redirect("/auth/login");
    }
})


//logout
app.get("/auth/logout",function(req, res){

    // res.send('logged out'); 
    delete req.session.user;
    req.flash("info", "You have been log out");
    res.redirect("/");

});


app.use(function(req, res){
    // var errMsg = "";
    // errMsg += "404 Error: Page not found. \r\n\r\n"
    // errMsg += "Sorry, the file that is being accessed doesn't exist or isn't available."
    res.status(404);
    res.render("error404");
});


app.listen(process.env.PORT || 3000);



