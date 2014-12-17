"use strict";

module.exports = function(sequelize, DataTypes) {
  var dog = sequelize.define("dog", {

    // added validations to certain datatypes to restrict user when inputting data for dog(s)
    name: DataTypes.STRING,
    gender: DataTypes.STRING,
    breed: DataTypes.STRING,
    age: DataTypes.INTEGER,
    weight: DataTypes.STRING,
    userId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        models.dog.belongsTo(models.user)
      }
    }
  });

  return dog;
};
