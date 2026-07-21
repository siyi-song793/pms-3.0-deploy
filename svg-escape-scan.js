const fs = require('fs');
const path = require('path');

const SVG_DANGER_REGEX = /http:\/\/www\.w3\.org\/2000\/svg(&#39;|&#34;|%27|%22|[\s\S]*?(&#39;|&#34;|%27|%22))+/g;
const SCAN_EXT = ['.ts', '.js', '.json', '.md', '.html', '.svg'];
const EXCLUDE_DIR = ['node_modules', 'dist', '.devcontainer', '.git'];

let dangerCount = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIR.some(d => fullPath.includes(d))) {
        scanDir(fullPath);
      }
      return;
    }

    if (!SCAN_EXT.some(ext => fullPath.endsWith(ext))) return;

    let content = fs.readFileSync(fullPath, 'utf8');
    const originContent = content;
    content = content.replace(SVG_DANGER_REGEX, '');

    const matchList = originContent.match(SVG_DANGER_REGEX);
    if (matchList) {
      dangerCount += matchList.length;
      console.log(`🔴 发现恶意链接：${fullPath} 命中${matchList.length}处`);
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  });
}

console.log('🔍 开始全域扫描混合转义W3C SVG恶意URL...');
scanDir(path.resolve(__dirname, '../'));

if (dangerCount > 0) {
  console.log(`\n✅ 扫描完成！共清除 ${dangerCount} 处SVG恶意链接`);
} else {
  console.log('\n✅ 扫描完成！工程内无SVG恶意链接');
}