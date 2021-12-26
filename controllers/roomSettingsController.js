const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const conn = require('../dbConnection').promise();

exports.changeRoom = async(req,res,next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }

    try{

        // Check if already existing room
        const [row] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_id`=?",
            [req.body.room_id]
          );

        if (req.body.admin_id != row[0].admin_id) {
            return res.status(201).json({
                message: "The user isn't the room's admin",
            });
        }

        if((req.body.room_name != row[0].room_name)&&
          (req.body.room_name!= null)){
            const [room_name_change] = await conn.execute(
                "UPDATE `rooms` SET `room_name`=? WHERE `room_id`=?",[
                    req.body.room_name,
                    req.body.room_id
            ]);
        }
                
        if((req.body.max_users != row[0].max_users)&&                              
        (req.body.max_users!=null)){
            if(req.body.max_users > row[0].current_users){                
                const [room_num_change] = await conn.execute(
                    "UPDATE `rooms` SET `max_users`=? WHERE `room_id`=?",[
                        req.body.max_users,
                        req.body.room_id
                    ]);
            }
        }
            
        var pass;
        if(req.body.type =="PRIVATE"){
            if(req.body.password == null)
                return res.status(201).json({
                    message: "There must be a password inserted",
                });
            pass=req.body.password;
        }
        if(req.body.type =="PUBLIC")
            pass = "-";


        if ((req.body.type!=null)&&
          (req.body.type!=row[0].type)){

            const [room_pass_change] = await conn.execute(
                "UPDATE `rooms` SET `type`=?,`password`=? WHERE `room_id`=?",[
                    req.body.type,
                    pass,
                    req.body.room_id
            ]);                

        } else{

            // If it is the same type
            if(row[0].type =="PRIVATE"){
                if(req.body.password == null){
                    return res.status(201).json({
                        message: "There must be a password inserted",
                    });
                } else{
                    pass=req.body.password;
                    const [room_pass_change] = await conn.execute(
                        "UPDATE `rooms` SET `password`=? WHERE `room_id`=?",[
                            pass,
                            req.body.room_id
                    ]);                                    
                }
            }
            
        }

        const [row_after] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_id`=?",
            [req.body.room_id]
          );

        return res.status(201).json({
            message: "The room was changed",
        });

    }catch(err){
        next(err);
    }
}