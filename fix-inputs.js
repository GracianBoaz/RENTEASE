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

const styleString = `style={{
            backgroundColor: '#F0EEF4',
            borderRadius: 12,
            padding: 12,
            fontSize: 15,
            color: '#1A1625',
            borderWidth: 1.5,
            borderColor: 'rgba(108,63,232,0.12)',
          }}
          placeholderTextColor="#A09AB0"`;

tsxFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('<TextInput')) {
    content = content.replace(/<TextInput([\s\S]*?)(\/?)>/g, (match, p1, p2) => {
      let newAttrs = p1.replace(/style=\{[\s\S]*?\}/, ''); 
      newAttrs = newAttrs.replace(/placeholderTextColor=['"][^'"]*['"]/, ''); 
      return `<TextInput ${styleString} ${newAttrs}${p2}>`;
    });
    fs.writeFileSync(f, content);
  }
});
