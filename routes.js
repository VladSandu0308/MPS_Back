const router = require('express').Router();
const {body} = require('express-validator');
const {register} = require('./controllers/registerController');
const {login} = require('./controllers/loginController');
const {createRoom} = require('./controllers/createRoomController')
const {chooseRoom} = require('./controllers/chooseRoomController')
const {exitRoom} = require('./controllers/exitRoomController')
const {enterGuest} = require('./controllers/enterGuestSessionController')
const {getRoomDetails} = require('./controllers/getRoomDetailsController')
const {changeRoom} = require('./controllers/roomSettingsController')
const {changeGame} = require('./controllers/changeGameController')
const {startGame} = require('./controllers/startGameController')
const {endGame} = require('./controllers/endGameController')
const {nextRound} = require('./controllers/nextRoundController')

router.post('/register', [
    body('username',"The name must be of minimum 3 characters length")
    .notEmpty()
    .escape()
    .trim()
    .isLength({ min: 3 }),
    body('email',"Invalid email address")
    .notEmpty()
    .escape()
    .trim().isEmail(),
    body('password',"The Password must be of minimum 4 characters length").notEmpty().trim().isLength({ min: 4 })
], register);

router.post('/login',[
    body('username',"Invalid username")
    .notEmpty()
    .escape()
    .trim().isLength({min: 3}),
    body('password',"The Password must be of minimum 4 characters length").notEmpty().trim().isLength({ min: 4 })
],login);

router.post('/createRoom', [
    body('room_name',"Invalid room_name")
    .notEmpty()
    .escape()
    .trim().isLength({min: 3}),
    body('type',"Invalid type")
    .notEmpty()
    .escape()
    .trim().isLength({min: 3}),
    body('admin_id',"Invalid admin id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1})
], createRoom);

router.post('/chooseRoom', [
    body('type',"Invalid type")
    .notEmpty()
    .escape()
    .trim().isLength({min: 3}),
    body('room_name',"Invalid room name")
    .notEmpty()
    .escape()
    .trim().isLength({min: 3}),    
    body('user_id',"No user id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1})
],chooseRoom);

router.post('/exitRoom',[
    body('room_id',"Enter a room_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1}),
    body('user_id',"Enter a user_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1})
],exitRoom);

router.post('/enterGuest',enterGuest);

router.post('/changeRoom',[
    body('room_id',"Enter a room_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1}),
    body('admin_id',"Enter an admin id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1})
],changeRoom);

router.post('/changeGame',[
    body('room_id',"Enter a room_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1}),
    body('admin_id',"Enter an admin_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1})
],changeGame);

router.post('/endGame',[
    body('room_id',"Enter a room_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1}),
    body('admin_id',"Enter an admin_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1})
],endGame);

router.post('/startGame',[
    body('room_id',"Enter a room_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1}),
    body('admin_id',"Enter an admin_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1})
],startGame);

router.post('/nextRound',[
    body('room_id',"Enter a room_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1}),
    body('admin_id',"Enter an admin_id")
    .notEmpty()
    .escape()
    .trim().isLength({min: 1})
],nextRound);

router.get('/getRoomDetails',getRoomDetails);

module.exports = router;