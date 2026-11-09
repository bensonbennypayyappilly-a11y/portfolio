// Render every part: node tools/render-all.mjs [first] [last]
import { execFileSync } from 'node:child_process';
const [first = 1, last = 10] = process.argv.slice(2).map(Number);
for (let day = first; day <= last; day++) {
  const out = `renders/sam-starts-small-part-${String(day).padStart(2, '0')}.mp4`;
  console.log(`Part ${day} -> ${out}`);
  execFileSync('npx', ['hyperframes', 'render', '-q', 'delivery', '--variables', JSON.stringify({ day }), '-o', out], { stdio: ['ignore', 'ignore', 'inherit'] });
}
