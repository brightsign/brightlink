# BrightSign - BrightLink and BrightMenu Examples

The repository, examples, and provided source code are examples and for development purposes, providing information to implement and configure BrightSign to act as an Access Point, route traffic and hosting webpages through DNS and a proxy. This repository takes advantage of BrightSign's BrightAuthor and BrightAuthor:connected plugins and JavaScript. These are implemented similarly to BrightLink and BrightMenu. 

It assumes an understanding of JavaScript, BrightScript, the BrightSign developer ecosystem.

## Build the npm.zip bundle
1. Install node modules
```
npm install
```

2. Install nps globally in order to set variables to build a specific configuration that this repository supports using
```
npm i -g nps
```

3. To see all available commands hit 
*nps help*.
This command will list all the commands that can build npm.zip for different purposes

4. hit actual command for the target selected from above help for example:
</br>

For BrightMenu Production HTTPS Access Point without internet,
```
nps buildHttpsStandaloneBrightmenu
```

For BrightMenu Dev HTTPS Access Point without internet,
```
nps buildDevHttpsStandaloneBrightmenu
```

For BrightLink Dev HTTP Access Point without internet,
```
nps buildDevHttpStandaloneBrightlink
```

5. The dependencies which are referenced in the BrightAuthor / BrightAuthor:connected presentation are
the httpServer-npm-auto_v3.brs, Set_Player_As_Access_Point_plugin.brs, and npm.zip.

### npm.zip structure
  - /dist
    - admin.js
    - portal.js
  - /static
    - /forgotpassword
    - index.html
    - jquery-3.5.0.min.js
    - qrcode.js
    - qrious.min.js
  - adminServer.html
  - portalServer.html

