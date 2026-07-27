const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.expo = {
  install: {
    exclude: []
  },
  name: "RentEase"
};

pkg.resolutions = {
  "expo-constants": "18.0.13"
};

const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
appJson.expo.android.versionCode = 8;

if (appJson.expo.plugins) {
  appJson.expo.plugins = appJson.expo.plugins.filter(p => {
    if (typeof p === 'string') {
      return p !== 'expo-auth-session' && p !== 'expo-web-browser';
    }
    if (Array.isArray(p)) {
      return p[0] !== 'expo-auth-session' && p[0] !== 'expo-web-browser';
    }
    return true;
  });
}

fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
