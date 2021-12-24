const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.exitGuest = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{

        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.user_id]
          );

        // Get the room
        if (row_users.length === 0) {
            return res.status(201).json({
                message: "The user doesn't exist",
            });
        }

        if((row_users[0].room_id!=-1)
            &&(row_users[0].role=="Player")){

                const [row_room_get] = await conn.execute(
                    "SELECT * FROM `rooms` WHERE `room_id`=?",
                    [row_users[0].room_id]);

                var users_after = row_room_get[0].current_users -1

                const [row_room] = await conn.execute(
                    "UPDATE `rooms` SET `current_users`=? WHERE `room_id`=?",
                    [users_after,
                    row_users[0].room_id]
                  );
        
                // Get the room
                if (row_room.affectedRows === 0) {
                    return res.status(201).json({
                        message: "The user wasn't erased from the room",
                    });
                }
        
                
        }


        // The last user, the room closes
        const [delete_user] = await conn.execute(
            "DELETE FROM `users` WHERE `user_id`=?",[
            req.body.user_id
        ]);  




        if (delete_user.affectedRows === 1) {
            return res.status(201).json({
                message: "The user has been successfully deleted.",
            });
        }
        
    }catch(err){
        next(err);
    }
}