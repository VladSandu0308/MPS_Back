const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.changeGame = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{

        // Check if already existing game in room - 1 room 1 game
        const [row] = await conn.execute(
            "SELECT * FROM `games` WHERE `room_id`=?",
            [req.body.room_id]
          );

        if (row.length === 0) {
            return res.status(422).json({
                message: "The game doesn't exist",
            });
        }

        // Get admin/user row
        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.admin_id]
          );

        if (row_users.length ==0  ) {
            return res.status(201).json({
                message: "The user doesn't exist",
            });
        }

        if (row_users[0].room_id == -1 ) {
            return res.status(422).json({
                message: "The user isn't in the room",
            });
        }

        // Check if already existing room
        const [room_row] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_id`=?",
            [req.body.room_id]
          );

        if (room_row.length === 0) {
            return res.status(422).json({
                message: "The room doesn't exist",
            });
        }

        // Check if the user is the admin
        if (req.body.admin_id != room_row[0].admin_id) {
            return res.status(422).json({
                message: "The user isn't the room's admin",
            });
        }

        if(req.body.game_name!= null){
          const [game_name_change] = await conn.execute(
              "UPDATE `games` SET `game_name`=? WHERE `room_id`=?",[
                  req.body.game_name,
                  req.body.room_id
            ]);

          if (game_name_change.affectedRows != 1){
            return res.status(422).json({
                message: "The room's name wasn't updated successfully.",
            });
          }
        }

        if(req.body.max_players != null){       

            if(req.body.max_players<= room_row[0].max_users){
                const [game_max] = await conn.execute(
                    "UPDATE `games` SET `max_players`=? WHERE `room_id`=?",[
                    req.body.max_players,
                    req.body.room_id
                ]);
                
                if (game_max.affectedRows != 1){
                    return res.status(422).json({
                        message: "The room's max number wasn't updated successfully.",
                    });
                }
                
            } else {
                // The number wanted for the game is larger than the one for the room which is impossible
                if (req.body.game_name!= null){
                    return res.status(201).json({
                        message: "The game name has been successfully modified but the maximum number is larger than the room's.",
                    });   
                } else{
                    return res.status(422).json({
                        message: "The game maximum number is larger than the room's. Try again! ",
                    });   
                }
            }
        }
            
        if(req.body.max_players==null && req.game_name == null){
            return res.status(422).json({
                message: "The game has no changes to be made.",
            });    
        }

        return res.status(201).json({
            message: "The game has been successfully modified.",
        });
        
    }catch(err){
        next(err);
    }
}