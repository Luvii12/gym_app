// Ejecuta typecheck, lint, tests y build y solo imprime un resumen (el detalle, si algo falla).
// Uso: npm run verify [-- --e2e]
import { spawnSync } from 'node:child_process';

const steps = [
  ['typecheck', ['run', 'typecheck']],
  ['lint', ['run', 'lint']],
  ['formato', ['exec', '--', 'prettier', '--check', '.']],
  ['tests', ['test']],
  ['build', ['run', 'build']],
];
if (process.argv.includes('--e2e')) steps.push(['e2e', ['run', 'test:e2e']]);

let failed = false;
for (const [name, args] of steps) {
  const start = Date.now();
  const run = spawnSync('npm', args, { encoding: 'utf8' });
  const output = `${run.stdout}\n${run.stderr}`;
  const seconds = ((Date.now() - start) / 1000).toFixed(1);
  const summary = output.match(/Tests\s+.*|\d+ passed.*|built in .*/)?.[0]?.trim() ?? '';
  if (run.status === 0) {
    console.log(`OK     ${name.padEnd(10)} ${seconds}s  ${summary}`);
  } else {
    failed = true;
    console.log(`FALLO  ${name.padEnd(10)} ${seconds}s`);
    console.log(output.trim().split('\n').slice(-30).join('\n'));
    break;
  }
}
process.exit(failed ? 1 : 0);
