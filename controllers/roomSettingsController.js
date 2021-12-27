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

        if(row.length==0){
            return res.status(422).json({
                message: "There isn't a room by that id",
            });
        }

        // Checking the room's admin id and the user's id
        if (req.body.admin_id != row[0].admin_id) {
            return res.status(422).json({
                message: "The user isn't the room's admin",
            });
        }

        // If there is a new name wanted for change it is updated
        if((req.body.room_name != row[0].room_name)&&
        (req.body.room_name!= null)){
            const [room_name_change] = await conn.execute(
                "UPDATE `rooms` SET `room_name`=? WHERE `room_id`=?",[
                    req.body.room_name,
                    req.body.room_id
            ]);
            if (room_name_change.affectedRows == 0){
                return res.status(422).json({
                    message: "The room's name wasn't updated successfully.",
                });
            }
        }

        // If the number of max players is wanted for change it is updated        
        if((req.body.max_users != row[0].max_users)&&                              
        (req.body.max_users!=null)){
            // if the number of users is bigger than the number of current users
            // it is modified
            if(req.body.max_users > row[0].current_users){                
                const [room_num_change] = await conn.execute(
                    "UPDATE `rooms` SET `max_users`=? WHERE `room_id`=?",[
                        req.body.max_users,
                        req.body.room_id
                    ]);

                if (room_num_change.affectedRows == 0){
                    return res.status(422).json({
                        message: "The room's max users wasn't updated successfully.",
                    });
                }
                            
            }
        }
            
        var pass;

        // Check password if the previous or now given type is private
        if((req.body.type =="PRIVATE")||
            ((req.body.type==null)&&(row[0].type=="PRIVATE"))){
             if(req.body.password == null)
                return res.status(422).json({
                    message: "There must be a password inserted",
                });
             pass=req.body.password;
        }
        if(req.body.type =="PUBLIC")
            pass = "-";

        // Checking if the type is changed then modify it
        if ((req.body.type!=null)&&
          (req.body.type!=row[0].type)){

            const [room_pass_change] = await conn.execute(
                "UPDATE `rooms` SET `type`=?,`password`=? WHERE `room_id`=?",[
                    req.body.type,
                    pass,
                    req.body.room_id
            ]);                

            if (room_pass_change.affectedRows == 0){
                return res.status(422).json({
                    message: "The room's type wasn't updated successfully.",
                });
            }

        } else{
            // If it is the same type or there isn't a type inserted

            if(row[0].type =="PRIVATE"){
                pass=req.body.password;

                if(pass != row[0].password){
                
                    const [room_pass_change] = await conn.execute(
                        "UPDATE `rooms` SET `password`=? WHERE `room_id`=?",[
                        pass,
                        req.body.room_id
                    ]);
                        
                    if (room_pass_change.affectedRows == 0){
                        return res.status(422).json({
                        message: "The room's type wasn't updated successfully.",
                        });
                    }                           
                
                } 
            }
            
        }

        const [row_after] = await conn.execute(
            "SELECT * FROM `rooms` WHERE `room_id`=?",
            [req.body.room_id]
        );

        if(row_after.length==0){
            return res.status(422).json({
                message: "The room doesn't exist",
            });            
        }

        return res.status(201).json({
            message: "The room was changed",
        });

    }catch(err){
        next(err);
    }
}