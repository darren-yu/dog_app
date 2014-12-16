var express = require("express");

var session = require("express-session");

var multer = require("multer");

var bcrypt = require("bcrypt");

var db = require("./models/index.js");

var cloudinary = require("cloudinary");

var flash = require("connect-flash");

var app = express();


app.set("view engine", "ejs");


app.use(express.static(__dirname + "/public"));


app.use(multer({dest: __dirname + "/uploads"}));


// app.use(session({
// 	secret: "anbuking",
// 	resave: false,
// 	saveUninitialized: true
// }))


// app.use(flash());


// app.use(function(req, res, next) {
// 	req.getUser = function() {
// 		return req.session.user || false;
// 	}
// 	next();
// })


// app.get("*", function(req, res) {
// 	var alerts = req.flash();
// 	res.locals.alerts = alerts;
// 	next();
// })


app.get("/", function(req, res) {
	res.render("index");
});


app.post("/", function(req, res) {
	res.redirect("dogadd");
})


app.get("/signup", function(req, res) {
	res.render("signup");
})


app.post("/signup", function(req, res) {
	// res.send(req.body);
	db.user.findOrCreate({
		where: {
			"email":req.body.email},
		defaults: {
			"email":req.body.email,
			"password":req.body.password,
			"name":req.body.name,
			"address":req.body.address,
			"distance":req.body.distance}

	}).spread(function(data, created) {
		res.redirect("dogadd");
	}).catch(function(error) {
		if(error) {throw error};
	})
});



// db.author.findOrCreate({where: {name: "Anil"}}).spread(function(author,created) {
//   author.createPost({title: "taco"}).then(function(data) {
//     // data.updateAttributes({ content: "burrito" });
//   });
// })









app.get("/dogadd", function(req, res) {
	res.render("dogadd");
});

app.post("/dogadd", function(req, res) {

	var myImgPath = req.files.dogImg.path;
	res.send(req.body);
})


app.get("/doglist", function(req, res) {
	res.render("doglist");
})


app.get("/dogparkconnect", function(req, res) {
	res.render("dogparkconnect");
})









app.listen(3000);

