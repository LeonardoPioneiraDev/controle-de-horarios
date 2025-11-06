import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Info, CheckCircle2, ArrowLeft } from 'lucide-react';

const VIDEO_URL = (import.meta as any).env?.VITE_INSTRUCOES_VIDEO_URL ||
  'https://www.youtube.com/embed/dQw4w9WgXcQ'; // substitua pela URL do seu vídeo

const Instructions: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-neutral-900 to-yellow-950 text-gray-100">
      <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Instruções de Uso</h1>
              <p className="text-sm text-gray-400 mt-1">Controle de Horários — Ferramenta de gestão</p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300">
              <ArrowLeft className="h-4 w-4" /> Voltar ao login
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-amber-500/25 to-yellow-300/30 blur-md" />
            <div className="relative rounded-2xl border border-yellow-400/20 bg-gray-900/70 backdrop-blur p-5 shadow-[0_0_40px_rgba(251,191,36,0.12)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bloco Vídeo */}
                <section className="rounded-lg border border-gray-700 bg-gray-900">
                  <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-base font-semibold">Vídeo de Apresentação</h2>
                  </div>
                  <div className="p-4">
                    <div className="rounded-md overflow-hidden border border-gray-700 bg-black aspect-video">
                      <iframe
                        className="w-full h-full"
                        src={VIDEO_URL}
                        title="Instruções — Controle de Horários"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500">Defina VITE_INSTRUCOES_VIDEO_URL no .env para usar seu próprio vídeo.</p>
                  </div>
                </section>

                {/* Bloco Sobre */}
                <section className="rounded-lg border border-gray-700 bg-gray-900">
                  <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                    <Info className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-base font-semibold">Sobre o Sistema</h2>
                  </div>
                  <div className="p-4 space-y-4 text-sm text-gray-300">
                    <p>
                      O Controle de Horários centraliza a gestão operacional de viagens, permitindo consulta e edição com
                      propagação de alterações “para frente” (ex.: troca de veículo, motorista e cobrador), com registros
                      auditáveis.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <span>Filtros por data, linha, serviço, setor e sentido</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <span>Propagação a partir da viagem âncora (somente futuras no dia)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <span>Histórico de edição (quem alterou e quando)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <span>Integração com fontes de dados (Oracle/Globus)</span>
                      </li>
                    </ul>
                  </div>
                </section>
              </div>

              {/* Cards inferiores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <section className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                  <h3 className="text-base font-semibold mb-2">Fluxos Principais</h3>
                  <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                    <li>Login e recuperação de senha</li>
                    <li>Consulta de viagens e aplicação de filtros</li>
                    <li>Propagação de alterações (veículo, motorista, cobrador)</li>
                    <li>Relatórios e análises (quando aplicável)</li>
                  </ul>
                </section>
                <section className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                  <h3 className="text-base font-semibold mb-2">Boas Práticas</h3>
                  <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                    <li>Valide filtros antes de buscar grandes períodos</li>
                    <li>Prefira atualizações em lote quando fizer múltiplas alterações</li>
                    <li>Revise feedbacks de sucesso/erro e confira resultados</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            © 2025 Viação Pioneira Ltda. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
