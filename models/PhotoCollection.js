var mongoose = require('mongoose');

var Schema = mongoose.Schema;


var photoSchema = new Schema({
  Name: {
    type: String
  },

  Email: {
    type: String
  },

  Photo: {
    type: String
  },
  Description: {
    type: String
  },

  PhoneNumber: {
    type: String
  },
  CampaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaigns',
  },

  done: {
    type: Boolean,
  },

  likes_count: Number,
  default: 0,

  //   upvoted: Array,
  //   downvoted: Array,
  //   voteScore: {
  //       type: Number,
  //       default: 0
  //   },
  likedBy: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],

  LikeorUnlike: {

    type: Boolean,
    default: false,

  },
  Plagarisam : Number, default: 0,

});

photoSchema.methods.serialize = function () {
  return {
    id: this._id,
    Name: this.Name,
    Email: this.Email,
    Photo: this.Photo,
    Description: this.Description,
    PhoneNumber: this.PhoneNumber,
    upvoted: this.upvoted,
    downvoted: this.downvoted,
    voteScore: this.votes,
    likes: this.likes,
    WinningCampaign: this.WinningCampaign,
    done: this.done
  }
}


module.exports = mongoose.model('PhotoEntries', photoSchema);