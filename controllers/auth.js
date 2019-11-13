let User = require('../models/user');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');
const nodemailer=require('nodemailer');
const sendgridtransport=require('nodemailer-sendgrid-transport');
const {check,validationResult}=require('express-validator/check');
const transporter=nodemailer.createTransport(sendgridtransport({
  auth:{
    api_key:'dummyapikey'
  }
}));
exports.getLogin = (req, res, next) => {
  let error= req.flash('error');
  if(error.length>0)
  {
error=error[0];
  }
  else{
    error=null;
  }

  res.render('auth/login', {
  
    path: '/login',
    pageTitle: 'Login',
    error:error,
    oldInput:{email:'',password:''},
    validationCss:[]

  });
};

exports.getSignup = (req, res, next) => {
  let error=req.flash('error');
  if(error.length>0){
    error=error[0];
  }
  else{
    error=null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    error:error,
    oldInput:{email:'',password:'',confirmPassword:''},
    validationCss:[]
  });
};

exports.postLogin = (req, res, next) => {
  email=req.body.email;
  password=req.body.password;
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
   return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'login',
      error:errors.array()[0].msg,
      oldInput:{email:email,password:password},
      validationCss:errors.array()
    });
  }
     User.findOne({email:email})
     .then(user=>{
      bcrypt.compare(password,user.password)
      .then(toMatch=>{
        if(toMatch){
         req.session.isLoggedIn = true;
         req.session.user = user;
         req.session.save(err => {
           res.redirect('/');
         })
       }
       else{
         req.flash('error','bad credentials Password');
         res.redirect('/login');
       }
     })
     .catch(err => {
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
    
     })
     .catch(err => {
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
  
  };
  
  


exports.postSignup = (req, res, next) => {
  email=req.body.email;
  password=req.body.password;
  confirmPassword=req.body.confirmPassword;
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
   return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      error:errors.array()[0].msg,
      oldInput:{email:email,password:password,confirmPassword:confirmPassword},
      validationCss:errors.array()
    });
  }
  
  
    bcrypt.hash(password,12)
    .then(hashedPassword=>{
      user=new User({
        email:email,
        password:hashedPassword,
        cart:{items:[]}
  
      })
      return user.save();
    })
    .then(value=>{
      res.redirect('/login');
     return transporter.sendMail({
        to:email,
        from:'shop@node-complete.com',
        subject:'Signup Successful',
        html:'<h1>You Succesfully Signed up!</h1>'
      })
      .catch(err=>{
        console.log(err);
      })
    
    })
    .catch(err => {
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};


exports.getReset=(req,res,next)=>{
  let error= req.flash('error');
  if(error.length>0)
  {
error=error[0];
  }
  else{
    error=null;
  }

  res.render('auth/reset', {
  
    path: '/reset',
    pageTitle: 'reset',
    error:error

  });
}

exports.postReset=(req,res,next)=>{
crypto.randomBytes(32,(err,buffer)=>{
  if(err)
  {
   return res.redirect('/reset');
  }
  const token=buffer.toString('hex');
  User.findOne({email:req.body.email})
  .then(user=>{
    if(!user)
    {
      req.flash('error','No User Found');
     return res.redirect('/reset');
    }
 
  user.resetToken=token;
  user.resetTokenExpiration=Date.now() + 7200000;
 return user.save();
  
  })
  .then(result=>{
   return transporter.sendMail({
      to:req.body.email,
      from:'shop@node-complete.com',
      subject:'Reset Password',
      html:`this is the <a href="http://localhost:3000/reset/${token}">link</a> to reset the password `
    })
    .then(value=>{
      req.flash('error','reset link sent')
      res.redirect('/reset');
    })
    .catch(err => {
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
  })
  .catch(err => {
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  });
});
}


exports.getResetPassword=(req,res,next)=>{
  const token=req.params.token;
  // console.log(token);
  User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})
  .then(user=>{
    // console.log(user);
    let error= req.flash('error');
    if(error.length>0)
    {
  error=error[0];
    }
    else{
      error=null;
    }
  
    res.render('auth/reset-password', {
    
      path: '/reset-password',
      pageTitle: 'resetPassword',
      error:error,
      userId:user._id.toString(),
      passwordToken:token
  
    });
  })
  .catch(err => {
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  });
}


exports.postResetPassword=(req,res,next)=>{
 const newPassword=req.body.password;
 const userId=req.body.userId;
 const passwordToken=req.body.passwordToken;
 let resetUser;
  User.findOne({resetToken:passwordToken,resetTokenExpiration:{$gt:Date.now()},_id:userId})
 .then(user=>{
   console.log(user);
   resetUser=user;
return bcrypt.hash(newPassword,12)
 })
 .then(hashedPassword=>{
   resetUser.password=hashedPassword;
   resetUser.resetToken=undefined;
   resetUser.resetTokenExpiration=undefined;
   return resetUser.save();
 })
 .then(result=>{
   req.flash('error','password update success');
   res.redirect('/login');
 })
 .catch(err => {
  const error=new Error(err);
  error.httpStatusCode=500;
  return next(error);
});
}
