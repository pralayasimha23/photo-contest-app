const {
  promisify
} = require('util');


const lob = require('lob')(process.env.LOB_KEY);

const axios = require('axios');
const {
  google
} = require('googleapis');

const validator = require('validator');



exports.getApi = (req, res) => {
  res.render('api/index', {
    title: 'API Examples'
  });
};



// /**
//  * GET /api/upload
//  * File Upload API example.
//  */

exports.getFileUpload = (req, res) => {
  res.render('api/upload', {
    title: 'File Upload'
  });
};

exports.postFileUpload = (req, res) => {
  req.flash('success', {
    msg: 'File was uploaded successfully.'
  });
  res.redirect('/api/upload');
};