/**
 * Module dependencies.
 */
const express = require('express');
const http = require('http');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressip = require('express-ip');
const expressStatusMonitor = require('express-status-monitor');

// const sass = require('node-sass-middleware');
// const multer = require('multer');
const ejs = require("ejs");
// const upload = multer({ dest: path.join(__dirname, 'uploads') });

const fileUpload = require('express-fileupload');
/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 * 
 */
dotenv.config({
  path: '.env.example'
});

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const adminController = require('./controllers/admin');
const leadcollectionController = require('./controllers/landingpage');



/** 
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');
// const passportConfig2 = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});


app.use(expressip().getIpInfoMiddleware);

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressStatusMonitor());
app.use(compression());
// app.use(sass({
//   src: path.join(__dirname, 'public'),
//   dest: path.join(__dirname, 'public')
// }));

app.use(fileUpload());




app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 1209600000
  }, // two weeks in milliseconds
  store: new MongoStore({
    url: process.env.MONGODB_URI,
    autoReconnect: true,
  })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// app.use((req, res, next) => {
//   if (req.path === '/api/upload') {
//     // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
//     next();
//   } else {

//     lusca.csrf()(req, res, next);
//   }
// });

app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.voter = req.voter;
  next();
});

app.use((req, res, next) => {


  next();
});


app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user &&
    (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});



app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.voter

    &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.voter &&
    (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});


app.use('/', express.static(path.join(__dirname, 'public'), {
  maxAge: 31557600000
}));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), {
  maxAge: 31557600000
}));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/popper.js/dist/umd'), {
  maxAge: 31557600000
}));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), {
  maxAge: 31557600000
}));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), {
  maxAge: 31557600000
}));
app.use('/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), {
  maxAge: 31557600000
}));

/**
 * Primary app routes.
 */


app.get('/', homeController.index);

app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account/verify', passportConfig.isAuthenticated, userController.getVerifyEmail);
app.get('/account/verify/:token', passportConfig.isAuthenticated, userController.getVerifyEmailToken);
app.get('/login/:token', userController.getVerifyEmailLoginToken);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);


// app.post('/rms' ,  adminController.photoPlagarisam);







app.get('/dashboard', userController.dashboard);

// app.get('/fileupload', adminController.form_file_upload);
// lusca({ csrf: true })

app.get('/create-photo-campaign', adminController.getCampaign);
app.post('/create-photo-campaign', adminController.postCampaign);


// app.get('/products', adminController.getProducts);

app.get('/campaign-list', adminController.getCampList);



// app.get('/photoapp/:slug', adminController.getEntriesCollection);
app.get('/photoapp/:slug', adminController.getEntriesCollection);

app.post('/photoapp/:slug', leadcollectionController.postEntriesCollection);
// app.get('/photoapp/:slug/success',  leadcollectionController.submitSuccess);


// gallery

app.get('/photoapp/:slug/gallery/:page', leadcollectionController.getGallery);



app.get('/photoapp/:slug/analytics', adminController.getAnalytics);





app.post('/campaign/:id', adminController.postDeleteCampaign);



app.post('/delete', adminController.photoDelete);


app.post('/complete', adminController.photoComplete);


app.post('/like', leadcollectionController.postLikes);



app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
  accessType: 'offline',
  prompt: 'consent'
}));

app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/'
}), (req, res) => {
  // backURL=req.header('Referer');
  // do your thang
  // res.redirect(backURL);
  res.redirect(req.session.returnTo)


});





app.use(function (req, res, next) { // i catch 404s
  res.status(404);
  res.render('404');
});

if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});



module.exports = app;