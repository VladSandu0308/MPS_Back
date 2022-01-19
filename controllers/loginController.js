const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {validationResult} = require('express-validator');
const conn = require('../dbConnection').promise();




exports.login = async (req,res,next) =>{
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).json({ errors: errors.array() });
    }
    console.log(req.body);
    try{

        // Search for the user into the database by the username
        const [row] = await conn.execute(
            "SELECT * FROM `users` WHERE `username`=?",
            [req.body.username]
          );

        if (row.length === 0) {
            return res.status(422).json({
                message: "Invalid username address",
                token: 0
            });
        }

        // Check the given password with the already encrypted one from the database
        const passMatch = await bcrypt.compare(req.body.password, row[0].password);
        
        if(!passMatch){
            return res.status(422).json({
                message: "Incorrect password"
            });
        }
        
        // Get token
        const theToken = jwt.sign({user_id:row[0].user_id},'super-secret',{ expiresIn: '1h' });
        
        // Return the token, email, id and username of the user
        return res.json({
            token:theToken,
            email:req.body.email,
            user_id : row[0].user_id,
            username:row[0].username
        });

    }
    catch(err){
        next(err);
    }
}