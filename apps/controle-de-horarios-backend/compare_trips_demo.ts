import { normalizeTransDataTrip, normalizeGlobusTrip, compareTrips, OracleGlobusData } from './src/comparacao-viagens/utils/trip-comparator.util';
import { CombinacaoComparacao } from './src/comparacao-viagens/entities/comparacao-viagem.entity';

const transDataTrip1 = {
    "SentidoText": "IDA",
    "InicioPrevistoText": "15:40:00",
    "InicioRealizadoText": "16:01:50",
    "FimPrevistoText": "16:55:00",
    "FimRealizadoText": "17:07:44",
    "PrefixoPrevisto": "-",
    "PrefixoRealizado": "234681",
    "NomePI": "Terminal Paranoá",
    "NomePF": "Rodoviária do Plano Piloto",
    "Servico": 3,
    "Trajeto": "Paranoá x Rodoviária",
    "NomeMotorista": "JOSE MARIA ALVES DA SILVA",
    "MatriculaMotorista": "1296752/GDF 025498",
    "NomeCobrador": "WENDELL DA SILVA OLIVEIRA",
    "MatriculaCobrador": " 026360/GDF 1412779",
    "ParadasLbl": "Paradas",
    "Link1Text": "/Report/Parser/?id=323&DataInicio=2025-10-26&Hora_DataInicio=16:01:50&DataFim=2025-10-26&Hora_DataFim=17:07:44&IdLinha=67&Prefixo=234681&IdTurno=942&IdCarro=12383&IdViagem=1",
    "HistoricoLbl": "Histórico",
    "Link2Text": "/History/Map/?DataInicio=26/10/2025&Hora_DataInicio=16:01:50&DataFim=26/10/2025&Hora_DataFim=17:11:10&Prefixo=234681&IdTrajeto=1&IdLinha=67&Sentido=1&Consolidada=0",
    "ParcialmenteCumprida": 0,
    "NaoCumprida": 0,
    "ForadoHorarioInicio": 1,
    "ForadoHorarioFim": 0,
    "AtrasadoInicio": 1,
    "AtrasadoFim": 0,
    "AdiantadoInicio": 0,
    "AdiantadoFim": 0,
    "NaoCumpridoInicio": 0,
    "NaoCumpridoFim": 0,
    "IdLinha": 67,
    "NomeLinha": "100.2 - Paranoá (Paranoá Parque) / Rod. Plano Piloto (L2 Sul)",
    "InicioPrevisto": "26/10/2025 15:40:00",
    "InicioRealizado": "26/10/2025 16:01:50",
    "StatusInicio": 2,
    "FimPrevisto": "26/10/2025 16:55:00",
    "FimRealizado": "26/10/2025 17:07:44",
    "StatusFim": 1,
    "Sentido": true,
    "Viagem": 4,
    "PontosCumpridosPercentual": "100,00",
    "PontoFinal": "Automático",
    "ValidouPontosCumpridos": 0,
    "KMProgramado": "",
    "KMRodado": "",
    "Consolidad": 0
};

const transDataTrip2 = {
    "SentidoText": "VOLTA",
    "InicioPrevistoText": "15:40:00",
    "InicioRealizadoText": "15:51:16",
    "FimPrevistoText": "17:25:00",
    "FimRealizadoText": "17:11:10",
    "PrefixoPrevisto": "-",
    "PrefixoRealizado": "235466",
    "NomePI": "R.P.P",
    "NomePF": "Terminal Paranoá",
    "Servico": 8,
    "Trajeto": " ITAPOÃ / PARANOÁ / LAGO SUL (PONTE DAS GARÇAS) / W3 SUL / RODOVIÁRIA DO PLANO P",
    "NomeMotorista": "ADELVAIR DOS SANTOS ALMEIDA",
    "MatriculaMotorista": "026546/GDF 1520840",
    "NomeCobrador": "CAIO DE SOUSA OLIVEIRA",
    "MatriculaCobrador": "025555 / GDF 1338083",
    "ParadasLbl": "Paradas",
    "Link1Text": "/Report/Parser/?id=323&DataInicio=2025-10-26&Hora_DataInicio=15:51:16&DataFim=2025-10-26&Hora_DataFim=17:11:10&IdLinha=1699&Prefixo=235466&IdTurno=790&IdCarro=12374&IdViagem=2",
    "HistoricoLbl": "Histórico",
    "Link2Text": "/History/Map/?DataInicio=26/10/2025&Hora_DataInicio=15:51:16&DataFim=26/10/2025&Hora_DataFim=17:11:10&Prefixo=235466&IdTrajeto=1&IdLinha=1699&Sentido=0&Consolidada=0",
    "ParcialmenteCumprida": 0,
    "NaoCumprida": 0,
    "ForadoHorarioInicio": 0,
    "ForadoHorarioFim": 1,
    "AtrasadoInicio": 0,
    "AtrasadoFim": 0,
    "AdiantadoInicio": 0,
    "AdiantadoFim": 1,
    "NaoCumpridoInicio": 0,
    "NaoCumpridoFim": 0,
    "IdLinha": 1699,
    "NomeLinha": "765.2 - ITAPOÃ / PARANOÁ / LAGO SUL (PONTE DAS GARÇAS) / W3 SUL / RODOVIÁRIA DO PLANO PILOTO",
    "InicioPrevisto": "26/10/2025 15:40:00",
    "InicioRealizado": "26/10/2025 15:51:16",
    "StatusInicio": 1,
    "FimPrevisto": "26/10/2025 17:25:00",
    "FimRealizado": "26/10/2025 17:11:10",
    "StatusFim": 3,
    "Sentido": false,
    "Viagem": 2,
    "PontosCumpridosPercentual": "100,00",
    "PontoFinal": "Automático",
    "ValidouPontosCumpridos": 0,
    "KMProgramado": "",
    "KMRodado": "",
    "Consolidad": 0
};

// ✅ DADOS ORACLE GLOBUS com tipagem correta
const globusTrip1: OracleGlobusData = {
    "SETOR_PRINCIPAL_LINHA": "GAMA",
    "COD_LOCAL_TERMINAL_SEC": "7000",
    "CODIGOLINHA": "0026",
    "NOMELINHA": "PARK WAY (LADO OESTE) / QD 26 E 27",
    "FLG_SENTIDO": "C",
    "DATA_VIAGEM": "26-AUG-2025",
    "HOR_SAIDA": "01/01/1900 06:07:01",
    "HOR_CHEGADA": "01/01/1900 07:20:01",
    "COD_LOCALIDADE": "40",
    "LOCAL_ORIGEM_VIAGEM": "FLORICULTURA",
    "COD_SERVICO_COMPLETO": "PW01M",
    "COD_SERVICO_NUMERO": "01",
    "COD_MOTORISTA": "16029",
    "NOME_MOTORISTA": "ALBERTO DOS SANTOS",
    "COD_COBRADOR": "",
    "NOME_COBRADOR": "",
    "TOTAL_HORARIOS": "4"
};

const globusTrip2: OracleGlobusData = {
    "SETOR_PRINCIPAL_LINHA": "GAMA",
    "COD_LOCAL_TERMINAL_SEC": "7000",
    "CODIGOLINHA": "0026",
    "NOMELINHA": "PARK WAY (LADO OESTE) / QD 26 E 27",
    "FLG_SENTIDO": "C",
    "DATA_VIAGEM": "26-AUG-2025",
    "HOR_SAIDA": "01/01/1900 07:20:01",
    "HOR_CHEGADA": "01/01/1900 09:05:01",
    "COD_LOCALIDADE": "40",
    "LOCAL_ORIGEM_VIAGEM": "FLORICULTURA",
    "COD_SERVICO_COMPLETO": "PW01M",
    "COD_SERVICO_NUMERO": "01",
    "COD_MOTORISTA": "16029",
    "NOME_MOTORISTA": "ALBERTO DOS SANTOS",
    "COD_COBRADOR": "",
    "NOME_COBRADOR": "",
    "TOTAL_HORARIOS": "4"
};

// ✅ Normalize and compare - agora com tipagem correta
const normalizedTransData1 = normalizeTransDataTrip(transDataTrip1);
const normalizedGlobus1 = normalizeGlobusTrip(globusTrip1);
const comparison1 = compareTrips(normalizedTransData1, normalizedGlobus1);

console.log('--- Comparação 1 ---');
console.log('TransData 1:', normalizedTransData1);
console.log('Globus 1:', normalizedGlobus1);
console.log('Combinação:', CombinacaoComparacao[comparison1], `(${comparison1})`);

const normalizedTransData2 = normalizeTransDataTrip(transDataTrip2);
const normalizedGlobus2 = normalizeGlobusTrip(globusTrip2);
const comparison2 = compareTrips(normalizedTransData2, normalizedGlobus2);

console.log('\n--- Comparação 2 ---');
console.log('TransData 2:', normalizedTransData2);
console.log('Globus 2:', normalizedGlobus2);
console.log('Combinação:', CombinacaoComparacao[comparison2], `(${comparison2})`);

// ✅ Example with user's provided data for TransData and Globus
const userTransDataTrip = {
    "SentidoText": "IDA",
    "InicioPrevistoText": "15:40:00",
    "Servico": 3,
    "NomeLinha": "100.2 - Paranoá (Paranoá Parque) / Rod. Plano Piloto (L2 Sul)"
};

const userGlobusTrip: OracleGlobusData = {
    "CODIGOLINHA": "7652",
    "FLG_SENTIDO": "C",
    "COD_SERVICO_NUMERO": "01",
    "HOR_SAIDA": "01/01/1900 06:07:01"
};

const normalizedUserTransData = normalizeTransDataTrip(userTransDataTrip);
const normalizedUserGlobus = normalizeGlobusTrip(userGlobusTrip);
const userComparison = compareTrips(normalizedUserTransData, normalizedUserGlobus);

console.log('\n--- Comparação Usuário ---');
console.log('TransData (Usuário):', normalizedUserTransData);
console.log('Globus (Usuário):', normalizedUserGlobus);
console.log('Combinação:', CombinacaoComparacao[userComparison], `(${userComparison})`);