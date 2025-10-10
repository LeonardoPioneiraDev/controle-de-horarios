-- ==========================================
-- 🗄️ INICIALIZAÇÃO DO BANCO CONTROLE DE HORÁRIOS
-- ==========================================

-- Criar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar timezone para Brasil
SET timezone = 'America/Sao_Paulo';

-- Configurar encoding
SET client_encoding = 'UTF8';

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Recarregar configurações
SELECT pg_reload_conf();

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Comentários
COMMENT ON DATABASE controle_horarios_db IS 'Sistema de Controle de Horários - Database Principal';
COMMENT ON SCHEMA public IS 'Schema principal do sistema';

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Database Controle de Horários inicializado com sucesso!';
    RAISE NOTICE 'Timezone: %', current_setting('timezone');
    RAISE NOTICE 'Encoding: %', current_setting('server_encoding');
END $$;