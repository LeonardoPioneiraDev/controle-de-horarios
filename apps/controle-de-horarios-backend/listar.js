#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de nomes de pastas ou arquivos a serem ignorados
const ignorar = [
  'node_modules', '.git', 'pg_data', 'redis', 'uploads', 'logs', '.turbo',
  'pg_wal', 'pg_stat', 'pg_xact', 'pg_tblspc', 'pg_multixact', 'pg_notify',
  'pg_replslot', 'pg_serial', 'pg_snapshots', 'pg_subtrans', 'pg_twophase',
  'pg_stat_tmp', 'pg_logical', 'coverage', '.next',
  'oracle-instantclient', 'global', '_fsm', '_vm', 'pg_internal.init',
  'instantclient_12_2', 'base', 'pg_commit_ts', 'pg_dynshmem', 'tls',
  'bin', 'certs', 'chisel', 'compose', 'docker_config', 'backups'
];

// Arquivos específicos a ignorar
const arquivosIgnorar = [
  'package-lock.json', 'pnpm-lock.yaml', '.DS_Store', 'Thumbs.db',
  'portainer.db', 'portainer.key', 'portainer.pub', 'postmaster.opts',
  'pg_hba.conf', 'pg_ident.conf', 'PG_VERSION', 'postgresql.auto.conf',
  'postgresql.conf'
];

function deveIgnorarCaminho(caminho) {
  const caminhoNormalizado = path.normalize(caminho);
  const segmentos = caminhoNormalizado.split(path.sep);
  const nomeArquivo = path.basename(caminho);
  
  // Ignorar se qualquer segmento está na lista de ignorados
  const temSegmentoIgnorado = segmentos.some((segmento) => ignorar.includes(segmento));
  
  // Ignorar arquivos específicos
  const arquivoIgnorado = arquivosIgnorar.includes(nomeArquivo);
  
  return temSegmentoIgnorado || arquivoIgnorado;
}

function getFileIcon(caminho, stats) {
  if (stats.isDirectory()) {
    const nome = path.basename(caminho).toLowerCase();
    if (nome === 'src') return '📂';
    if (nome === 'components') return '🧩';
    if (nome === 'pages') return '📄';
    if (nome === 'services') return '⚙️';
    if (nome === 'hooks') return '🎣';
    if (nome === 'utils') return '🔧';
    if (nome === 'assets') return '🖼️';
    if (nome === 'public') return '🌐';
    if (nome === 'scripts') return '📜';
    if (nome === 'data') return '💾';
    if (nome === 'nginx') return '🌐';
    return '📁';
  }
  
  const ext = path.extname(caminho).toLowerCase();
  const nome = path.basename(caminho).toLowerCase();
  
  // Arquivos específicos
  if (nome === 'package.json') return '📦';
  if (nome === 'dockerfile' || nome.startsWith('dockerfile.')) return '🐳';
  if (nome === 'docker-compose.yml' || nome.includes('docker-compose')) return '🐙';
  if (nome === 'readme.md') return '📖';
  if (nome === 'tsconfig.json') return '🔧';
  if (nome === 'vite.config.ts') return '⚡';
  if (nome === 'tailwind.config.js') return '🎨';
  if (nome === 'nginx.conf') return '🌐';
  
  // Por extensão
  switch (ext) {
    case '.ts': case '.tsx': return '🔷';
    case '.js': case '.jsx': return '🟨';
    case '.json': return '📋';
    case '.md': return '📝';
    case '.yml': case '.yaml': return '⚙️';
    case '.sql': return '🗃️';
    case '.sh': return '📜';
    case '.env': return '🔐';
    case '.txt': return '📄';
    case '.pdf': return '📕';
    case '.png': case '.jpg': case '.jpeg': case '.gif': case '.svg': return '🖼️';
    case '.css': case '.scss': case '.sass': return '🎨';
    case '.html': return '🌐';
    default: return '📄';
  }
}

function listar(diretorio, prefixo = '', nivel = 0, nivelMax = 4) {
  if (nivel > nivelMax || deveIgnorarCaminho(diretorio)) {
    return;
  }

  let itens;
  try {
    itens = fs.readdirSync(diretorio);
  } catch (err) {
    console.error(`❌ Erro ao ler o diretório ${diretorio}: ${err.message}`);
    return;
  }

  // Filtrar itens ignorados antes de ordenar
  itens = itens.filter(item => {
    const caminho = path.join(diretorio, item);
    return !item.startsWith('.') && !deveIgnorarCaminho(caminho);
  });

  // Ordenar itens: diretórios primeiro, depois arquivos
  itens.sort((a, b) => {
    const caminhoA = path.join(diretorio, a);
    const caminhoB = path.join(diretorio, b);
    
    try {
      const statsA = fs.statSync(caminhoA);
      const statsB = fs.statSync(caminhoB);
      
      if (statsA.isDirectory() && !statsB.isDirectory()) return -1;
      if (!statsA.isDirectory() && statsB.isDirectory()) return 1;
      return a.localeCompare(b);
    } catch {
      return a.localeCompare(b);
    }
  });

  for (let i = 0; i < itens.length; i++) {
    const item = itens[i];
    const caminho = path.join(diretorio, item);
    const isLast = i === itens.length - 1;
    
    let stats;
    try {
      stats = fs.statSync(caminho);
    } catch (err) {
      console.error(`❌ Erro ao obter estatísticas para ${caminho}: ${err.message}`);
      continue;
    }

    // Usar diferentes símbolos para último item
    const connector = isLast ? '└── ' : '├── ';
    const nextPrefix = isLast ? '    ' : '│   ';
    
    // Adicionar emoji baseado no tipo de arquivo
    const icon = getFileIcon(caminho, stats);
    
    console.log(prefixo + connector + icon + ' ' + item);

    if (stats.isDirectory()) {
      listar(caminho, prefixo + nextPrefix, nivel + 1, nivelMax);
    }
  }
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
let nivelMax = 4; // Padrão aumentado para 4
let diretorio = '.';
let filtro = null;

// Processar argumentos
args.forEach((arg, index) => {
  if (arg === '--levels' || arg === '-l') {
    nivelMax = parseInt(args[index + 1]) || 4;
  } else if (arg === '--dir' || arg === '-d') {
    diretorio = args[index + 1] || '.';
  } else if (arg === '--filter' || arg === '-f') {
    filtro = args[index + 1];
  } else if (!isNaN(parseInt(arg)) && index === 0) {
    nivelMax = parseInt(arg);
  } else if (index === 1 && !args[index - 1].startsWith('-')) {
    diretorio = arg;
  }
});

console.log(`🌳 Estrutura do projeto (máximo ${nivelMax} níveis):`);
console.log(`📍 Diretório: ${path.resolve(diretorio)}`);
if (filtro) console.log(`🔍 Filtro: ${filtro}`);
console.log('');

const rootName = path.basename(path.resolve(diretorio));
console.log('📁 ' + rootName);

listar(diretorio, '', 0, nivelMax);

console.log('');
console.log('💡 Dicas de uso:');
console.log('  node listar-arquivos.js 5           # 5 níveis');
console.log('  node listar-arquivos.js 3 apps      # 3 níveis na pasta apps');
console.log('  node listar-arquivos.js --levels 6  # 6 níveis');
console.log('  node listar-arquivos.js --dir apps/frontend --levels 5');