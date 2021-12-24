const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.endGame = async(req,res,next) => {

    try{
        
    }catch(err){
        next(err);
    }
}