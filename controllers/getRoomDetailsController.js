const jwt = require('jsonwebtoken');
const conn = require('../dbConnection').promise();

exports.getRoomDetails = async (req,res,next) => {

    try{
        const [rows] = await conn.execute('SELECT * FROM `rooms`');

        if (rows.length === 0) {
            return res.status(422).json({
                message: "No rooms"
            });
        }

        var result = []; 
        for (var i=0; i< rows.length;i++){

            const [rows_room] = await conn.execute('SELECT * FROM `rooms` where `room_id`=?'
                ,[rows[i].room_id]);

            const [rows_users] = await conn.execute('SELECT * FROM `users` where `room_id`=? and `role`=?'
                ,[rows[i].room_id,
                "Viewer"]);

            const [rows_players] = await conn.execute('SELECT * FROM `users` where `room_id`=? and `role`=?'
                ,[rows[i].room_id,
                "Player"]);

            var user_array=[]
            for (var j = 0;j<rows_players.length ; j++){
                user_array.push({
                    user_name:rows_players[j].username,
                    user_score:rows_players[j].score
                })
            }
            
            const [admin] = await conn.execute('SELECT * FROM `users` where `user_id`=?'
                ,[rows_room[0].admin_id]);
                
            const [viewerspts] = await conn.execute('SELECT SUM(score) as viewer_points FROM `users` where `room_id`=? and `role`=?'
                ,[rows[i].room_id,
                "Viewer"]);

            const [game] = await conn.execute('SELECT * FROM `games` where `room_id`=?'
                ,[rows[i].room_id]);

            if(game.length > 0){
                result.push({
                    room_name:rows_room[0].room_name,
                    type:rows_room[0].type,
                    admin_name:admin.username,
                    user_number:rows_room[0].current_users,
                    user_list:user_array,
                    game_name:game[0].game_name,
                    game_status:game[0].game_status,
                    viewers_nr:rows_users.length,
                    viewers_pts:viewerspts[0].viewer_points
                });
            } else{
                result.push({
                    room_name:rows_room[0].room_name,
                    type:rows_room[0].type,
                    admin_name:admin.username,
                    user_number:rows_room[0].current_users,
                    user_list:user_array,
                    game_name:"No game in progress",
                    game_status:"-",
                    viewers_nr:rows_users.length,
                    viewers_pts:viewerspts[0].viewer_points
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