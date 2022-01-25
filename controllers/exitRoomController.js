const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const e = require('express');
const conn = require('../dbConnection').promise();

exports.exitRoom = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{
        console.log(req.body);
        // Check if the user is already in a room and the right room
        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.user_id]
          );

        if (row_users[0].room_id == -1 ) {
            return res.status(422).json({
                message: "The user is not in a room",
            });
        }

        if (row_users[0].room_id != req.body.room_id ) {
            return res.status(422).json({
                message: "The user is not in this room",
            });
        }

        // Get room info
        const [room_row] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_id`=?",
            [req.body.room_id]
          );

        if (room_row[0].length == 0 ) {
            return res.status(422).json({
                message: "The room doesn't exist",
            });
        }

        // Get the number of total USERS in the room
        const [row_getcurrentusers] = await conn.execute(
            "SELECT COUNT(*) AS cnt FROM `users` WHERE `room_id`=?",
            [row_users[0].room_id]
        );
        
        if (row_getcurrentusers.length === 0) {
            return res.status(422).json({
                message: "There are no users in this room",
            });
        }

        users = row_getcurrentusers[0].cnt;



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
    
        players = row_getcurrentplayers[0].cnt;

        

        // The case where the user is a viewer
        if (row_users[0].role == "Viewer" ) {

            // Edit the number of viewers in the game
            const [game_change] = await conn.execute(
                "UPDATE `games` SET `viewers_nr`=? where `room_id`=?",[
                    (users-players-1),
                    req.body.room_id
            ]);            

            if (game_change.affectedRows != 1) {
                return res.status(422).json({
                    message: "The game wasn't successfully modified.",
                });
            }

            // The viewer is a guest so his account should be deleted
            if(row_users[0].email=="guest@yahoo.com"){
                const [delete_user] = await conn.execute(
                    "DELETE FROM `users` WHERE `user_id`=?",[
                    req.body.user_id
                ]);  
        
                if (delete_user.affectedRows === 1) {
                    return res.status(201).json({
                        message: "The guest user has been successfully deleted.",
                    });
                }        
            }

            // A normal user is viewer, it exits room
            const [row_user_change] = await conn.execute(
                "UPDATE `users` SET `room_id`=?,`role`=? WHERE `user_id`=?",[
                    -1,
                    'NONE',
                    req.body.user_id
            ]);            

            if (row_user_change.affectedRows != 1) {
                return res.status(422).json({
                    message: "The user wasn't successfully modified.",
                });
            }

            return res.status(201).json({
                message: "Viewer exited room",
            });

        }

        users_fin = users-1;

        // If there are more users except the one that wants to exit
        if(users > 1){

            if(row_users[0].email=="guest@yahoo.com"){
                // If the user is a guest, then we erase it from the database
                
                const [delete_user] = await conn.execute(
                    "DELETE FROM `users` WHERE `user_id`=?",[
                    req.body.user_id
                ]);  
        
                if (delete_user.affectedRows != 1) {
                    return res.status(422).json({
                        message: "The user wasn't successfully deleted.",
                    });
                }

                
                
            } else {    // If the player wasn't a guest account

                // Remove room id to the user table
                const [row_user_change] = await conn.execute(
                    "UPDATE `users` SET `room_id`=?,`role`=? WHERE `user_id`=?",[
                        -1,
                        'NONE',
                        req.body.user_id
                    ]);            

                if (row_user_change.affectedRows != 1) {
                    return res.status(422).json({
                        message: "The user wasn't successfully modified.",
                    });
                }

            }

            // The user was erased from the database

            // Get users from room    
            const [row_players] = await conn.execute(
                "SELECT * FROM `users` WHERE `room_id`=? and `user_id`!=? and `role`=?  LIMIT 1",[
                    req.body.room_id,
                    req.body.user_id,
                    "Player"
                ]);            
            
            if(row_players.length == 0){
                // There weren't any other players in the room only viewers

                // Check for viewers
                const [row_viewers_noplayers] = await conn.execute(
                        "SELECT * FROM `users` WHERE `room_id`=? and `role`=?",[
                        req.body.room_id,
                        "Viewer"
                    ]); 
                           
                if (row_viewers_noplayers.length === 0) {
                    return res.status(422).json({
                        message: "There are no viewers and players in this room",
                    });
                }

                // Updates a viewer to player
                const [row_user_change] = await conn.execute(
                    "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                        'Player',
                        row_viewers_noplayers[0].user_id
                ]);            
    
                if (row_user_change.affectedRows != 1) {
                    return res.status(422).json({
                        message: "The user wasn't successfully modified.",
                    });
                }

                // Make the newly player the admin of the room
                if(room_row[0].admin_id == req.body.user_id){
                    const [row_user_makeadmin] = await conn.execute(
                        "UPDATE `rooms` SET `admin_id`=? WHERE `room_id`=?",[
                            row_viewers_noplayers[0].user_id,
                            req.body.room_id
                        ]); 
                        
                        if (row_user_makeadmin.affectedRows != 1) {
                            return res.status(422).json({
                                message: "The user wasn't successfully modified.",
                            });
                        }      
                        
                }

                // Change number
                // Edit the number of viewers in the game
                const [game_change] = await conn.execute(
                    "UPDATE `games` SET `viewers_nr`=? where `room_id`=?",[
                    (users-players-1),
                    req.body.room_id
                ]);            

                if (game_change.affectedRows != 1) {
                    return res.status(422).json({
                        message: "The game wasn't successfully modified.",
                    });
                }
                

            } else{

                // Check, and change if needed, admin
                if(room_row[0].admin_id == req.body.user_id){

                    // Make another user admin of the room
                    const [row_user_makeadmin] = await conn.execute(
                        "UPDATE `rooms` SET `admin_id`=? WHERE `room_id`=?",[
                            row_players[0].user_id,
                            req.body.room_id
                        ]);            

                    if (row_user_makeadmin.affectedRows != 1) {
                        return res.status(422).json({
                            message: "The user wasn't successfully modified.",
                        });
                    }      

                }

                
                // If there are no viewers 
                if(users == players){

                    const [row_room_change] = await conn.execute(
                        "UPDATE `rooms` SET `current_users`=? WHERE `room_id`=?",[
                            users_fin,
                            req.body.room_id
                        ]);            

                    if (row_room_change.affectedRows != 1) {
                        return res.status(422).json({
                            message: "The room wasn't successfully modified.",
                        });
                    }      

                    const [row_game_change] = await conn.execute(
                        "UPDATE `games` SET `players_nr`=? WHERE `room_id`=?",[
                            users_fin,
                            req.body.room_id
                        ]);            

                    if (row_game_change.affectedRows != 1) {
                        return res.status(422).json({
                            message: "The game wasn't successfully modified.",
                        });
                    }      

                } else{
                    
                    // If the number of players was maximum, a viewer becomes a player 
                    if(players == room_row[0].max_users){

                        // Check for viewers
                        const [row_viewers] = await conn.execute(
                            "SELECT * FROM `users` WHERE `room_id`=? and `role`=?",[
                            req.body.room_id,
                            "Viewer"
                        ]); 
                            
                        if (row_viewers.length === 0) {
                            return res.status(422).json({
                                message: "There are no viewers",
                            });
                        }
        
                        // Change role
                        const [row_role_change] = await conn.execute(
                            "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                                "Player",
                                row_viewers[0].user_id
                        ]);

                        if (row_role_change.affectedRows != 1) {
                            return res.status(422).json({
                                message: "The user wasn't successfully modified.",
                            });
                        }      

                        // Change number
                        // Edit the number of viewers in the game
                        const [game_change] = await conn.execute(
                            "UPDATE `games` SET `viewers_nr`=? where `room_id`=?",[
                                (users-players-1),
                                req.body.room_id
                        ]);            

                        if (game_change.affectedRows != 1) {
                            return res.status(422).json({
                                message: "The game wasn't successfully modified.",
                            });
                        }

                        return res.status(201).json({
                            message: "The user has been successfully erased from the room and a viewer became a player.",
                        });

                    }  else {




                    }
                }
            }
        } else{
            // The last user

            // The room closes
            const [row_user_change] = await conn.execute(
                "DELETE FROM `rooms` WHERE `room_id`=?",[
                    req.body.room_id
            ]);            

            if (row_user_change.affectedRows != 1) {
                return res.status(422).json({
                    message: "The room wasn't deleted successfully.",
                });
            }        


            // The game ends
            const [game_delete] = await conn.execute(
                "DELETE FROM `games` WHERE `room_id`=?",[
                    req.body.room_id
                ]);            

            if (game_delete.affectedRows != 1) {
                return res.status(422).json({
                    message: "The game wasn't deleted successfully.",
                });
            }

            // If the last player is a guest account
            if(row_users[0].email=="guest@yahoo.com"){

                const [delete_user] = await conn.execute(
                    "DELETE FROM `users` WHERE `user_id`=?",[
                    req.body.user_id
                ]);  
            
                if (delete_user.affectedRows === 1) {
                    return res.status(201).json({
                        message: "The user has been successfully deleted.",
                    });
                }  

            } else{

                // if normal logged in account
                const [row_role_change] = await conn.execute(
                    "UPDATE `users` SET `role`=?,`room_id`=? WHERE `user_id`=?",[
                        "NONE",
                        -1,
                        req.body.user_id
                    ]);   

                if (row_role_change.affectedRows != 1) {
                    return res.status(422).json({
                        message: "The user wasn't successfully modified.",
                    });
                }        
    
                return res.status(201).json({
                        message: "The user has been successfully removed from the room and the room has been deleted.",
                });

            }

        }
        return res.status(201).json({
            message: "The user has been successfully deleted.",
        });
        
    }catch(err){
        next(err);
    }
}