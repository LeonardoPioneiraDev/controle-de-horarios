-- Criação da tabela de itens detalhados
CREATE TABLE IF NOT EXISTS bco_alteracoes_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_referencia DATE NOT NULL,
  idbco INTEGER NOT NULL,
  documento VARCHAR(50) NOT NULL,
  log_alteracao VARCHAR(255),
  log_alteracao_frq VARCHAR(255),
  data_bco DATE NOT NULL,
  data_digitacao DATE,
  digitador VARCHAR(100),
  prefixo_veic VARCHAR(20),
  alterada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ux_bco_itens_data_idbco UNIQUE (data_referencia, idbco)
);

-- Índice para performance na listagem
CREATE INDEX IF NOT EXISTS idx_bco_itens_data_alterada ON bco_alteracoes_itens (data_referencia, alterada);

-- Criação da tabela de resumo
CREATE TABLE IF NOT EXISTS bco_alteracoes_resumo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_referencia DATE NOT NULL,
  total_documentos INTEGER NOT NULL,
  total_alteradas INTEGER NOT NULL,
  total_pendentes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ux_bco_resumo_data UNIQUE (data_referencia)
);
