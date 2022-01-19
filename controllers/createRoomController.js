const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.createRoom = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{

        // Check if there is another room already with this name
        const [room] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_name`=?",
            [req.body.room_name]
          );

        if (room.length > 0) {
            return res.status(422).json({
                message: "The room name already exists",
            });
        }


        // Get admin/user row
        const [user] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.admin_id]
          );

        if (user.length ==0) {
            return res.status(422).json({
                message: "The user isn't in the database",
            });
        }

        if (user[0].room_id != -1 ) {
            return res.status(422).json({
                message: "The user is already in a room",
            });
        }


        // If the room is private, there must be a password, if the
        // room is PUBLIC then set default password "-"
        var pass;
        if(req.body.type =="PRIVATE"){
            if(req.body.password == null){
                return res.status(422).json({
                    message: "The user must enter a password",
                });    
            }else{
                pass = req.body.password;
            }
        }
        if(req.body.type =="PUBLIC")
            pass = "-";


        // If there isn't a max number of users set, the default is one
        var numberofusers = 0;
        if(req.body.max_users == null)
            numberofusers = 5;
        else 
            numberofusers = req.body.max_users;


        // Insert room into database
        const [rows] = await conn.execute('INSERT INTO `rooms`(`room_name`,`type`,`password`,`admin_id`,`current_users`,`max_users`) VALUES(?,?,?,?,?,?)',[
            req.body.room_name,
            req.body.type,
            pass,
            req.body.admin_id,
            1,
            numberofusers
        ]);
            
        if (rows.affectedRows ==0){
            return res.status(422).json({
                message: "The room wasn't created.",
            });
        }
        

        // Get current room details
        const [row_curr] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_name`=?",
            [req.body.room_name]
          );

        if (row_curr.length == 0) {
            return res.status(422).json({
                message: "The room isn't in the database",
            });
        }


        // Change room_id in user's table
        const [row_user_change] = await conn.execute(
            "UPDATE `users` SET `room_id`=? WHERE `user_id`=?",[
                row_curr[0].room_id,
                req.body.admin_id
            ]);

        if (row_user_change.affectedRows ==0){
            return res.status(422).json({
                message: "The user's room_id field wasn't modified.",
            });
        }

        // Change role of the user
        const [row_role_change] = await conn.execute(
            "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                "Player",
                req.body.admin_id
            ]);           

        if (row_role_change.affectedRows ==0){
            return res.status(422).json({
                message: "The user's role wasn't modified.",
            });
        }


        // Check if already existing game in room - 1 room 1 game
        const [row_game] = await conn.execute(
            "SELECT * FROM `games` WHERE `room_id`=?",
            [row_curr[0].room_id]
        );

        if (row_game.length > 0) {
            return res.status(422).json({
                message: "The game already exists",
            });
        }


        // Hardcoded cause we only have one game
        var joc = "Game"

        // Insert game into table
        const [rows_game] = await conn.execute('INSERT INTO `games`(`game_name`,`game_status`,`viewers_nr`,`viewers_pts`,`room_id`,`max_players`,`players_nr`,`rounds`) VALUES(?,?,?,?,?,?,?,?)',[
            joc,
            "In lobby",
            0,
            0,
            row_curr[0].room_id,
            numberofusers,
            1,
            0
        ]);

        // Check if the game was created
        if (rows_game.affectedRows === 1) {
            return res.status(201).json({
                message: "The room has been successfully created.",
            });
        } else{
            return res.status(422).json({
                message: "The game wasn't created",
            });
        }
        
    }catch(err){
        next(err);
    }
}