const Campaign = require('../models/campaign');
const PhotoEntries = require('../models/PhotoCollection');


exports.index = (req, res) => {
  var date = new Date();
  Campaign.aggregate([{
    $match: {
      End: {
        $gt: date
      }
    }
  }], function (err, campaign) {
    console.log(campaign);
    res.render('home', {
      title: 'Home',
      camplist: campaign,

    });
  })
};