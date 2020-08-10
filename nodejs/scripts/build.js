'use strict';
//BrightMenu has admin and portal both hence
const includes = (process.env.MODULES)?process.env.MODULES.split(","):["admin", "portal"];
const protocol = (process.env.PROTOCOL)? process.env.PROTOCOL: 'https';

const config = require('./config');
//include depedencies
const fs = require("fs");
const archiver = require("archiver");
const webpack = require("webpack");
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const chalk = require('chalk');
const path = require('path');
const url = require('url');

//delete dist folder
function deleteFolderContent(path) {
  if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
    fs.readdirSync(path).forEach(function(file, index){
      var filePath = path + "/" + file;
      if (fs.lstatSync(filePath).isDirectory()) {
        deleteFolderContent(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(path);
  }
};

//archive files that are needed in presentation
function makeArchive() {
    // Create latest build
    var output = fs.createWriteStream('npm.zip');
    var archive = archiver('zip', {
        zlib: {
            level: 9
        } // Sets the compression level.
    });
    archive.pipe(output);
    archive.directory('dist', 'dist');
    if(includes.indexOf('admin')!==-1){
        archive.directory('admin/static', 'static');
        archive.file('admin/adminServer.html', { name: 'adminServer.html' });
        archive.file('cert/certificate.crt', { name: 'certificate.crt' });
        archive.file('cert/private.key', { name: 'private.key' });
    }
    if(protocol=='https'){
        archive.file('cert/certificate.crt', { name: 'certificate.crt' });
        archive.file('cert/private.key', { name: 'private.key' });
    }
    archive.file('portal/portalServer.html', { name: 'portalServer.html' });
    archive.finalize();
}

//declare actual webpack process start with build
function build() {
    console.log("Cleaning dist folder");
    deleteFolderContent('./dist');
    console.log('Creating an optimized production build...');
    let compiler = webpack(config);
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                return reject(err);
            }
            const messages = formatWebpackMessages(stats.toJson({}, true));
            if (messages.errors.length) {
                // Only keep the first error. Others are often indicative
                // of the same problem, but confuse the reader with noise.
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                return reject(new Error(messages.errors.join('\n\n')));
            }
            return resolve({ stats, warnings: messages.warnings });
        });
    });
}

//start build process and zip file
build().then(({ stats, previousFileSizes, warnings }) => {
    //after build is completed log warnings else say build is successful
    if (warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'));
        console.log(warnings.join('\n\n'));
        console.log('\nSearch for the ' + chalk.underline(chalk.yellow('keywords')) + ' to learn more about each warning.');
        console.log('To ignore, add ' + chalk.cyan('// eslint-disable-next-line') + ' to the line before.\n');
    } else {
        console.log(chalk.green('Compiled successfully.\n'));
    }
    //build of webpack is completed zip file now
    makeArchive();

}, err => {
    //if build has error raise error and exit
    console.log(chalk.red('Failed to compile.\n'));
    console.log(err);
    process.exit(1);
});