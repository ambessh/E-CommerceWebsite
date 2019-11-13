const Product = require('../models/product');
const mongoose=require('mongoose');
const {validationResult}=require('express-validator/check');
const fileHelper=require('../util/file');


exports.getAddProduct = (req, res, next) => {
 
  let error= req.flash('error');
  if(error.length>0)
  {
error=error[0];
  }
  else{
    error=null;
  }


  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    error:error,
    oldInput:true,
    validateCss:[],
    product:{title:'',imageUrl:'',price:'',description:''}
  });
};

exports.postAddProduct = (req, res, next) => {
console.log('this is bitch');
   
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  console.log(image);
  if(!image)
  {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      error:'file type is not acceptable!',
      validateCss:errors.array(),
      oldInput:true,
      product:{title:title,imageUrl:imageUrl, price:price,description:description}
  
    });
  }
  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
    console.log(errors.array());
  return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      error:errors.array()[0].msg,
      validateCss:errors.array(),
      oldInput:true,
      product:{title:title,imageUrl:imageUrl,price:price,description:description}
    });
  }
 

const imageUrl=image.path;
 
  const product = new Product({
    
    // _id:new mongoose.Types.ObjectId('5d8649127ccb930479a51ae3'),          //to throw Error
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        error:null,
        validateCss:[]
      });
    })
    .catch(err => {
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.file;
  const updatedDesc = req.body.description;
 console.log(updatedImageUrl);
if(!updatedImageUrl)
{
  return res.status(422).render('admin/edit-product', {
    pageTitle: 'edit Product',
    editing:true,
    path: '/admin/edit-product',
    error:'Editing with invalid Image',
    validateCss:errors.array(),
    product:{title:updatedTitle,imageUrl:updatedImageUrl,price:updatedPrice,description:updatedDesc}

  });
}
  const errors=validationResult(req);
  if(!errors.isEmpty())
  {
    console.log(errors.array());
  return res.status(422).render('admin/edit-product', {
      pageTitle: 'edit Product',
      editing:true,
      path: '/admin/edit-product',
      error:errors.array()[0].msg,
      validateCss:errors.array(),
      product:{title:updatedTitle,imageUrl:updatedImageUrl,price:updatedPrice,description:updatedDesc}

    });
  }
  
  const updatedImageUrlDatabase=updatedImageUrl.path;

  Product.findById(prodId)
    .then(product => {
      if(product.userId.toString()!==req.user._id.toString())
      {
        req.flash('error','wrong user');
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(updatedImageUrl)
      {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = updatedImageUrlDatabase;
      }
     
      return product.save()
      .then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
    }).catch(err=>{console.log(err)});
    })
    .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
  Product.find({userId:req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
   
 
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error=new Error(err);
      error.httpStatusCode=500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
   Product.findById(prodId)
   .then(product=>{
     if(!product)
     {
       return new Error('product not found');
     }
    fileHelper.deleteFile(product.imageUrl);
    return   Product.deleteOne({_id:prodId,userId:req.user._id})
   })
   .then(() => {
    console.log('DESTROYED PRODUCT');
    res.redirect('/admin/products');
  })
  .catch(err => {
    const error=new Error(err);
    error.httpStatusCode=500;
    return next(error);
  });
  
};
