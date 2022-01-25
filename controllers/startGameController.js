const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.startGame = async(req,res,next) => {

    try{

        // Search for the game of the room
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

        // Check if the user is in a room
        if (row_users[0].room_id == -1 ) {
            return res.status(422).json({
                message: "The user isn't in the room",
            });
        }

        // Get room details
        const [row_room] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_id`=?",
            [req.body.room_id]
        );
    
        // There isn't a room by that id
        if (row_room.length === 0) {
            return res.status(422).json({
                message: "There is not any room by this id",
            });
        }   

        // Checks if the user is the admin of the room
        if(row_room[0].admin_id !=req.body.admin_id){
            return res.status(422).json({
                message: "The user isn't the admin of the room",
            });
        }
      
        // Updates the game status
        const [game_name_change] = await conn.execute(
            "UPDATE `games` SET `game_status`=? WHERE `room_id`=?",[
                "In progress",
                req.body.room_id
          ]);
        
        // Resets scores to 0 to users
        const [user_score_change] = await conn.execute(
            "UPDATE `users` SET `score`=? WHERE `room_id`=?",[
                0,
                req.body.room_id
            ]);

        // Set viewers' score in game to 0  
        const [user_game_change] = await conn.execute(
            "UPDATE `games` SET `viewers_pts`=? WHERE `room_id`=?",[
                0,
                req.body.room_id
            ]);

        var randomNumber = Math.floor(Math.random() * 101);

        const [get_random] = await conn.execute(
            "UPDATE `games` SET `number`=? WHERE `room_id`=?",[
                randomNumber,
                req.body.room_id
            ]);

        // Check if the fields were updated
        if ((game_name_change.affectedRows >= 1)&&
            (user_score_change.affectedRows >= 1)&&
            (user_game_change.affectedRows >= 1)){
                return res.status(201).json({
                    message: "The game has started.",
                });
        }
        
        
    }catch(err){
        next(err);
    }
}

/** 
 * playGameController ->
 *  - genereaza un numar la intamplare si il trimite la toti jucatorii care au roomId = this.roomId (cand primeste numaru
 * se da start la un timer)
 *  - logica de joc se face in front
 *  - cand termina un jucator de citit trimite timpu care i-a luat
 *  - busy waiting pana a primit toti timpii de la jucatori
 *  - dupa ce i a primit face clasamentul si updateaza scorurile
*/