#!/bin/bash

# ==========================================
# 🚀 SCRIPT DE TESTE - VIAGENS TRANSDATA API
# ✅ USANDO ROLES ORIGINAIS (OPERADOR = NÍVEL 1)
# ==========================================

# ✅ Token atualizado
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imxlb25hcmRvbG9wZXNAdnBpb25laXJhLmNvbS5iciIsInN1YiI6Ijk2NjUyYTQxLTliN2ItNDE1My1hNzUzLWVmNWU1MzE1ODc0OCIsInJvbGUiOiJhZG1pbmlzdHJhZG9yIiwiZmlyc3ROYW1lIjoiTEVPTkFSRE8iLCJsYXN0TmFtZSI6IkJPUkdFUyIsImlhdCI6MTc2MDEyMTY3OCwiZXhwIjoxNzYwMjA4MDc4fQ.yVj6UZz2-YpErDlXtRgDHy6sVTt_uQhoskwnGYseeSU"

BASE_URL="http://localhost:3355/api"
DATA_TESTE="2025-10-10"

echo "🚀 =========================================="
echo "🚀 TESTANDO API VIAGENS TRANSDATA"
echo "✅ USANDO ROLES ORIGINAIS"
echo "🚀 =========================================="
echo "📅 Data de teste: $DATA_TESTE"
echo "👤 Usuário: LEONARDO BORGES (administrador)"
echo "🔑 Roles disponíveis:"
echo "   • ADMINISTRADOR (5) - Acesso total"
echo "   • DIRETOR (4) - Gestão geral"
echo "   • GERENTE (3) - Gestão departamental"
echo "   • ANALISTA (2) - Operações avançadas"
echo "   • OPERADOR (1) - Operações básicas"
echo "🚀 =========================================="
echo ""

# ==========================================
# 0️⃣ VERIFICAR AUTENTICAÇÃO
# ==========================================
echo "0️⃣ 🔐 VERIFICANDO AUTENTICAÇÃO..."
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n📊 Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s | head -c 200
echo ""
echo "✅ Verificação de autenticação concluída!"
echo ""

# ==========================================
# 1️⃣ TESTE DE CONEXÃO (REQUER GERENTE)
# ==========================================
echo "1️⃣ 🔧 TESTANDO CONEXÃO COM API TRANSDATA..."
echo "🔑 Permissão necessária: GERENTE ou superior"
curl -X GET "$BASE_URL/viagens-transdata/api/teste-conexao" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n📊 Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s
echo ""
echo "✅ Teste de conexão concluído!"
echo ""

# ==========================================
# 2️⃣ STATUS DOS DADOS (REQUER OPERADOR)
# ==========================================
echo "2️⃣ 📊 VERIFICANDO STATUS DOS DADOS..."
echo "🔑 Permissão necessária: OPERADOR ou superior"
curl -X GET "$BASE_URL/viagens-transdata/$DATA_TESTE/status" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n📊 Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s
echo ""
echo "✅ Verificação de status concluída!"
echo ""

# ==========================================
# 3️⃣ BUSCAR VIAGENS (REQUER OPERADOR)
# ==========================================
echo "3️⃣ 🔄 BUSCANDO VIAGENS..."
echo "�� Permissão necessária: OPERADOR ou superior"
echo "⚠️  Esta operação pode demorar alguns segundos..."
curl -X GET "$BASE_URL/viagens-transdata/$DATA_TESTE" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n�� Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s | head -c 300
echo ""
echo "✅ Busca de viagens concluída!"
echo ""

# ==========================================
# 4️⃣ CÓDIGOS DE LINHA (REQUER OPERADOR)
# ==========================================
echo "4️⃣ 📋 OBTENDO CÓDIGOS DE LINHA..."
echo "🔑 Permissão necessária: OPERADOR ou superior"
curl -X GET "$BASE_URL/viagens-transdata/$DATA_TESTE/linhas" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n📊 Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s
echo ""
echo "✅ Códigos de linha obtidos!"
echo ""

# ==========================================
# 5️⃣ SERVIÇOS ÚNICOS (REQUER OPERADOR)
# ==========================================
echo "5️⃣ 🚌 OBTENDO SERVIÇOS ÚNICOS..."
echo "🔑 Permissão necessária: OPERADOR ou superior"
curl -X GET "$BASE_URL/viagens-transdata/$DATA_TESTE/servicos" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n�� Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s
echo ""
echo "✅ Serviços únicos obtidos!"
echo ""

# ==========================================
# 6️⃣ FILTROS (REQUER OPERADOR)
# ==========================================
echo "6️⃣ 🔍 BUSCANDO VIAGENS COM FILTRO..."
echo "�� Permissão necessária: OPERADOR ou superior"
curl -X GET "$BASE_URL/viagens-transdata/$DATA_TESTE/filtrados?sentido=IDA&limit=3" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n📊 Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s | head -c 300
echo ""
echo "✅ Filtros testados!"
echo ""

# ==========================================
# 7️⃣ SINCRONIZAÇÃO MANUAL (REQUER ANALISTA)
# ==========================================
echo "7️⃣ 🔄 TESTANDO SINCRONIZAÇÃO MANUAL..."
echo "🔑 Permissão necessária: ANALISTA ou superior"
curl -X POST "$BASE_URL/viagens-transdata/sincronizar/$DATA_TESTE" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n📊 Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s
echo ""
echo "✅ Sincronização manual testada!"
echo ""

# ==========================================
# 8️⃣ ESTATÍSTICAS DA API (REQUER GERENTE)
# ==========================================
echo "8️⃣ 📊 OBTENDO ESTATÍSTICAS DA API..."
echo "🔑 Permissão necessária: GERENTE ou superior"
curl -X GET "$BASE_URL/viagens-transdata/api/estatisticas" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n📊 Status: %{http_code} | Tempo: %{time_total}s\n" \
  -s
echo ""
echo "✅ Estatísticas obtidas!"
echo ""

# ==========================================
# 🎯 RESUMO FINAL
# ==========================================
echo "🎯 =========================================="
echo "🎯 RESUMO DOS TESTES"
echo "🎯 =========================================="
echo "✅ 0. Verificação de autenticação"
echo "✅ 1. Conexão API (GERENTE+)"
echo "✅ 2. Status dados (OPERADOR+)"
echo "✅ 3. Buscar viagens (OPERADOR+)"
echo "✅ 4. Códigos linha (OPERADOR+)"
echo "✅ 5. Serviços únicos (OPERADOR+)"
echo "✅ 6. Filtros (OPERADOR+)"
echo "✅ 7. Sincronização (ANALISTA+)"
echo "✅ 8. Estatísticas API (GERENTE+)"
echo "🎯 =========================================="
echo "🚀 TODOS OS TESTES CONCLUÍDOS!"
echo "🔑 USANDO HIERARQUIA ORIGINAL DE ROLES"
echo "🎯 =========================================="