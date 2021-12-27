const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.chooseRoom = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{
        
        // Get the room row
        const [row] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_name`=?",
            [req.body.room_name]
          );

        if (row.length === 0) {
            return res.status(422).json({
                message: "The room doesn't exist",
            });
        }

        // Get the user given password
        var pass;
        if(req.body.type ==null)
            pass = "-";
        if(req.body.type =="PRIVATE")
            pass = req.body.password;
        if(req.body.type =="PUBLIC")
            pass = "-";

        // Verify passwords
        if(pass != row[0].password){
            return res.status(422).json({
                message: "Incorrect password"
            });
        }
        

        // Check is user is already in a room
        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.user_id]
          );

        if (row_users.length === 0) {
            return res.status(422).json({
                message: "The user doesn't exist",
            });
        }

        if ((row_users[0].room_id != -1 )||(row_users[0].role != "NONE")) {
            return res.status(422).json({
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

            if (row_user_change.affectedRows != 1){
                    return res.status(422).json({
                        message: "The user's room id wasn't updated successfully.",
                });
            }

            // Add the role to the users
            const [row_role_change] = await conn.execute(
                "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                    "Player",
                    req.body.user_id
                ]);            
    
            if (row_role_change.affectedRows != 1){
                    return res.status(422).json({
                        message: "The user's role wasn't updated successfully.",
                });
            }

            //  Verify if the game related to the room exists
            const [game_row] = await conn.execute(
                "SELECT * FROM `games` WHERE `room_id`=?",
                [row[0].room_id]
            );
        
            if (game_row.length === 0) {
                return res.status(422).json({
                message: "The game doesn't exist",
                });
            }
    
            // Get the number of players
            player_no = game_row[0].players_nr + 1;
    
            // Change the current users number in the rooms table
            const [row_room_change] = await conn.execute(
                "UPDATE `rooms` SET `current_users`=? WHERE `room_id`=?",[
                    user_fin,
                    row[0].room_id
                ]);            

            // Update the number of players in the game
            const [game_viewer_change] = await conn.execute(
                "UPDATE `games` SET `players_nr`=? WHERE `room_id`=?",[
                    player_no,
                    row[0].room_id
            ]);

            if ((game_viewer_change.affectedRows === 1) &&
                (row_room_change.affectedRows === 1)) {
                    return res.status(201).json({
                        message: "The user has been successfully added into the room.",
                });
            }
                    
        } else{
            
            // Add the room id to the users
            const [row_user_change] = await conn.execute(
                "UPDATE `users` SET `room_id`=? WHERE `user_id`=?",[
                    row[0].room_id,
                    req.body.user_id
                ]);            

            if (row_user_change.affectedRows != 1){
                    return res.status(422).json({
                        message: "The user's room id wasn't updated successfully.",
                });
            }

            const [row_role_change] = await conn.execute(
                "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                    "Viewer",
                    req.body.user_id
                ]);                 
            
            if (row_role_change.affectedRows != 1){
                    return res.status(422).json({
                        message: "The user's role wasn't updated successfully.",
                });
            }


            // add viewer to the game
            const [game_row] = await conn.execute(
                "SELECT * FROM `games` WHERE `room_id`=?",
                [row[0].room_id]
              );
    
            if (game_row.length === 0) {
                return res.status(422).json({
                    message: "The game doesn't exist",
                });
            }

            viewer_no = game_row[0].viewers_nr + 1;

            const [game_viewer_change] = await conn.execute(
                "UPDATE `games` SET `viewers_nr`=? WHERE `room_id`=?",[
                    viewer_no,
                    row[0].room_id
              ]);


            if (game_viewer_change.affectedRows === 1) {
                    return res.status(201).json({
                        message: "The user has been successfully added into the room and game as a viewer.",
                });
            }
        }

    }catch(err){
        next(err);
    }
}