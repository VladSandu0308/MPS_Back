const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.endGame = async(req,res,next) => {

    try{

        var viewer = 0;
        // Check for the game
        const [row] = await conn.execute(
            "SELECT * FROM `games` WHERE `room_id`=?",
            [req.body.room_id]
          );

        if (row.length === 0) {
            return res.status(422).json({
                message: "The game doesn't exist",
            });
        }

        // Check the game's status 
        if(row[0].game_status !="In progress"){
            return res.status(422).json({
                message: "The game hasn't started",
            });
        }

        // Get admin/user row
        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.admin_id]
          );

        if(row_users.length==0){
            return res.status(422).json({
                message: "The user doesn't exist",
            });
        }

        if (row_users[0].room_id == -1 ) {
            return res.status(422).json({
                message: "The user isn't in the room",
            });
        }

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

        if(row_room[0].admin_id !=req.body.admin_id){
            return res.status(422).json({
                message: "The user isn't the admin of the room",
            });      
        }

        // Get all users
        const [row_all_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `room_id`=?",
            [req.body.room_id]
          );
       
        if(row_all_users.length == 0){
            return res.status(422).json({
                message: "The game doesn't have any players.",
            });            
        }

        // Iterating through users, updates their scores
        for (var i = 0; i< row_all_users.length; i++){        
            if (row_all_users[i].user_id == req.body.user_id) {
                if (row_all_users[i].role === "Viewer") {
                    viewer = 1;
                }
                const [user_score_change] = await conn.execute(
                    "UPDATE `users` SET `total_score`=?,`score`=? WHERE `user_id`=?",[
                        row_all_users[i].total_score + 1,
                        row_all_users[i].score + 1,
                        row_all_users[i].user_id
                    ]);

                    if (user_score_change.affectedRows != 1) {
                        return res.status(422).json({
                            message: "The score wasn't successfully modified.",
                        });
                    }
            }       
        }
      
        // Update the game status
        if (!viewer) {
            const [game_name_change] = await conn.execute(
                "UPDATE `games` SET `game_status`=?,`rounds`=?,`viewers_pts`=? WHERE `room_id`=?",[
                    "In lobby",
                    0,
                    0,
                    req.body.room_id
              ]);
            
            if (game_name_change.affectedRows != 1) {
                return res.status(422).json({
                    message: "The game wasn't successfully ended.",
                });
            }
        }
             

        return res.status(201).json({
            message: "The game has ended and the scores were updated.",
        });
        
        
    }catch(err){
        next(err);
    }
}