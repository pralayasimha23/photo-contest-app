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
    if (validator.isEmpty(req.body.name)) validationErrors.push({ msg: 'Please enter your name' });
    if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
    if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
  }
  if (validator.isEmpty(req.body.description)) validationErrors.push({ msg: 'Please enter your message.' });


  function getValidateReCAPTCHA(token) {
    return axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      {},
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      });
  }

  try {
    const validateReCAPTCHA = await getValidateReCAPTCHA(req.body['g-recaptcha-response']);
    if (!validateReCAPTCHA.data.success) {
      validationErrors.push({ msg: 'reCAPTCHA validation failed.' });
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

      validationErrors.push({ msg: 'Please upload file.' });
      req.flash('errors', validationErrors);  
      // res.status(200).json({
      //   'status': 200,
      //   'msg': 'Error'
      // })
      return res.redirect('/contact');
    }else{
    

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
}catch (err) {
  console.log(err);
}
}




// exports.postEntriesCollection = (req, res) => {

//   Campaign.findOne({
//     slug: req.params.slug
//   }, function (err, campaign) {

//     let filename = '';


//     if (!isEmpty(req.files)) {
//       let file = req.files.file;
//       filename = file.name;
//       let uploadDir = './public/PhotoContestUploads/uploads/';
//       console.log(filename);
//       file.mv(uploadDir + filename, (err) => {
//         if (err)
//           throw err;
//       });
//     }

//     const photo = new PhotoEntries({

//       Email: req.body.email,
//       Name: req.body.name,
//       Description: req.body.description,
//       Phonenumber: req.body.Phone,
//       CampaignId: campaign._id,
//       done: false,
//       likes_count: 0,
//       LikeorUnlike: false,
//       Photo: `uploads/${filename}`
//     });
//     photo.save().then(photo => {
//       console.log(photo);

//       req.flash('success', {
//         msg: 'Uploaded successfully'
//       });
//       res.status(200).json({
//         'status': 200,
//         'msg': 'Completed'
//       })
//       // return  res.redirect('/photoapp/'+ req.params.slug);

//     });
//   });
// }



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





exports.postPhotoVoteVerification = (req, res, next) => {

  const voter = new VoterEntries({

    email: req.body.email,
    VoterEmailVerified: false
  });
  VoterEntries.findOne({
    email: req.body.email
  }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      req.flash('errors', {
        msg: 'Account with that email address already exists.'
      });
      // return res.redirect('/photoapp/:slug/gallery/1');
    }

  })

  const createRandomToken = randomBytesAsync(16)
    .then((buf) => buf.toString('hex'));

  const setRandomToken = (token) => {
    voter.VoterEmailVerificationToken = token;
    voter.save();
    console.log(token);
    return token;
  };

  const sendVerifyEmail = (token) => {
    let transporter = nodemailer.createTransport({
      service: 'MailGun',
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASSWORD
      }
    });
    const mailOptions = {
      to: req.body.email,
      from: 'hackathon@starter.com',
      subject: 'Please verify your email address to vote',
      text: `Thank you for registering for voting.\n\n
        This verify your email address please click on the following link, or paste this into your browser:\n\n
      Your code is:  ${token}\n\n
        \n\n
        Thank you!`
    };

    return transporter.sendMail(mailOptions)
      .then(() => {
        // req.flash('info', { msg: `An e-mail has been sent to ${voter.email} with further instructions.` });
        res.status(200).json({
          'status': 200,
          msg: 'ok'
        })
      })
      .catch((err) => {
        if (err.message === 'self signed certificate in certificate chain') {
          console.log('WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production.');
          transporter = nodemailer.createTransport({
            service: 'MailGun',
            auth: {
              user: process.env.MAILGUN_USER,
              pass: process.env.MAILGUN_PASSWORD
            },
            tls: {
              rejectUnauthorized: false
            }
          });
          return transporter.sendMail(mailOptions)
            .then(() => {
              // req.flash('info', { msg: `An e-mail has been sent to ${voter.email} with further instructions.` });
              res.status(200).json({
                'status': 200,
                msg: 'ok'
              })
            });
        }
        console.log('ERROR: Could not send verifyEmail email after security downgrade.\n', err);
        // req.flash('errors', { msg: 'Error sending the email verification message. Please try again shortly.' });
        res.status(500).json({
          'status': 500,
          msg: 'Mail Server Error Due to DownGrade'
        })
        return err;
      });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendVerifyEmail)
    // .then(() => res.redirect('/signup'))
    .catch(next);
};

// * GET /account/verify/:token
// * Verify email address
// */
exports.postPhotoVoteVerificationToken = (req, res, next) => {

  let verificationcode = req.body.code;
  VoterEntries
    .findOne({
      VoterEmailVerificationToken: verificationcode
    })
    .then((voter) => {

      console.log(voter.VoterEmailVerificationToken);
      if (voter.VoterEmailVerified === "true") {
        req.flash('info', {
          msg: 'The email address has been verified already.'
        });
        // return res.redirect('/account');
      }
    })

  const validationErrors = [];
  if (req.body.code && (!validator.isHexadecimal(req.body.code))) validationErrors.push({
    msg: 'Invalid Token.  Please retry.'
  });
  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    //  return res.redirect('/account');
  }

  VoterEntries
    .findOne({
      VoterEmailVerificationToken: req.body.code
    })
    .then((voter) => {

      if (req.body.code === voter.VoterEmailVerificationToken) {
        VoterEntries
          .findOne({
            email: voter.email
          })
          .then((voter) => {
            if (!voter) {
              req.flash('errors', {
                msg: 'There was an error in loading your profile.'
              });
              //  return res.redirect('back');
            }
            voter.VoterEmailVerificationToken = '';
            voter.VoterEmailVerified = true;
            voter = voter.save();


          })

          .then(() => {
            // req.flash('info', { msg: `An e-mail has been sent to ${voter.email} with further instructions.` });
            console.log('ok');
            res.status(200).json({
              'status': 200,
              msg: 'ok'
            })
          })
          .catch((error) => {
            console.log('Error saving the user profile to the database after email verification', error);
            req.flash('errors', {
              msg: 'There was an error when updating your profile.  Please try again later.'
            });

            //  res.status(200).json({ 'status': 200, msg: 'ok' })
            //  return res.redirect('/account');
          });
      } else {
        req.flash('errors', {
          msg: 'The verification link was invalid, or is for a different account.'
        });
        //  return res.redirect('/account');
      }
    })
};



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