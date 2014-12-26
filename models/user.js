"use strict";

var bcrypt = require("bcrypt");

module.exports = function(sequelize, DataTypes) {
  var user = sequelize.define("user", {

    // added validations to certain datatypes to restrict specific user input.
    name: {
      type: DataTypes.STRING,
      validate: {
          len: {
            args: [5,60],
            msg: "Please enter your full first and last name."
          }
      }
    },
    address: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: {
          isEmail: {
              args: true,
              msg: "Please enter a valid email address."
          }
      }
    },
    password: {
      type: DataTypes.STRING,
      validate: {
          len: {
            args: [5,100],
            msg: "Please use a password longer than 5 characters."
          }
          
      }
    },
    distance: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        models.user.hasMany(models.dog)
      }
    },
    hooks: {

      beforeCreate: function(data, notUsed, sendback) {

        // password encryption 
        var pwdToEncrypt = data.password;

        bcrypt.hash(pwdToEncrypt, 11, function(error, hash) {
            data.password = hash;
            sendback(null, data);
        })


      }
    }
  });

  return user;
};
