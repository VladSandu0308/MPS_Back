const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.enterGuest = async(req,res,next) => {
    try{
        
        guestemail = "guest@yahoo.com";
        randomusername = Math.random().toString(36).substring(2,8);
        randompass = Math.random().toString(36).substring(2,9);

        const [rows] = await conn.execute('INSERT INTO `users`(`username`,`email`,`password`,`role`,`room_id`,`score`,`total_score`) VALUES(?,?,?,?,?,?,?)',[
            randomusername,
            guestemail,
            randompass,
            `NONE`,
            -1,
            0,
            0
        ]);

        if (rows.affectedRows === 1) {
            return res.status(201).json({
                message: "The user has been successfully inserted.",
            });
        }
        
    }catch(err){
        next(err);
    }
}