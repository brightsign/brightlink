module.exports = {
  scripts: {
    buildHttpsStandaloneBrightmenu: {
      script: 'set MODULES=admin,portal&& set PROTOCOL=https&& node scripts/build.js',
      description: 'This command will generate production build npm.zip which will enable HTTPS server for Standalone (non courtesy WiFi) BrightMenu package. Run command "nps buildHttpsStandaloneBrightmenu"'
    },
    buildHttpsInternetBrightmenu: {
      script: 'set MODULES=admin,portal&& set PROTOCOL=https&& set RDNS=true&& node scripts/build.js',
      description: 'This command will generate production build npm.zip which will enable HTTPS server for internet (courtesy WiFi) BrightMenu package using recursive DNS. Run command "nps buildHttpsInternetBrightmenu"'
    },
    buildHttpsStandaloneBrightlink: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& node scripts/build.js',
      description: 'This command will generate production build npm.zip which will enable HTTPS server for Standalone (non courtesy WiFi) BrightLink package. Run command "nps buildHttpsStandaloneBrightlink"'
    },
    buildHttpsInternetBrightlink: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& set RDNS=true&& node scripts/build.js',
      description: 'This command will generate production build npm.zip which will enable HTTPS server for internet (courtesy WiFi) BrightLink package using recursive DNS. Run command "nps buildHttpsInternetBrightlink"'
    },
    buildGesture: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& node scripts/build.js',
      description: 'This command will generate production build npm.zip which will enable HTTPS server for Gesture project. Run command "nps buildGesture"'
    },
    buildCourtesywifi: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& set RDNS=true&& node scripts/build.js',
      description: 'This command will generate production build npm.zip which will enable HTTPS server for Courtesy WiFi project. Run command "nps buildCourtesywifi"'
    },
    buildNoap: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& set RDNS=true&& node scripts/build.js',
      description: 'This command will generate production build npm.zip which will enable HTTPS server for No Access point project. Run command "nps buildNoap"'
    },
    buildDevHttpsStandaloneBrightmenu: {
      script: 'set MODULES=admin,portal&& set PROTOCOL=https&& set NODE_ENV=development&& node scripts/build.js',
      description: 'This command will generate dev build npm.zip which will enable HTTPS server for Standalone (non courtesy WiFi) BrightMenu package. Run command "nps buildDevHttpsStandaloneBrightmenu"'
    },
    buildDevHttpsInternetBrightmenu: {
      script: 'set MODULES=admin,portal&& set PROTOCOL=https&& set RDNS=true&& node scripts/build.js',
      description: 'This command will generate dev build npm.zip which will enable HTTPS server for internet (courtesy WiFi) BrightMenu package using recursive DNS. Run command "nps buildDevHttpsInternetBrightmenu"'
    },
    buildDevHttpsStandaloneBrightlink: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& node scripts/build.js',
      description: 'This command will dev production build npm.zip which will enable HTTPS server for Standalone (non courtesy WiFi) BrightLink package. Run command "nps buildDevHttpsStandaloneBrightlink"'
    },
    buildDevHttpsInternetBrightlink: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& set RDNS=true&& node scripts/build.js',
      description: 'This command will generate dev build npm.zip which will enable HTTPS server for internet (courtesy WiFi) BrightLink package using recursive DNS. Run command "nps buildDevHttpsInternetBrightlink"'
    },
    buildDevGesture: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& node scripts/build.js',
      description: 'This command will generate dev build npm.zip which will enable HTTPS server for Gesture project. Run command "nps buildDevGesture"'
    },
    buildDevCourtesywifi: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& set RDNS=true&& node scripts/build.js',
      description: 'This command will generate dev build npm.zip which will enable HTTPS server for Courtesy WiFi project. Run command "nps buildDevCourtesywifi"'
    },
    buildDevNoap: {
      script: 'set MODULES=portal&& set PROTOCOL=https&& set RDNS=true&& node scripts/build.js',
      description: 'This command will generate dev build npm.zip which will enable HTTPS server for No Access point project. Run command "nps buildDevNoap"'
    }
  }
};
