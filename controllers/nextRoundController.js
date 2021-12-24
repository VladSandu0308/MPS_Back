const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.nextRound = async(req,res,next) => {

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
            [req.body.user_id]
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

        if(row_room[0].admin_id !=req.body.user_id){
            return res.status(201).json({
                message: "The user isn't the admin of the room",
            });      
        }
   
        const [row_get_game] = await conn.execute(
            "SELECT * FROM `games` WHERE `room_id`=?",
            req.body.room_id
          );

        var roundz = row_get_game[0].rounds +1;

        const [game_name_change] = await conn.execute(
            "UPDATE `games` SET `game_status`=?,`rounds`=? WHERE `room_id`=?",[
                "In progress",
                roundz,
                req.body.room_id
          ]);
        

        // Get all users
           const [row_all_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `room_id`=?",
            [req.body.room_id]
          );
       
        
        var viewers_points = row_get_game[0].viewers_pts;

        for (var i = 0; i< row_all_users.length; i++){

            if(row_all_users[i].room_id ==req.body.room_id ){

                const [row_get_score] = await conn.execute(
                    "SELECT * FROM `users` WHERE `user_id`=?",
                    row_all_users[i].user_id
                );
               
                if((row_get_score[0].score>=0)&&
                    (row_get_score[0].total_score>=0)){

                    if(row_get_score[0].role=="Viewer"){
                        viewers_points += row_get_score[0].score;
                    }  

                    var scor_after = row_get_score[0].total_score +row_get_score[0].score ;

                    const [user_score_change] = await conn.execute(
                        "UPDATE `users` SET `total_score`=?,`score`=? WHERE `user_id`=?",[
                            scor_after,
                            0,
                            row_all_users[i].user_id
                        ]);


                }        
            }

        }

        const [user_game_final] = await conn.execute(
            "UPDATE `games` SET `viewers_pts`=? WHERE `room_id`=?",[
                viewers_points,
                req.body.room_id
            ]);

        return res.status(201).json({
            message: "The next round started.",
        });
        
        
    }catch(err){
        next(err);
    }
}