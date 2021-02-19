const _ = require('lodash');
var {
  isEmpty
} = require('../config/customFunctions');

const Campaign = require('../models/campaign');
const User = require('../models/User');
const moment = require('moment');
const photo = require('../models/PhotoCollection');
const PhotoEntries = require('../models/PhotoCollection');
const {
  CredentialListMappingInstance
} = require('twilio/lib/rest/api/v2010/account/sip/domain/credentialListMapping');




exports.getCampaign = (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  } else if (req.user && req.user.role == 'Admin') {
    User.findOne({
      email: req.user.email
    }, (user) => {

      // console.log(user);
      res.render('admin/entry', {
        title: 'Entry Form'

      });



    });

  } else {

    res.render('noanalytics')
  }

}


exports.postCampaign = (req, res) => {

  let filename = '';

  if (!isEmpty(req.files)) {
    let file = req.files.file;
    filename = file.name;
    let uploadDir = './public/campaign/uploads/';
    console.log(filename);
    file.mv(uploadDir + filename, (err) => {
      if (err)
        throw err;
    });
  }

  let logo = '';

  if (!isEmpty(req.files)) {
    let file = req.files.logo;
    logo = file.name;
    let uploadDir = './public/logos/';
    console.log(logo);
    file.mv(uploadDir + logo, (err) => {
      if (err)
        throw err;
    });
  }

  const campaign = new Campaign({

    Campname: req.body.campname,
    Title: req.body.title,
    Email: req.body.email,
    Start: req.body.start,
    End: req.body.end,
    Time: req.body.time,
    FacebookURL: req.body.facebooklink,
    TwitterURL: req.body.twitterlink,
    InstagramURL: req.body.instagramlink,
    LinkedinURL: req.body.linkedinlink,
    Description: req.body.editordata,
    Primarycolor: req.body.primarycolor,
    Secondarycolor: req.body.secondarycolor,
    TemplateType: req.body.template,
    userId: req.user._id,
    Logo: `${logo}`,
    Banner: `uploads/${filename}`
  });
  campaign.save().then(post => {

    console.log(campaign);
    req.flash('success', {
      msg: 'Campaign Created successfully'
    });
    res.render('admin/entry', {
      Campname: campaign.Campname
    });
    //  res.redirect('/create-photo-campaign');

  });
}


exports.getCampList = (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  } else if (req.user && req.user.role == 'Admin') {
    Campaign.find({
      userId: req.user._id
    }, (err, campaign) => {
      res.render('admin/campaign-list', {
        title: 'Campaigns',
        camplist: campaign,

      });

    });

  } else {

    res.render('noanalytics')

  }

}


exports.getEntriesCollection = (req, res) => {
  // const campname = req.params.slug;

  Campaign.findOne({
    slug: req.params.slug
  }, function (err, campaigns) {
    var date = new Date();
    if (campaigns.End < date) {
      console.log('expired');
    }

    if (campaigns.TemplateType == "Vertical" && campaigns.End > date) {
      res.render('landingPages/landingpage2', {
        campaign: campaigns,
        sitekey: process.env.RECAPTCHA_SITE_KEY,
      });
    } else if (campaigns.TemplateType == "Horizontal" && campaigns.End > date) {

      res.render('landingPages/photocollectionpage', {
        campaign: campaigns,
        sitekey: process.env.RECAPTCHA_SITE_KEY,
      });



    } else {
      res.render('expired');


    }

  });
};


exports.getAnalytics = (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  Campaign.findOne({
    slug: req.params.slug
  }, (err, campaign) => {
    PhotoEntries.find({
      CampaignId: campaign._id
    }, ['Photo', 'Name', 'done', 'likes_count', ], {
      sort: {
        _id: -1
      }
    }, function (err, photos) {

      PhotoEntries.countDocuments({
        CampaignId: campaign._id
      }, function (err, count) {

        PhotoEntries.aggregate(
          [{
              $match: {
                CampaignId: campaign._id
              }
            },
            {
              $group: {
                _id: {
                  CampaignId: '$CampaignId'
                },
                Totallikes: {
                  $sum: "$likes_count"
                },

              }
            }
          ],

          function (err, result) {

            // PhotoEntries.aggregate([{ $group: {_id: "$CampaignId",Participants: { $size: "$Name" } }} ]{   


        

            if (req.user && req.user.role == 'Admin' && count >= 1) {


              res.render('admin/analytics', {
                title: 'Analytics',
                campaign: campaign,
                photolist: photos,
                Count: count,

                Totallikes: result[0].Totallikes,
              
              });
            } else {

              res.render('noanalytics', {
                Count: count
              })


            }

          })



      });
    });
  });
}






exports.postDeleteCampaign = (req, res, next) => {

  // Campaign.findByIdAndRemove({id:req.params._id}, (err) => {
  //    if (err) { return next(err); }
  //    req.flash('info', { msg: 'Campaign has been deleted.' });
  //    res.redirect('/campaign-list');
  //  });
  let campId = req.params.id;
  console.log(req.params.id);
  Campaign.findOneAndDelete({
    _id: campId
  }, function (err, campaign) {
    PhotoEntries.remove({
      CampaignId: campaign._id
    }, function (err, photos) {
      // PhotoEntries.findByIdAndRemove({ CampaignId: campaign._id }, function (err) {
      if (!err) {

        req.flash('info', {
          msg: 'Campaign has been deleted.'
        });
        res.redirect('back');

      } else {
        res.status(200).json({
          'status': 'Some problem in deletion' + err
        })
      }
    });
  });

};


// exports.photoPlagarisam = (req, res, next) => {
//   // router.post('/delete', function (req, res, next) {

//   let taskId = req.body.taskId;
// console.log(taskId);
//   PhotoEntries.findOne({
//     _id: taskId
//   }, function (err, photo) {

//     console.log(photo.Photo); 
//     var filename = photo.Photo;
//     const doSomething = (results) => {
//       res.json(results)
//       console.log(results)
//     }
//     let baseurl = 'https://clixmania.herokuapp.com'

//     console.log(baseurl+'/PhotoContestUploads/'+ filename )
//     reverseImageSearch(baseurl+'/PhotoContestUploads/'+ filename , doSomething)

//   })

// };

// Delete Todo

exports.photoDelete = (req, res, next) => {
  // router.post('/delete', function (req, res, next) {
  console.log("Deleted");
  let taskId = req.body.taskId;
  PhotoEntries.findByIdAndRemove({
    _id: taskId
  }, function (err, photo) {
    if (!err) {
      res.status(200).json({
        'status': 200,
        'message': 'Deleted',
        'likes_count': photo.likes_count
      })
    } else {
      res.status(200).json({
        'status': 'Some problem in deletion' + err
      })
    }
  });
};

//Mark as complete
exports.photoComplete = (req, res, next) => {
  // router.post('/complete', function (req, res, next) {
  let taskId = req.body.taskId;

  PhotoEntries.updateOne({
    _id: taskId
  }, {
    done: true

  }, function (err, resp) {
    if (!err) {
      console.log(PhotoEntries.done)
      res.status(200).json({
        'status': 200,
        'message': 'Completed'
      })
    } else {
      res.status(500).json({
        'status': 500,
        'message': 'Some problem in updating' + err
      })
    }

  });
};