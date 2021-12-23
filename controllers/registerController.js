const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.register = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{

        const [row] = await conn.execute(
            "SELECT `email` FROM `users` WHERE `email`=?",
            [req.body.email]
          );

        if (row.length > 0) {
            return res.status(201).json({
                message: "The e-mail is already in use",
            });
        }

        const [row2] = await conn.execute(
            "SELECT `username` FROM `users` WHERE `username`=?",
            [req.body.email]
          );

        if (row2.length > 0) {
            return res.status(201).json({
                message: "The username is already in use",
            });
        }

        const hashPass = await bcrypt.hash(req.body.password, 12);

        const [rows] = await conn.execute('INSERT INTO `users`(`username`,`email`,`password`,`role`,`room_id`,`score`,`total_score`) VALUES(?,?,?,?,?,?,?)',[
            req.body.username,
            req.body.email,
            hashPass,
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