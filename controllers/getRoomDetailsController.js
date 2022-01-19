const jwt = require('jsonwebtoken');
const conn = require('../dbConnection').promise();

exports.getRoomDetails = async (req,res,next) => {

    try{

        // Get rooms 
        const [rows] = await conn.execute('SELECT * FROM `rooms`');

        if (rows.length === 0) {
            return res.status(422).json({
                message: "No rooms"
            });
        }

        // Appends each room's details to the array
        var result = []; 

        // Iterating through the rooms
        for (var i=0; i< rows.length;i++){

            // Get the room's name
            const [rows_room] = await conn.execute('SELECT * FROM `rooms` where `room_id`=?'
                ,[rows[i].room_id]);

            if (rows_room.length === 0) {
                return res.status(422).json({
                    message: "No room by that id"
                });
            }

            // Get the room's players
            const [rows_players] = await conn.execute('SELECT * FROM `users` where `room_id`=? and `role`=?',[
                rows[i].room_id,
                "Player"
            ]);

            if (rows_players.length === 0) {
                return res.status(422).json({
                    message: "There are no players in the room"
                });
            }

            // Get the room's viewers
            const [rows_users] = await conn.execute('SELECT * FROM `users` where `room_id`=? and `role`=?',[
                rows[i].room_id,
                "Viewer"
            ]);

            // Iterates through the players and gets their username and score
            var user_array=[]
            for (var j = 0;j<rows_players.length ; j++){
                user_array.push({
                    user_name:rows_players[j].username,
                    user_score:rows_players[j].score
                })
            }
            
            // Get the admin's details
            const [admin] = await conn.execute('SELECT * FROM `users` where `user_id`=?',[
                rows_room[0].admin_id
            ]);
                
            if (admin.length === 0) {
                return res.status(422).json({
                    message: "No admin"
                });
            }

            // Calculate viewers' points
            const [viewerspts] = await conn.execute('SELECT SUM(score) as viewer_points FROM `users` where `room_id`=? and `role`=?',[
                rows[i].room_id,
                "Viewer"
            ]);

            // Get the game's row
            const [game] = await conn.execute('SELECT * FROM `games` where `room_id`=?',[
                rows[i].room_id
            ]);
            if(game.length > 0){
                // Insert the room's details  
                result.push({
                    room_name:rows_room[0].room_name,
                    type:rows_room[0].type,
                    admin_name:admin.username,
                    user_number:rows_room[0].current_users,
                    user_list:user_array,
                    game_name:game[0].game_name,
                    game_status:game[0].game_status,
                    viewers_nr:rows_users.length,
                    viewers_pts:viewerspts[0].viewer_points,
                    room_id: rows_room[0].room_id,
                    max_players:game[0].max_players 
                });
            } else{
                // Case for more games and if the game isn't made at the same time
                // with the room
                result.push({
                    room_name:rows_room[0].room_name,
                    type:rows_room[0].type,
                    admin_name:admin.username,
                    user_number:rows_room[0].current_users,
                    user_list:user_array,
                    game_name:"No game in progress",
                    game_status:"-",
                    viewers_nr:rows_users.length,
                    viewers_pts:viewerspts[0].viewer_points,
                    max_players:game[0].max_players 
                });                
            }
        }

        res.contentType('application/json');
        return res.send(JSON.stringify(result));  
    }
    catch(err){
        next(err);
    }
}