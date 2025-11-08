import React from 'react';
import { Link } from 'react-router-dom';
import { Info, CheckCircle2, Clock, Filter, Edit3, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="text-gray-100">
      {/* Container central com espaçamento equilibrado (Layout aplica 10px do header/aside) */}
      <div className="mx-auto w-full max-w-4xl space-y-4">
        {/* Título e ações */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Bem-vindo ao Controle de Horários</h1>
            <p className="text-sm text-gray-300">Entenda rapidamente como usar a ferramenta de gestão</p>
          </div>
          <div className="flex gap-2">
            <Link to="/controle-horarios" className="inline-flex items-center gap-2 rounded-md bg-yellow-400 px-3 py-2 text-sm text-gray-900 hover:bg-yellow-300 transition-colors">
              <Clock className="h-4 w-4" /> Abrir Controle de Horários
            </Link>
            <Link to="/instrucoes" className="inline-flex items-center gap-2 rounded-md border border-yellow-400/40 px-3 py-2 text-sm text-yellow-300 hover:bg-yellow-400/10 transition-colors">
              <Info className="h-4 w-4" /> Instruções
            </Link>
          </div>
        </div>

        {/* Como usar os filtros */}
        <div className="rounded-xl border border-yellow-400/20 bg-gray-900/60 p-[10px]">
          <h2 className="text-base font-semibold text-yellow-300 mb-2">Como usar os filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
            <div>
              <p className="font-medium text-gray-200">Data de referência</p>
              <p>Selecione a data do dia que deseja analisar.</p>
            </div>
            <div>
              <p className="font-medium text-gray-200">Linha e Serviço</p>
              <p>Use código da linha e do serviço para focar a operação.</p>
            </div>
            <div>
              <p className="font-medium text-gray-200">Sentido</p>
              <p>IDA, VOLTA ou CIRCULAR, conforme aplicável à linha.</p>
            </div>
            <div>
              <p className="font-medium text-gray-200">Setor</p>
              <p>Filtre pelo setor/terminal responsável.</p>
            </div>
            <div>
              <p className="font-medium text-gray-200">Origem/Destino</p>
              <p>Pesquise por texto (ex.: “Terminal”, “Centro”).</p>
            </div>
            <div>
              <p className="font-medium text-gray-200">Equipe</p>
              <p>Busque por motorista/cobrador (nome) para localizar viagens.</p>
            </div>
            <div>
              <p className="font-medium text-gray-200">Atividade</p>
              <p>Filtre por código/nome de atividade, se necessário.</p>
            </div>
            <div>
              <p className="font-medium text-gray-200">Tipo de dia</p>
              <p>Utilize (ex.: “Útil”, “Sábado”, “Domingo”) para contexto.</p>
            </div>
          </div>
        </div>

        {/* Fluxo recomendado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-yellow-400/20 bg-gray-900/60 p-[10px]">
            <div className="flex items-center gap-2 text-yellow-300 mb-1">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">1. Aplique filtros</h3>
            </div>
            <p className="text-sm text-gray-300">Selecione data, linha/serviço e sentido para localizar as viagens.</p>
          </div>
          <div className="rounded-xl border border-yellow-400/20 bg-gray-900/60 p-[10px]">
            <div className="flex items-center gap-2 text-yellow-300 mb-1">
              <Edit3 className="h-4 w-4" />
              <h3 className="font-semibold">2. Edite a viagem</h3>
            </div>
            <p className="text-sm text-gray-300">Atualize veículo, motorista e cobrador quando necessário.</p>
          </div>
          <div className="rounded-xl border border-yellow-400/20 bg-gray-900/60 p-[10px]">
            <div className="flex items-center gap-2 text-yellow-300 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <h3 className="font-semibold">3. Propagação “para frente”</h3>
            </div>
            <p className="text-sm text-gray-300">A edição vale para a âncora e as próximas do mesmo dia/linha/serviço/sentido.</p>
          </div>
          <div className="rounded-xl border border-yellow-400/20 bg-gray-900/60 p-[10px]">
            <div className="flex items-center gap-2 text-yellow-300 mb-1">
              <Users className="h-4 w-4" />
              <h3 className="font-semibold">4. Auditoria</h3>
            </div>
            <p className="text-sm text-gray-300">Cada alteração registra quem editou e quando (rastreabilidade).</p>
          </div>
        </div>

        {/* Boas práticas e recursos */}
        <div className="grid grid-cols-1 custom-md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-yellow-400/20 bg-gray-900/60 p-[10px]">
            <h3 className="text-sm font-semibold text-yellow-300 mb-1">Boas práticas</h3>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>Valide filtros antes de grandes períodos.</li>
              <li>Use atualização em lote para várias mudanças.</li>
              <li>Confira mensagens de sucesso/erro.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-yellow-400/20 bg-gray-900/60 p-[10px]">
            <h3 className="text-sm font-semibold text-yellow-300 mb-1">Dicas</h3>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>Busca por linha/serviço ajuda no foco.</li>
              <li>Ancore na viagem correta antes de editar.</li>
              <li>Verifique o sentido (ida/volta).</li>
            </ul>
          </div>
          <div className="rounded-xl border border-yellow-400/20 bg-gray-900/60 p-[10px]">
            <h3 className="text-sm font-semibold text-yellow-300 mb-1">Recursos</h3>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li><Link to="/instrucoes" className="text-yellow-300 hover:text-yellow-200">Instruções detalhadas</Link></li>
              <li>Suporte interno e treinamento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

