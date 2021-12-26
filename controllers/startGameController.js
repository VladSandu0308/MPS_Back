const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.startGame = async(req,res,next) => {

    try{

        const [row] = await conn.execute(
            "SELECT * FROM `games` WHERE `room_id`=?",
            [req.body.room_id]
          );

        if (row.length === 0) {
            return res.status(201).json({
                message: "The game doesn't exist",
            });
        }

        // Get admin/user row
        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.admin_id]
          );

        if (row_users[0].room_id == -1 ) {
            return res.status(201).json({
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
            return res.status(201).json({
                message: "The user isn't the admin of the room",
            });      
        }
      
        const [game_name_change] = await conn.execute(
            "UPDATE `games` SET `game_status`=? WHERE `room_id`=?",[
                "In progress",
                req.body.room_id
          ]);
        
        // set scores to 0 to users
        const [user_score_change] = await conn.execute(
            "UPDATE `users` SET `score`=? WHERE `room_id`=?",[
                0,
                req.body.room_id
            ]);

        // set viewers score in game to 0  
        const [user_game_change] = await conn.execute(
            "UPDATE `games` SET `viewers_pts`=? WHERE `room_id`=?",[
                0,
                req.body.room_id
            ]);

        return res.status(201).json({
            message: "The game has started.",
        });
        
        
    }catch(err){
        next(err);
    }
}