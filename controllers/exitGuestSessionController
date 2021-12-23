const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.exitGuest = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{

        // The last user, the room closes
        const [delete_user] = await conn.execute(
            "DELETE FROM `users` WHERE `user_id`=?",[
            req.body.user_id
        ]);  


        if (delete_user.affectedRows === 1) {
            return res.status(201).json({
                message: "The user has been successfully inserted.",
            });
        }
        
    }catch(err){
        next(err);
    }
}