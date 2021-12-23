const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.exitRoom = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{

        // Check is user is already in a room
        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.user_id]
          );

        if (row_users[0].room_id == -1 ) {
            return res.status(201).json({
                message: "The user is not in a room",
            });
        }

        // Get the number of USERS in the room
        const [row_getcurrentusers] = await conn.execute(
            "SELECT COUNT(*) AS cnt FROM `users` WHERE `room_id`=?",
            [row_users[0].room_id]
        );

        if (row_getcurrentusers.length === 0) {
            return res.status(422).json({
                message: "There are no users in this room",
            });
        }

        // Get the number of PLAYERS in the room
        const [row_getcurrentplayers] = await conn.execute(
            "SELECT COUNT(*) AS cnt FROM `users` WHERE `room_id`=? and `role`=?",
            [row_users[0].room_id,
            "Player"]
        );

        if (row_getcurrentplayers.length === 0) {
            return res.status(422).json({
                message: "There are no players in this room",
            });
        }

        // Check is user is already in a room
        const [row_role] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.user_id]
        );
    
        if (row_role[0].role == "Viewer" ) {
            const [row_user_change] = await conn.execute(
                "UPDATE `users` SET `room_id`=?,`role`=? WHERE `user_id`=?",[
                    -1,
                    'NONE',
                    req.body.user_id
                ]);    

            return res.status(201).json({
                message: "Viewer exited room",
            });
        }

        users = row_getcurrentusers[0].cnt;
        players = row_getcurrentplayers[0].cnt;
        users_fin = users-1;

        if(users > 1){

            // Remove room id to the user table
            const [row_user_change] = await conn.execute(
                "UPDATE `users` SET `room_id`=?,`role`=? WHERE `user_id`=?",[
                    -1,
                    'NONE',
                    req.body.user_id
                ]);            
                
            // Get users from room    
            const [row_users] = await conn.execute(
                "SELECT * FROM `users` WHERE `room_id`=? and `user_id`!=? and `role`=?  LIMIT 1",[
                    req.body.room_id,
                    req.body.user_id,
                    "Player"
                ]);            
    
            // Make another user admin of the room
            const [row_user_makeadmin] = await conn.execute(
                "UPDATE `rooms` SET `admin_id`=? WHERE `room_id`=?",[
                    row_users[0].user_id,
                    req.body.room_id
                ]);            
        
            // Get room row
            const [row_room] = await conn.execute(
                "SELECT * FROM `rooms` WHERE `room_id`=?",
                [req.body.room_id]
            );
    
            if (row_room.length === 0) {
                return res.status(422).json({
                    message: "There is not any room by this id",
                });
            }   

            // If there are no viewers 
            if(users == players){
                const [row_room_change] = await conn.execute(
                    "UPDATE `rooms` SET `current_users`=? WHERE `room_id`=?",[
                        users_fin,
                        req.body.room_id
                    ]);            
            } else{
                
                // If the number of players was maximum, a viewer becomes a player 
                if(players == row_room[0].max_users){
                    // Check for viewers
                    const [row_viewers] = await conn.execute(
                        "SELECT * FROM `users` WHERE `room_id`=? and `role`=?",[
                        req.body.room_id,
                        "Viewer"
                    ]); 
                                        
                    const [row_role_change] = await conn.execute(
                        "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                            "Player",
                            row_viewers[0].user_id
                    ]);

                    return res.status(201).json({
                        message: "The user has been successfully erased from the room and a viewer became a player.",
                    });

                } 
            }
        } else{
            
            // The last user, the room closes
            const [row_user_change] = await conn.execute(
                "DELETE FROM `rooms` WHERE `admin_id`=?",[
                    req.body.user_id
                ]);            

            const [row_role_change] = await conn.execute(
                "UPDATE `users` SET `role`=?,`room_id`=? WHERE `user_id`=?",[
                    "NONE",
                    -1,
                    req.body.user_id
                ]);   

            return res.status(201).json({
                    message: "The user has been successfully removed from the room and the room has been deleted.",
            });

        }

        
    }catch(err){
        next(err);
    }
}