const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..');
const backend = path.join(root, 'Backend');
const frontend = path.join(root, 'Frontend');
const problems = [];
const warnings = [];

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function checkJsSyntax() {
  const files = [
    ...walk(path.join(backend, 'src'), f => f.endsWith('.js')),
    ...walk(frontend, f => f.endsWith('.js')),
  ];

  for (const file of files) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
      problems.push(`Erro de sintaxe JS em ${path.relative(root, file)}\n${err.stderr || err.message}`);
    }
  }
}

function checkCriticalImports() {
  try {
    require(path.join(backend, 'src', 'routes'));
  } catch (err) {
    problems.push(`Falha ao carregar rotas do backend: ${err.message}`);
  }
}

function checkStaticRefs() {
  const files = walk(frontend, f => /\.(html|css)$/i.test(f));
  const attrRe = /\b(?:src|href)=["']([^"']+)["']|url\(["']?([^)"']+)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = attrRe.exec(content))) {
      const ref = match[1] || match[2];
      if (!ref || /^(https?:|mailto:|tel:|#|data:)/i.test(ref)) continue;
      if (ref.includes('${')) continue;

      const clean = ref.split('#')[0].split('?')[0];
      if (!clean) continue;
      const target = path.resolve(path.dirname(file), clean);
      if (!fs.existsSync(target)) {
        problems.push(`Referência local inexistente em ${path.relative(root, file)}: ${ref}`);
        continue;
      }

      const actualName = path.basename(target);
      const names = fs.readdirSync(path.dirname(target));
      if (!names.includes(actualName)) {
        problems.push(`Diferença de maiúsculas/minúsculas em ${path.relative(root, file)}: ${ref}`);
      }
    }
  }
}

function checkHtmlDocuments() {
  const files = walk(frontend, f => /\.html$/i.test(f));
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8').trimStart();
    if (!content.toLowerCase().startsWith('<!doctype html>')) {
      problems.push(`HTML sem <!DOCTYPE html>: ${path.relative(root, file)}`);
    }
    if (!/<html\b/i.test(content) || !/<\/html>/i.test(content)) {
      problems.push(`HTML incompleto: ${path.relative(root, file)}`);
    }
  }
}

function checkEnv() {
  const envPath = path.join(backend, '.env');
  if (!fs.existsSync(envPath)) {
    warnings.push('Backend/.env não existe. Copie env.example para .env e configure DB_*, JWT_SECRET e EMAIL_*.');
    return;
  }

  const env = fs.readFileSync(envPath, 'utf8');
  for (const key of ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET']) {
    if (!new RegExp(`^${key}=.+`, 'm').test(env)) {
      warnings.push(`Variável ${key} ausente ou vazia em Backend/.env.`);
    }
  }
}

checkJsSyntax();
checkCriticalImports();
checkStaticRefs();
checkHtmlDocuments();
checkEnv();

if (warnings.length) {
  console.log('\nAvisos:');
  warnings.forEach(w => console.log(`- ${w}`));
}

if (problems.length) {
  console.error('\nProblemas encontrados:');
  problems.forEach(p => console.error(`- ${p}`));
  process.exit(1);
}

console.log('Verificação concluída sem erros críticos.');
