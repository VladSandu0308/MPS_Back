const router = require('express').Router();
const {body} = require('express-validator');
const {register} = require('./controllers/registerController');
const {login} = require('./controllers/loginController');
const {createRoom} = require('./controllers/createRoomController')
const {chooseRoom} = require('./controllers/chooseRoomController')
const {exitRoom} = require('./controllers/exitRoomController')
const {enterGuest} = require('./controllers/enterGuestSessionController')
const {exitGuest} = require('./controllers/exitGuestSessionController')
const {getRoomDetails} = require('./controllers/getRoomDetailsController')
const {changeRoom} = require('./controllers/roomSettingsController')

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
    .trim().isLength({min: 3})
], createRoom);

router.post('/chooseRoom',chooseRoom);

router.post('/exitRoom',exitRoom);

router.post('/enterGuest',enterGuest);

router.post('/exitGuest',exitGuest);

router.post('/changeRoom',changeRoom);

router.get('/getRoomDetails',getRoomDetails);

module.exports = router;