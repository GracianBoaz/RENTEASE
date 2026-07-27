const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
}

const allFiles = walkSync('src');
const tsxFiles = allFiles.filter(f => f.endsWith('.tsx'));

tsxFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('placeholderTextColor="#A09AB0"')) {
    let newContent = content.replace(/placeholderTextColor="#A09AB0"\s*\}+/g, 'placeholderTextColor="#A09AB0"');
    if (newContent !== content) {
      fs.writeFileSync(f, newContent);
    }
  }
});
