const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.createRoom = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{

        // Check if already existing room
        const [row] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_name`=?",
            [req.body.room_name]
          );

        if (row.length > 0) {
            return res.status(201).json({
                message: "The room name already exists",
            });
        }

        // Get admin/user row
        const [row_users] = await conn.execute(
            "SELECT * FROM `users` WHERE `user_id`=?",
            [req.body.admin_id]
          );

        if (row_users.length ==0  ) {
            return res.status(201).json({
                message: "The user isn't in the database",
            });
        }

        if (row_users[0].room_id != -1 ) {
            return res.status(201).json({
                message: "The user is already in a room",
            });
        }

        var pass;
        if(req.body.type =="PRIVATE")
            pass = req.body.password;
        if(req.body.type =="PUBLIC")
            pass = "-";

        // Insert room into table
        const [rows] = await conn.execute('INSERT INTO `rooms`(`room_name`,`type`,`password`,`admin_id`,`current_users`,`max_users`) VALUES(?,?,?,?,?,?)',[
            req.body.room_name,
            req.body.type,
            pass,
            req.body.admin_id,
            1,
            req.body.max_users
        ]);
            
        // Get current room row
        const [row_curr] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_name`=?",
            [req.body.room_name]
          );

        // Change room_id in users table
        const [row_user_change] = await conn.execute(
            "UPDATE `users` SET `room_id`=? WHERE `user_id`=?",[
                row_curr[0].room_id,
                req.body.admin_id
            ]);

        const [row_role_change] = await conn.execute(
            "UPDATE `users` SET `role`=? WHERE `user_id`=?",[
                "Player",
                req.body.admin_id
            ]);           

        // Check if already existing game in room - 1 room 1 game
        const [row_game] = await conn.execute(
            "SELECT * FROM `games` WHERE `room_id`=?",
            [row_curr[0].room_id]
        );

        if (row_game.length > 0) {
            return res.status(201).json({
                message: "The game already exists",
            });
        }

        // Hardcoded cause we only have one game
        var joc = "Game"

        // Insert game into table
        const [rows_game] = await conn.execute('INSERT INTO `games`(`game_name`,`game_status`,`viewers_nr`,`viewers_pts`,`room_id`,`max_players`,`players_nr`,`rounds`) VALUES(?,?,?,?,?,?,?,?)',[
            joc,
            "Created",
            0,
            0,
            row_curr[0].room_id,
            req.body.max_users,
            1,
            1
        ]);

        if ((row_user_change.affectedRows === 1)&&
            (rows_game.affectedRows === 1)) {
            return res.status(201).json({
                message: "The room has been successfully created.",
            });
        }
        
    }catch(err){
        next(err);
    }
}