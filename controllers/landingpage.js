const {
  promisify
} = require('util');

var {
  isEmpty
} = require('../config/customFunctions');
const crypto = require('crypto');
const Campaign = require('../models/campaign');
const PhotoEntries = require('../models/PhotoCollection');
const randomBytesAsync = promisify(crypto.randomBytes);
// const VoterEntries = require('../models/voter');
// const User = require('../models/User');
const nodemailer = require('nodemailer');
const _ = require('lodash');
const validator = require('validator');
const mailChecker = require('mailchecker');
const passport = require('passport');

const axios = require('axios');

exports.postEntriesCollection = async (req, res) => {
  const validationErrors = [];

  if (!req.user) {
    if (validator.isEmpty(req.body.name)) validationErrors.push({
      msg: 'Please enter your name'
    });
    if (!validator.isEmail(req.body.email)) validationErrors.push({
      msg: 'Please enter a valid email address.'
    });
    if (!validator.isEmail(req.body.email)) validationErrors.push({
      msg: 'Please enter a valid email address.'
    });
  }
  if (validator.isEmpty(req.body.description)) validationErrors.push({
    msg: 'Please enter your message.'
  });


  function getValidateReCAPTCHA(token) {
    return axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`, {}, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
    });
  }

  try {
    const validateReCAPTCHA = await getValidateReCAPTCHA(req.body['g-recaptcha-response']);
    if (!validateReCAPTCHA.data.success) {
      validationErrors.push({
        msg: 'reCAPTCHA validation failed.'
      });
    }

    if (validationErrors.length) {
      req.flash('errors', validationErrors);
      return res.redirect('/contact');
    }


    Campaign.findOne({
      slug: req.params.slug
    }, function (err, campaign) {

      let filename = '';





      if (isEmpty(req.files.file)) {

        validationErrors.push({
          msg: 'Please upload file.'
        });
        req.flash('errors', validationErrors);
        // res.status(200).json({
        //   'status': 200,
        //   'msg': 'Error'
        // })
        return res.redirect('/contact');
      } else {


        let file = req.files.file;
        filename = file.name;
        let uploadDir = './public/PhotoContestUploads/uploads/';
        console.log(filename);
        file.mv(uploadDir + filename, (err) => {
          if (err)
            throw err;
        });
      }

      const photo = new PhotoEntries({

        Email: req.body.email,
        Name: req.body.name,
        Description: req.body.description,
        Phonenumber: req.body.Phone,
        CampaignId: campaign._id,
        done: false,
        likes_count: 0,
        LikeorUnlike: false,
        Photo: `uploads/${filename}`
      });
      photo.save().then(photo => {
        console.log(photo);

        req.flash('success', {
          msg: 'Uploaded successfully'
        });
        res.status(200).json({
          'status': 200,
          'msg': 'Completed'
        })
        // return  res.redirect('/photoapp/'+ req.params.slug);

      });

    });
  } catch (err) {
    console.log(err);
  }
}



exports.getGallery = (req, res) => {

  var perPage = 9
  var page = req.params.page || 1
  var slug = req.params.slug

  console.log(req.session);


  Campaign.findOne({
    slug: req.params.slug
  }, function (err, campaign) {

    PhotoEntries.find({
        CampaignId: campaign._id
      }, ['Photo', 'Description', 'Name', 'voteScore', 'likes_count', 'likedBy', 'done', 'LikeorUnlike'], {
        sort: {
          _id: -1
        }
      }).skip((perPage * page) - perPage)
      .limit(perPage)
      .exec(function (err, photos) {



        PhotoEntries.countDocuments().exec(function (err, count) {
          if (err) return next(err)

          res.render('gallery2', {
            photolist: photos,
            campaign: campaign,
            current: page,
            pages: Math.ceil(count / perPage),
            slug: slug

          })

        })



      });

  });

}




//Mark as complete
exports.postLikes = (req, res, next) => {
  // router.post('/complete', function (req, res, next) {
  let taskId = req.body.taskId;
  PhotoEntries.findOne({
    _id: taskId
  }, (err, photo) => {

    var foundUserLike = photo.likedBy.some(function (like) {
      return like.equals(req.user._id);
    })

    if (!foundUserLike) {

      PhotoEntries.updateOne({
        _id: taskId
      }, {
        LikeorUnlike: true,
        $push: {
          likedBy: req.user._id
        },
        $inc: {
          likes_count: 1
        },

      }, function (err, resp) {
        if (!err) {
          // console.log(request.connection.remoteAddress)
          console.log(PhotoEntries.LikeorUnlike)
          res.status(200).json({
            'status': 200,
            msg: 'Completed'
          })
        }

      });
    } else {

      res.status(200).json({
        'status': 500,
        'error': 'NotCompleted'
      })

    }
  })

};