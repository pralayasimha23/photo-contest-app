var mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const colorValidator = (v) => (/^#([0-9a-f]{3}){1,2}$/i).test(v)
var Schema = mongoose.Schema;

mongoose.plugin(slug);

var campaignSchema = new Schema({
  Campname: {
    type: String
  },
  Title: {
    type: String
  },
  Email: {
    type: String
  },
  Start: {
    type: Date
  },
  End: {
    type: Date
  },
  Time: {},
  Description: {},
  Primarycolor: {
    type: String,
    validator: [colorValidator, 'Invalid color'],

  },
  Secondarycolor: {
    type: String,
    validator: [colorValidator, 'Invalid color'],

  },
  FacebookURL: {},
  TwitterURL: {},
  InstagramURL: {},
  LinkedinURL: {},
  Logo: {},
  Banner: {},
  TemplateType: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  photoId: [{
    type: Schema.Types.ObjectId,
    ref: 'PhotoEntries'
  }],

  winner: [{
    type: Schema.Types.ObjectId,
    ref: 'PhotoEntries'
  }],

  slug: {
    type: String,
    slug: ["Campname"],
    unique: true
  }

});

module.exports = mongoose.model('Campaigns', campaignSchema);

// const Campaign = mongoose.model('campaign ',campaignSchema);

// exports.Campaign = Campaign;