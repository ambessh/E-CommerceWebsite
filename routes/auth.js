const express = require('express');

const authController = require('../controllers/auth');
const {check,body}=require('express-validator/check');
const router = express.Router();
const User=require('../models/user');
router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',[check('email').isEmail().withMessage('Email validation failed').normalizeEmail()
.custom((value,{req})=>{
   return User.findOne({email:value})
    .then(user => {
      if(user)
      {
      return Promise.resolve(user);
      }
      {
          return Promise.reject('user dismatched!');
      }
})
}),

body('password','Password Validation failed !').isLength({min:5,max:15}).isAlphanumeric().trim()
]
, authController.postLogin);

router.post('/signup',
 [check('email')
 .isEmail()
 .withMessage('Email Validation failed !')
 .normalizeEmail()
 .custom((value,{req})=>{
    return User.findOne({email:value})
    .then(user=>{
      if(user)
      {
        return Promise.reject('User already exists !');
      }
 })
}),

 body('password','Password Validation failed !').isLength({min:5,max:15}).isAlphanumeric().trim(),
 body('confirmPassword') .trim().custom((value,{req})=>{
     if(value!==req.body.password)
     {
         throw new Error('passwords have to match !');
     }
     return true;
 })

]
 ,authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset',authController.getReset);

router.post('/reset',authController.postReset);

router.post('/reset-password',authController.postResetPassword);

router.get('/reset/:token',authController.getResetPassword);
module.exports = router;