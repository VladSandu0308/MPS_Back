const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.createGame = async(req,res,next) => {
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

        if (row.length > 0) {
            return res.status(201).json({
                message: "The game already exists",
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

        if (row_users[0].room_id == -1 ) {
            return res.status(201).json({
                message: "The user isn't in a room",
            });
        }

        if (row_users[0].room_id == -1 ) {
            return res.status(201).json({
                message: "The user isn't in a room",
            });
        }

        if (row_users[0].room_id != req.body.room_id ) {
            return res.status(201).json({
                message: "The user isn't in this room",
            });
        }

        const [row_room] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_id`=?",
            [req.body.room_id]
          );

        if (row_room[0].admin_id != req.body.admin_id) {
            return res.status(201).json({
                message: "The user isn't the admin of the room",
            });
        }

        maxplayers= req.body.max_players;
        if(req.body.max_players == null){
            maxplayers = 1;
        }

        // Hardcoded cause we only have one game
        var joc = "Game1"

        // Insert game into table
        const [rows_game] = await conn.execute('INSERT INTO `games`(`game_name`,`game_status`,`viewers_nr`,`viewers_pts`,`room_id`,`max_players`,`players_nr`) VALUES(?,?,?,?,?,?,?)',[
            joc,
            "Created",
            0,
            0,
            req.body.room_id,
            maxplayers,
            1
        ]);
            
        if (rows_game.affectedRows === 1) {
            return res.status(201).json({
                message: "The game has been successfully created.",
            });
        }
        
    }catch(err){
        next(err);
    }
}