const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const csrf=require('csurf');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrfProtection=csrf();
const flash=require('connect-flash');
const errorController = require('./controllers/error');
const User = require('./models/user');
const multer=require('multer');

const MONGODB_URI =
  'mongodb://localhost/ecommerce';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const storage=multer.diskStorage({
  destination:(req,file,cb)=>{
cb(null,'images');
  },
  filename:(req,file,cb)=>{
   
      cb(null,'myImage'+'-'+file.originalname);
    
 
  }
})
const fileFilter=(req,file,cb)=>{
  if(file.mimetype==='image/png' || file.mimetype==='image/jpeg' || file.mimetype==='image/jpg')
  {
    cb(null,true);
  }
  else{
    cb(null,false);
  }
}



app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:storage,fileFilter:fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());
app.use((req,res,next)=>{
  res.locals.isAuthenticated=req.session.isLoggedIn;
  res.locals.csrfToken=req.csrfToken();
  next();
})

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
 User.findById(req.session.user._id)
    .then(user => {
      // throw new Error('dummy');
      if(!user)
      {
        return next();
      }
      req.user = user;
   
      next();
    })
    .catch(err=>{
      return next(new Error(err));
    });
});



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use('/500',errorController.get505);
app.use(errorController.get404);
app.use((error,req,res,next)=>{
// res.redirect('/500');
res.status(500).render('500', {
  pageTitle: 'error ',
  path: '/500',
  isAuthenticated:req.session.isLoggedIn
});
});

mongoose
  .connect(MONGODB_URI,{useCreateIndex:false,useNewUrlParser:true,useUnifiedTopology:true})
  .then(result => {
    console.log('started...');
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
