const version = "0.0.8";
const process = require('process');
const express = require('express');
const multer = require('multer');  
const fs = require('fs');
const bodyParser = require('body-parser');
const md5 = require('md5');
const http_auth = require('http-auth');

console.log(`admin.js version: ${version}`);
process.chdir('/storage/sd');

// Brightsign Dependencies
var BrightSignPlayer = {};
BrightSignPlayer.dwsconfiguration = require("@brightsign/dwsconfiguration");

var DWSConfigurationClass = BrightSignPlayer.dwsconfiguration;
var dwsConfigClass = new DWSConfigurationClass();
var bsSocketMessage = new BSDatagramSocket();

// Globals
const authenticator_realm = 'brightsign';
const uploadPath = '/storage/sd/uploads';
const allUploads_filename = 'allUploads.json';
var isSVCPressed, isResetPasswordClicked = false;
var resetPasswordTimer = null;
var isPasswordReset = false;
var allUploadsJson = {"files": []};
const port = 3200;

bsSocketMessage.BindLocalPort(5902);

bsSocketMessage.ondatagram = function (e) {
  // console.log('ondatagram');
  // console.log(e);
  var bytes = e.getBytes();
  var byteArray = new Int8Array(bytes);
  var udpMessage = String.fromCharCode.apply(null, byteArray);
  console.log(`udpMessage: ${udpMessage}`);
  
  var msg = udpMessage.split("!!");
  if (msg[0] === "svcpressed") {
    isSVCPressed = msg[1].toLowerCase();
    console.log(`isSVCPressed: ${isSVCPressed}`);
     
    if (isResetPasswordClicked && isSVCPressed === "true") {
      isResetPasswordClicked = false;
      isSVCPressed = false;
      clearTimeout(resetPasswordTimer);

      setPassword('')
      .then(function() {
        isPasswordReset = true;
        bsSocketMessage.SendTo("127.0.0.1", 5901, "httpserver!!resetpasswordtimer!!off");
      })
    }
  }
}

function main() {
  console.log(process.cwd());

  console.log('Starting express server...');
  var app = express();

  app.use(bodyParser.urlencoded({ extended: true }));

  // Authentication for Admin page with DWS
  var brightsign_digest_authenticator = http_auth.digest({
    realm: authenticator_realm
  }, function(username, callback) {
    var DWSConfigurationClass = BrightSignPlayer.dwsconfiguration;
    var dwsConfigClass = new DWSConfigurationClass();
    // console.log('digest authenticator check hash');
    dwsConfigClass.getDigestHash("admin", authenticator_realm)
    .then(function(md5sum) {
      if (username === "admin") {
        console.log('username is admin');
        callback(md5sum);
      } else {
        console.log('username is empty');
        callback();
      }
    });
  });

  var authentication_router = express.Router();

  // Routes require authentication
  authentication_router.use('/', function(req,res,next) {
    if ((req.url.startsWith('/allUploads')) ||
        (req.url.startsWith('/static')) ||
        (req.url.startsWith('/uploads')) ||
        (req.url.startsWith('/resetdwspassword')) ||
        (req.url.startsWith('/forgotpassword')) ||
        (req.url.startsWith('/ispasswordreset'))) {
      return next();
    }
    // console.log(`authenticator: ${req.url}`);
    dwsConfigClass.getDigestHash("admin", authenticator_realm)
    .then(function (md5sum) {
      // console.log(`router, md5sum: ${md5sum}`);
      // console.log(`router, md5sum: ${md5("admin:" + authenticator_realm + ":password")}`);
      if (md5sum === md5("admin:" + authenticator_realm + ":")) {
        // i.e. this is a blank password
        console.log(`password is blank`);
        next();
      } else {
        console.log(`password is being checked`);
        brightsign_digest_authenticator.check(req,res,function() {
          next();
        });
      }
    });
  });

  app.use(authentication_router);

  // initialization of filesystem management with allUploads.json and /uploads
  var promiseList = [];

  // Create /uploads directory if not found
  if (!fs.existsSync(uploadPath)) {
    console.log('Creating /uploads folder now...');
    promiseList.push(fs.mkdir(uploadPath, (err) => { 
      if (err) { 
          return console.error(err); 
      }
      console.log('created /uploads folder');
    }));
  }

  // Create allUploads.json if not found
  if (!fs.existsSync(allUploads_filename)) {
    console.log(`Creating ${allUploads_filename} file now...`);
    promiseList.push(fs.writeFile(allUploads_filename, JSON.stringify({"files": []}), function (err) {
      if (err) throw err;
      console.log(`Saved ${allUploads_filename} to /storage/sd`);
    }));
  }

  // 
  fs.readFile(allUploads_filename, 'utf-8', function(err, data) {
    if (err) throw err;
    console.log(`${data}`);
    allUploadsJson = JSON.parse(data);

    promiseList.push(readDir(uploadPath).then(function(files) {
      for( i=0; i < files.length; i++ ) {
        if (!allUploadsJson.files.some(e => e.filename === files[i])) {
          console.log(`adding file: ${files[i]}`);
          var location = '/uploads/' + files[i];
          allUploadsJson.files.push({"filename": files[i], "location": location, "checked": false});
        }
      }
      console.log(`allUploads.json: ${JSON.stringify(allUploadsJson)}`);

      // Enable one of the provided images as the default if none is selected
      var foundChecked = false;
      var jsonFiles = allUploadsJson.files;
      var defaultFileIndex;
      for(i = 0; i < jsonFiles.length; i++) {
        if (jsonFiles[i].checked) {
          foundChecked = true;
          break;
        }

        if ((defaultFileIndex === undefined) && 
            (jsonFiles[i].filename === "instructions.png") || 
            (jsonFiles[i].filename === "instructions.jpg")) {
              defaultFileIndex = i;
        }
      }
      
      if (!foundChecked && defaultFileIndex != undefined) {
        jsonFiles[defaultFileIndex].checked = true;
      }

      fs.writeFile(allUploads_filename, JSON.stringify(allUploadsJson), 'utf-8', function(err) {
        if (err) throw err;
        console.log(`Updated ${allUploads_filename}`);
      })
    }));
  })
  
  // Executed after filesystem management is complete
  Promise.all(promiseList).then(function() {
    // Instantiate image storage space
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadPath)
      },
      filename: function (req, file, cb) {
        console.log(file);
        cb(null, file.originalname)
      }
    })

    var upload = multer({
      storage: storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
          cb(null, true);
        } else {
          cb(null, false);
          // return cb(new Error('Only .png, .jpg, and .jpeg format allowed!'));
        }
      }
    });

    // Routes
    // GET /allUploads
    // Description: Get menu json
    app.get('/allUploads', function(req, res, next) {
      console.log('GET /allUploads');
      console.log('static file');
      res.sendFile('/storage/sd/' + allUploads_filename);
    })

    // POST /submit
    // Description: User submits a supported image type from /admin page
    app.post('/submit', upload.array('pics'), function (req, res, next) {
      var files = req.files;
      console.log(`Files uploaded: ${JSON.stringify(files)}`);
      // res.end();
      console.log('POST /submit');
      // TODO, handle duplicate files
      if (files.length > 0) {
        var foundIndex = allUploadsJson.files.findIndex(e => e.filename === files[0].filename);
        if (foundIndex === -1) {
          var location = '/uploads/' + files[0].filename;
          allUploadsJson.files.push({"filename": files[0].filename, "location": location, "checked": false});
          fs.writeFile(allUploads_filename, JSON.stringify(allUploadsJson), 'utf-8', function(err) {
            if (err) throw err;
            console.log(`Updated ${allUploads_filename} with new file`);
          })
        } else {
          var location = '/uploads/' + files[0].filename;
          allUploadsJson.files[foundIndex] = {"filename": files[0].filename, "location": location, "checked": false};
          fs.writeFile(allUploads_filename, JSON.stringify(allUploadsJson), 'utf-8', function(err) {
            if (err) throw err;
            console.log(`Replaced file in ${allUploads_filename}`);
          })
        }
      }
      res.redirect('/admin')
    });

    // POST /update
    // Description: Update which menu is displayed
    app.post('/update', function(req, res, next) {
      console.log('POST /update');
      
      // console.log(req.body.choose_menu);
      // chosenMenuFilepath = req.body.choose_menu;
      for (i = 0; i < allUploadsJson.files.length; i++) {
        var file = allUploadsJson.files[i];
        var bodyFile = req.body[file.filename];
        file.checked = stringToBoolean(bodyFile);
      }

      fs.writeFile(allUploads_filename, JSON.stringify(allUploadsJson), 'utf-8', function(err) {
        if (err) throw err;
        console.log(`Updated ${allUploads_filename}`);
      })

      res.redirect('/admin');
    })

    // POST /deletefile
    // Description: Delete a specified file
    app.post('/deletefile', function(req, res, next) {
      var files = allUploadsJson.files;
      var foundIndex = files.findIndex(e => e.filename === decodeURIComponent(req.query.filename));

      console.log(`${foundIndex}`);
      if (foundIndex !== -1) {
        var fileToRemove = '/storage/sd' + files[foundIndex].location; // /uploads/<filename>
        
        files.splice(foundIndex, 1);

        fs.unlink(fileToRemove, (err) => {
          if (err) {
            console.log(`Error removing ${fileToRemove}`);
          }
          console.log(`Successfully removed ${fileToRemove}`);
        });

        fs.writeFile(allUploads_filename, JSON.stringify(allUploadsJson), 'utf-8', function(err) {
          if (err) throw err;
          console.log(`Updated ${allUploads_filename}`);
          res.redirect('/admin');
        })
      }
      // res.redirect('/admin');
    });

    app.post('/updatePassword', function(req, res, next) {
      setPassword(decodeURIComponent(req.body.password))
      .then(function(success) {
        if (success) {
          res.redirect('/admin');
        
        }
      })
      .catch(function() {
        res.redirect('/admin');
      })
    });

    app.get('/isPasswordReset', function(req, res, next) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ isPasswordReset: isPasswordReset }));
      isPasswordReset = false
    })

    app.post('/resetdwspassword', function(req, res, next) {
      console.log('/resetdwspassword');
      isResetPasswordClicked = true;
      bsSocketMessage.SendTo("127.0.0.1", 5901, "httpserver!!resetpasswordtimer!!on");
      res.redirect('/forgotpassword');
      clearTimeout(resetPasswordTimer);
      resetPasswordTimer = setTimeout(function(configData) {
        console.log('SVC was not pressed within 10 seconds.');
        clearTimeout(resetPasswordTimer);
        isPasswordReset = false;
        isSVCPressed = false;
        isResetPasswordClicked = false;
        bsSocketMessage.SendTo("127.0.0.1", 5901, "httpserver!!resetpasswordtimer!!off");
      }, 10000)
    })
  });

  app.use(express.static('node/static/'));
  app.use('/admin', express.static('node/static'));
  app.use('/forgotpassword', express.static('node/static/forgotpassword'));
  app.use('/static', express.static('node/static'));
  app.use('/uploads', express.static('uploads'));
  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Origin, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  app.listen(port, function() {
    console.log(`Admin page waiting for responses...`);
  });
}

// Helper for /files to retrieve the file names from the SD card /uploads directory
function readDir() {
  return new Promise(function(resolve) {
    console.log(`readDir() - entered`);
    fs.readdir(uploadPath, function(err, files) {
      if (err) {
        console.log(err);
        return;
      }
      resolve(files);
    });
  })
}

function stringToBoolean(str) {
  switch(str.toLowerCase().trim()){
      case "true": case "yes": case "1": return true;
      case "false": case "no": case "0": case null: return false;
      default: return Boolean(string);
  }
}

function setPassword(password) {
  return new Promise(function(resolve, /*reject*/) {
    var pw = {};
    var configData = {
      "authenticationList": ["digest"],
      "password": pw
    };

    pw.value = password;
    pw.obfuscated = false;
    
    dwsConfigClass.applyConfig(configData).then(function(data) {
      console.log(JSON.stringify(data));
      resolve(true);
    })
    .catch(function(data) {
      console.log(`Error updating password: ${JSON.stringify(data)}`);
      resolve(false);
    });
  })
}  

window.main = main;
