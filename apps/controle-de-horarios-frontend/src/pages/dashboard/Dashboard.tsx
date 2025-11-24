import React from 'react';
import { Link } from 'react-router-dom';
import { Info, CheckCircle2, Clock, Filter, Edit3, Users } from 'lucide-react';
import { Card } from '../../components/ui/card';

const Dashboard: React.FC = () => {
  return (
    <div className="p-4 sm:p-8">
      {/* Container central com espaçamento equilibrado */}
      <div className="mx-auto w-full max-w-5xl space-y-8">

        {/* Título e ações */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#fbcc2c]/20 dark:border-yellow-500/20 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#6b5d1a] via-[#7d6b1e] to-[#6b5d1a] dark:from-gray-100 dark:via-white dark:to-gray-100 bg-clip-text text-transparent mb-2">
              Bem-vindo ao Controle de Horários
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Entenda rapidamente como usar a ferramenta de gestão
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/controle-horarios"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fbcc2c] to-[#ecd43c] hover:from-[#e6cd4a] hover:to-[#d4cc54] dark:from-yellow-600 dark:to-amber-600 dark:hover:from-yellow-500 dark:hover:to-amber-500 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Clock className="h-4 w-4" /> Abrir Controle
            </Link>
            <Link
              to="/instrucoes"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#fbcc2c]/50 dark:border-yellow-500/30 px-5 py-2.5 text-sm font-semibold text-[#6b5d1a] dark:text-yellow-400 hover:bg-[#fbcc2c]/10 dark:hover:bg-yellow-500/10 transition-all duration-300"
            >
              <Info className="h-4 w-4" /> Instruções
            </Link>
          </div>
        </div>

        {/* Como usar os filtros */}
        <Card className="overflow-hidden border-none shadow-xl shadow-yellow-900/5 dark:shadow-black/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
          <div className="bg-[#fbcc2c]/10 dark:bg-yellow-500/10 p-4 border-b border-[#fbcc2c]/20 dark:border-yellow-500/20">
            <h2 className="text-lg font-bold text-[#6b5d1a] dark:text-yellow-400 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Como usar os filtros
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Data de referência', desc: 'Selecione a data do dia que deseja analisar.' },
              { title: 'Linha e Serviço', desc: 'Use código da linha e do serviço para focar a operação.' },
              { title: 'Sentido', desc: 'IDA, VOLTA ou CIRCULAR, conforme aplicável à linha.' },
              { title: 'Setor', desc: 'Filtre pelo setor/terminal responsável.' },
              { title: 'Origem/Destino', desc: 'Pesquise por texto (ex.: “Terminal”, “Centro”).' },
              { title: 'Equipe', desc: 'Busque por motorista/cobrador (nome) para localizar viagens.' },
              { title: 'Atividade', desc: 'Filtre por código/nome de atividade, se necessário.' },
              { title: 'Tipo de dia', desc: 'Utilize (ex.: “Útil”, “Sábado”) para contexto.' }
            ].map((item, idx) => (
              <div key={idx} className="group p-3 rounded-lg hover:bg-[#fbcc2c]/5 dark:hover:bg-yellow-500/5 transition-colors">
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1 group-hover:text-[#6b5d1a] dark:group-hover:text-yellow-400 transition-colors">{item.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Fluxo recomendado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Filter, title: '1. Aplique filtros', desc: 'Selecione data, linha/serviço e sentido para localizar as viagens.' },
            { icon: Edit3, title: '2. Edite a viagem', desc: 'Atualize veículo, motorista e cobrador quando necessário.' },
            { icon: CheckCircle2, title: '3. Propagação “para frente”', desc: 'A edição vale para a âncora e as próximas do mesmo dia/linha/serviço.' },
            { icon: Users, title: '4. Auditoria', desc: 'Cada alteração registra quem editou e quando (rastreabilidade).' }
          ].map((item, idx) => (
            <Card key={idx} className="group border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md overflow-hidden">
              <div className="p-6 flex gap-4 items-start">
                <div className="p-3 rounded-xl bg-[#fbcc2c]/20 dark:bg-yellow-500/20 text-[#6b5d1a] dark:text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Boas práticas e recursos */}
        <div className="grid grid-cols-1 custom-md:grid-cols-3 gap-6">
          {[
            { title: 'Boas práticas', items: ['Valide filtros antes de grandes períodos.', 'Use atualização em lote para várias mudanças.', 'Confira mensagens de sucesso/erro.'] },
            { title: 'Dicas', items: ['Busca por linha/serviço ajuda no foco.', 'Ancore na viagem correta antes de editar.', 'Verifique o sentido (ida/volta).'] },
            { title: 'Recursos', items: ['Instruções detalhadas', 'Suporte interno e treinamento'], link: true }
          ].map((section, idx) => (
            <Card key={idx} className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6">
              <h3 className="text-base font-bold text-[#6b5d1a] dark:text-yellow-400 mb-4 uppercase tracking-wide text-xs">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#fbcc2c] dark:bg-yellow-500 flex-shrink-0" />
                    {section.link && i === 0 ? (
                      <Link to="/instrucoes" className="hover:text-[#6b5d1a] dark:hover:text-yellow-400 hover:underline transition-colors">
                        {item}
                      </Link>
                    ) : (
                      <span>{item}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
