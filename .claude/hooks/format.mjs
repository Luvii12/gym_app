// PostToolUse: formatea con Prettier el archivo recién editado/escrito.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const file = input?.tool_input?.file_path;
  if (file && /\.(tsx?|jsx?|css|json|md|html)$/.test(file) && !file.includes('node_modules')) {
    spawnSync('npx', ['prettier', '--write', '--log-level', 'silent', file], {
      cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    });
  }
} catch {
  // nunca bloquear la edición por un fallo de formateo
}
