# bs-brightlink-brightmenu-dependencies
A bundle of BrightScript plugins and Javascript to support setting the BrightSign Access Point, routing through a DNS and proxy, plugins and Javascript to support BrightMenu's Admin page for BrightMenu/BrightLink. 

To Build npm.zip:
1. npm install

2. install nps globally using command "npm i -g nps"

3. To see all available commands hit 
"nps help"
This command will list all the commands that can build npm.zip for different purposes

4. hit actual command for the target selected from above help for example: 
"nps buildHttpsStandaloneBrightmenu" for production build
or
"nps buildDevHttpsStandaloneBrightmenu" for dev build

5. The dependencies which are referenced in the BrightAuthor presentation are
the httpServer-npm-auto_v3.brs, Set_Player_As_Access_Point_plugin.brs, and npm.zip.

npm.zip structure:
  /dist
    admin.js (copied from, bs-file-upload)
    portal.js
  /static (copied from, bs-file-upload)
    /forgotpassword
    index.html
    jquery-3.5.0.min.js
    qrcode.js
    qrious.min.js
  adminServer.html (copied from, bs-file-upload)
  portalServer.html

