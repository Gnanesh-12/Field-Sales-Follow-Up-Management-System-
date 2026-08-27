const fs = require('fs');
const path = require('path');

const srcDir = path.join('C:', 'Field-Sales-Follow-Up-Management-System-', 'admin', 'src');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');

      // We need to be careful with text-white on buttons/hover states.
      // Usually hover:text-white is fine, so we only replace plain text-white.
      // Negative lookbehind doesn't always work if we want to ignore something like hover:text-white
      // Let's do a regex that replaces text-white if it's not preceded by : 

      content = content.replace(/(?<!:)\btext-white\b/g, 'text-[var(--text-main)]');
      content = content.replace(/(?<!:)\btext-slate-200\b/g, 'text-[var(--text-main)] opacity-90');
      content = content.replace(/(?<!:)\btext-slate-300\b/g, 'text-[var(--text-main)] opacity-80');
      content = content.replace(/(?<!:)\btext-slate-400\b/g, 'text-[var(--text-main)] opacity-70');
      content = content.replace(/(?<!:)\bbg-slate-900\b/g, 'bg-[var(--glass-bg-primary)]');
      content = content.replace(/(?<!:)\bbg-slate-800\b/g, 'bg-[var(--glass-bg-primary)]');
      content = content.replace(/(?<!:)\bbg-slate-800\/50\b/g, 'bg-[var(--glass-bg-primary)]');
      content = content.replace(/(?<!:)\bbg-slate-900\/40\b/g, 'bg-[var(--glass-bg-primary)]');
      content = content.replace(/(?<!:)\bbg-white\/5\b/g, 'bg-[var(--glass-bg-primary)]');

      content = content.replace(/(?<!:)\bborder-slate-800\b/g, 'border-[var(--glass-border)]');
      content = content.replace(/(?<!:)\bborder-slate-700\b/g, 'border-[var(--glass-border)]');
      content = content.replace(/(?<!:)\bborder-slate-700\/50\b/g, 'border-[var(--glass-border)]');
      content = content.replace(/(?<!:)\bborder-white\/10\b/g, 'border-[var(--glass-border)]');
      content = content.replace(/(?<!:)\bborder-white\/5\b/g, 'border-[var(--glass-border)]');

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Processed ${filePath}`);
    }
  }
}

processDir(srcDir);
console.log('Done.');
