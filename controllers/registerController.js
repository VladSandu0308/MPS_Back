const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.register = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{
        // Searching in the database for the email to see if it taken
        const [row] = await conn.execute(
            "SELECT `email` FROM `users` WHERE `email`=?",
            [req.body.email]
          );

        if (row.length > 0) {
            return res.status(422).json({
                message: "The e-mail is already in use",
            });
        }

        // Searching in the database for the username to see if it taken
        const [row2] = await conn.execute(
            "SELECT `username` FROM `users` WHERE `username`=?",
            [req.body.username]
          );

        if (row2.length > 0) {
            return res.status(422).json({
                message: "The username is already in use",
            });
        }

        // Hashing the given password
        const hashPass = await bcrypt.hash(req.body.password, 12);
        
        // Inserting the new user into the database
        const [rows] = await conn.execute('INSERT INTO `users`(`username`,`email`,`password`,`role`,`room_id`,`score`,`total_score`) VALUES(?,?,?,?,?,?,?)',[
            req.body.username,
            req.body.email,
            hashPass,
            `NONE`,
            -1,
            0,
            0
        ]);

        // Checking if the user was inserted into the database
        if (rows.affectedRows === 1) {
            return res.status(201).json({
                message: "The user has been successfully inserted.",
            });
        }
        
    }catch(err){
        next(err);
    }
}