const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.chooseRoom = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{
        
        const [row] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_name`=?",
            [req.body.room_name]
          );

        // Get the room
        if (row.length === 0) {
            return res.status(201).json({
                message: "The room doesn't exist",
            });
        }

        var pass;
        if(req.body.type =="PRIVATE")
            pass = req.body.password;
        if(req.body.type =="PUBLIC")
            pass = "-";

        // Verify passwords
        if(pass!=row[0].password){
            return res.status(422).json({
                message: "Incorrect password"
            });
        }
        
        // Check is user is already in a room
        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.user_id]
          );

        if (row_users[0].room_id != -1 ) {
            return res.status(201).json({
                message: "The user is already in a room",
            });
        }

        // Get the number of users in the room
        const [row_getcurrentusers] = await conn.execute(
            "SELECT COUNT(*) AS cnt FROM `users` WHERE `room_id`=?",
            [row[0].room_id]
        );

        if (row_getcurrentusers.length === 0) {
            return res.status(422).json({
                message: "There are no users in this room",
            });
        }

        users = row_getcurrentusers[0].cnt;
        user_fin = users+1;

        // If the number of users isn't maxium, then we add the user
        if(user_fin <= row[0].max_users){

            // Add the room id to the user table
            const [row_user_change] = await conn.execute(
                "UPDATE `users` SET `room_id`=? WHERE `user_id`=?",[
                    row[0].room_id,
                    req.body.user_id
                ]);            

            const [row_role_change] = await conn.execute(
                "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                    "Player",
                    req.body.user_id
                ]);            
    

            // Change the current users number in the rooms table
            const [row_room_change] = await conn.execute(
                "UPDATE `rooms` SET `current_users`=? WHERE `room_id`=?",[
                    user_fin,
                    row[0].room_id
                ]);            

            if ((row_user_change.affectedRows === 1) &&
                (row_room_change.affectedRows === 1) &&
                (row_role_change.affectedRows === 1)) {
                    return res.status(201).json({
                        message: "The user has been successfully added into the room.",
                });
            }
                    
        } else{
            
            // Add the room id to the user table
            const [row_user_change] = await conn.execute(
                "UPDATE `users` SET `room_id`=? WHERE `user_id`=?",[
                    row[0].room_id,
                    req.body.user_id
                ]);            

            const [row_role_change] = await conn.execute(
                "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                    "Viewer",
                    req.body.user_id
                ]);                 

            if ((row_user_change.affectedRows === 1) &&
                (row_role_change.affectedRows === 1)) {
                    return res.status(201).json({
                        message: "The user has been successfully added into the room as a viewer.",
                });
            }
            
        }


    }catch(err){
        next(err);
    }
}