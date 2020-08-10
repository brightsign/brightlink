const fs = require("fs");
const webpack = require("webpack");
const path = require('path');
const protocol = (process.env.PROTOCOL)? process.env.PROTOCOL: 'https';
const rdns = (process.env.RDNS)? process.env.RDNS: false;
//BrightMenu has admin and portal both hence
const includes = (process.env.MODULES)?process.env.MODULES.split(","):["admin", "portal"];
//get current working directoy
const appDirectory = fs.realpathSync(process.cwd());

//get absoute path from relative path combination of app directory and relative path
const getAbsolutePath = relativePath => path.resolve(appDirectory, relativePath);

const isProduction = process.env.NODE_ENV === 'development' ? false: true

//function to get entry for webpack
function getEntries(){
    let entries = {};
    includes.forEach(inc => {
        inc = inc.trim(); //remove extra spaces
        entries[inc] = getAbsolutePath(`${inc}/${inc}.js`);
    });
    return entries;
}

//configuration of webpack
const config = {
    entry: getEntries(),
    output: {
        publicPath: './',
        filename: '[name].js',
        libraryTarget: "commonjs2",
        path: getAbsolutePath('dist')
    },
    target: 'node',
    resolve: {
        extensions: ['.js'],
    },
    externals: {
        // add external libraries here
        "@brightsign/dwsconfiguration": 'commonjs @brightsign/dwsconfiguration'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                ],
            }
        ]
    },
    optimization: {
        minimize:  isProduction
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: isProduction
            },
            'PROTOCOL': JSON.stringify(protocol), 
            'RDNS': JSON.stringify(rdns) 
        })
    ]
};

module.exports = config;