export interface TransdataApiResponse {
  // Propriedades existentes...
  InicioRealizadoText?: string;
  FimRealizadoText?: string;
  PrefixoRealizado?: string;
  NomeMotorista?: string;
  NomeCobrador?: string;
  
  // ✅ ADICIONAR PROPRIEDADE FALTANTE
  statusCumprimento?: string;
  
  // Outras propriedades...
}