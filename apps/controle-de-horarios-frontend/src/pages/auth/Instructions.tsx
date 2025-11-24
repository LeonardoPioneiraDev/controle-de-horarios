import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { PlayCircle, Info, CheckCircle2, ArrowLeft, Sun, Moon } from 'lucide-react';

const VIDEO_URL = (import.meta as any).env?.VITE_INSTRUCOES_VIDEO_URL ||
  'https://www.youtube.com/embed/dQw4w9WgXcQ';

const Instructions: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#fffdf5] via-[#fef0d4] to-[#feeccc] text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-neutral-900 dark:text-gray-100 transition-colors duration-500">
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          {/* Header Responsivo */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Instruções de Uso</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Controle de Horários — Ferramenta de gestão</p>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto bg-white/50 dark:bg-gray-800/50 md:bg-transparent md:dark:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none border md:border-none border-white/20 dark:border-gray-700">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#a89642] hover:text-[#c7cd69] dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors px-2">
                <ArrowLeft className="h-4 w-4" /> <span className="hidden xs:inline">Voltar ao login</span><span className="xs:hidden">Voltar</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-3 rounded-full bg-gray-100/50 hover:bg-gray-100/80 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/25 border border-gray-200/50 dark:border-yellow-400/20 shadow-sm hover:shadow-md dark:shadow-sm dark:hover:shadow-md transition-all duration-500 group hover:scale-110"
                aria-label={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
                title={`Clique para alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-[#c7cd69] dark:text-yellow-300 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-500 group-hover:text-[#c7cd69] dark:text-yellow-300 group-hover:-rotate-[30deg] transition-transform duration-500" />
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#fbcc2c]/45 via-[#e6cd4a]/40 to-[#ecd43c]/45 dark:from-yellow-400/30 dark:via-amber-500/25 dark:to-yellow-300/30 opacity-60 dark:opacity-100 blur-xl group-hover:opacity-80 transition-opacity duration-500" />
            <div className="relative rounded-2xl border border-white/20 dark:border-yellow-400/20 bg-white/80 dark:bg-gray-900/70 backdrop-blur-lg dark:backdrop-blur p-4 sm:p-6 shadow-xl shadow-yellow-600/10 dark:shadow-[0_0_40px_rgba(251,191,36,0.12)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bloco Vídeo */}
                <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-800/50">
                    <PlayCircle className="h-5 w-5 text-[#fbcc2c] dark:text-yellow-400" />
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white">Vídeo de Apresentação</h2>
                  </div>
                  <div className="p-4">
                    <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black aspect-video shadow-inner">
                      <iframe
                        className="w-full h-full"
                        src={VIDEO_URL}
                        title="Instruções — Controle de Horários"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="mt-3 text-[11px] text-center text-gray-500 dark:text-gray-500">
                      Assista ao vídeo para entender o fluxo completo de operação.
                    </p>
                  </div>
                </section>

                {/* Bloco Sobre */}
                <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900 flex flex-col">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-800/50">
                    <Info className="h-5 w-5 text-[#fbcc2c] dark:text-yellow-400" />
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white">Sobre o Sistema</h2>
                  </div>
                  <div className="p-4 space-y-4 text-sm text-gray-600 dark:text-gray-300 flex-1">
                    <p className="leading-relaxed">
                      O Controle de Horários centraliza a gestão operacional de viagens, permitindo consulta e edição com
                      propagação de alterações “para frente” (ex.: troca de veículo, motorista e cobrador), com registros
                      auditáveis.
                    </p>
                    <ul className="space-y-3 mt-2">
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 min-w-[16px]">
                          <CheckCircle2 className="h-4 w-4 text-[#e6cd4a] dark:text-yellow-400" />
                        </div>
                        <span>Filtros por data, linha, serviço, setor e sentido</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 min-w-[16px]">
                          <CheckCircle2 className="h-4 w-4 text-[#e6cd4a] dark:text-yellow-400" />
                        </div>
                        <span>Propagação a partir da viagem âncora (somente futuras no dia)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 min-w-[16px]">
                          <CheckCircle2 className="h-4 w-4 text-[#e6cd4a] dark:text-yellow-400" />
                        </div>
                        <span>Histórico de edição (quem alterou e quando)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-0.5 min-w-[16px]">
                          <CheckCircle2 className="h-4 w-4 text-[#e6cd4a] dark:text-yellow-400" />
                        </div>
                        <span>Integração com fontes de dados (Oracle/Globus)</span>
                      </li>
                    </ul>
                  </div>
                </section>
              </div>

              {/* Cards inferiores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900 p-4 sm:p-5 hover:bg-white/90 dark:hover:bg-gray-800 transition-colors">
                  <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fbcc2c] dark:bg-yellow-400"></span>
                    Fluxos Principais
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                      Login e recuperação de senha
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                      Consulta de viagens e aplicação de filtros
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                      Propagação de alterações (veículo, motorista)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                      Relatórios e análises
                    </li>
                  </ul>
                </section>
                <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900 p-4 sm:p-5 hover:bg-white/90 dark:hover:bg-gray-800 transition-colors">
                  <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Boas Práticas
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                      Valide filtros antes de buscar grandes períodos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                      Prefira atualizações em lote para múltiplas alterações
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                      Revise feedbacks de sucesso/erro
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">© 2025 Viação Pioneira Ltda.</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600">Versão 1.0.0 • Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
