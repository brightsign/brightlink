const webpack = require('webpack');
const fs = require('fs');
const ZipFilesPlugin = require('webpack-zip-files-plugin');
var path = require('path');

let config = require('./scripts/config');
config.plugins.push(new ZipFilesPlugin({
      entries: [
        { src: path.join(__dirname, './dist'), dist: 'dist' },
        { src: path.join(__dirname, './admin/static'), dist: 'static' },
        { src: path.join(__dirname, './admin/adminServer.html'), dist: 'adminServer.html' },
        { src: path.join(__dirname, './portal/portalServer.html'), dist: 'portalServer.html' },
        { src: path.join(__dirname, './cert/certificate.crt'), dist: 'certificate.crt' },
        { src: path.join(__dirname, './cert/private.key'), dist: 'private.key' }
      ],
      output: path.join(__dirname, './npm'),
      format: 'zip',
    }),);

module.exports = config;
