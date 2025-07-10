// Dados das linhas de ônibus
// Este arquivo pode ser expandido com mais linhas ou conectado a uma API

export interface BusLineInfo {
  numero: string;
  nome: string;
  empresa: string;
  tarifa: number | string;
  horarios: string[];
  pontos_principais: string[];
  qr_data_original?: string;
  erro?: string;
}

// Adicione aqui as linhas de ônibus da sua cidade
export const BUS_LINES_DATA: Record<string, BusLineInfo> = {
  '001': {
    numero: '001',
    nome: 'Centro - Zona Norte',
    empresa: 'Viação Cidade',
    tarifa: 4.5,
    horarios: [
      '05:30',
      '06:00',
      '06:30',
      '07:00',
      '07:30',
      '08:00',
      '08:30',
      '09:00',
    ],
    pontos_principais: [
      'Terminal Centro',
      'Shopping Norte',
      'Hospital Regional',
      'Universidade',
    ],
  },
  '002': {
    numero: '002',
    nome: 'Aeroporto - Centro',
    empresa: 'Express Bus',
    tarifa: 6.0,
    horarios: [
      '06:00',
      '07:00',
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
    ],
    pontos_principais: [
      'Aeroporto Internacional',
      'Rodoviária',
      'Centro Comercial',
      'Praça Central',
    ],
  },
  '101': {
    numero: '101',
    nome: 'Bairro Sul - Centro',
    empresa: 'Transportes Unidos',
    tarifa: 4.25,
    horarios: [
      '05:45',
      '06:15',
      '06:45',
      '07:15',
      '07:45',
      '08:15',
      '08:45',
      '09:15',
    ],
    pontos_principais: [
      'Terminal Sul',
      'Hospital Municipal',
      'Escola Técnica',
      'Centro',
    ],
  },
  '201': {
    numero: '201',
    nome: 'Circular Shopping',
    empresa: 'Viação Circular',
    tarifa: 3.75,
    horarios: [
      '06:00',
      '06:30',
      '07:00',
      '07:30',
      '08:00',
      '08:30',
      '09:00',
      '09:30',
    ],
    pontos_principais: [
      'Shopping Center',
      'Terminal Oeste',
      'Hospital Central',
      'Universidade Federal',
    ],
  },
  '301': {
    numero: '301',
    nome: 'Zona Leste - Terminal',
    empresa: 'Transportes Leste',
    tarifa: 4.75,
    horarios: [
      '05:30',
      '06:00',
      '06:30',
      '07:00',
      '07:30',
      '08:00',
      '08:30',
      '09:00',
    ],
    pontos_principais: [
      'Zona Leste',
      'Mercado Central',
      'Terminal Rodoviário',
      'Centro Histórico',
    ],
  },
};

// Função para buscar informações da linha
export const getBusLineInfo = (qrData: string): BusLineInfo => {
  try {
    let busNumber: string | null = null;

    // Formato 1: Apenas o número da linha
    if (qrData.match(/^[0-9A-Za-z\-_]+$/)) {
      busNumber = qrData.toUpperCase();
    }

    // Formato 2: JSON com informações da linha
    else if (qrData.startsWith('{')) {
      try {
        const qrJson = JSON.parse(qrData);
        busNumber = qrJson.linha || qrJson.numero || qrJson.line;
      } catch (jsonError) {
        // Se não conseguir fazer parse do JSON, tenta extrair número
        const match = qrData.match(/\"linha\"\s*:\s*\"([^\"]+)\"/);
        if (match) busNumber = match[1];
      }
    }

    // Formato 3: URL com parâmetros
    else if (qrData.includes('linha=') || qrData.includes('bus=')) {
      const params = new URLSearchParams(qrData.split('?')[1] || qrData);
      busNumber = params.get('linha') || params.get('bus');
    }

    // Formato 4: Texto livre - tenta extrair número
    else {
      const match = qrData.match(/(\d{1,4}[A-Za-z]?)/);
      if (match) busNumber = match[1];
    }

    // Busca nos dados das linhas
    if (busNumber && BUS_LINES_DATA[busNumber]) {
      return BUS_LINES_DATA[busNumber];
    }

    // Se não encontrou nos dados, retorna informação básica
    return {
      numero: busNumber || qrData,
      nome: 'Linha não encontrada na base de dados',
      empresa: 'Consulte a empresa de transporte local',
      tarifa: 'Consulte valor atual',
      horarios: ['Consulte horários no terminal'],
      pontos_principais: ['Informações não disponíveis'],
      qr_data_original: qrData,
    };
  } catch (error) {
    return {
      numero: qrData,
      nome: 'Erro ao processar dados',
      empresa: 'N/A',
      tarifa: 'N/A',
      horarios: ['N/A'],
      pontos_principais: ['N/A'],
      erro: `Erro ao processar QR code: ${error}`,
      qr_data_original: qrData,
    };
  }
};

// Função para adicionar nova linha (para expansão futura)
export const addBusLine = (numero: string, info: BusLineInfo) => {
  BUS_LINES_DATA[numero] = info;
};

// Função para obter todas as linhas
export const getAllBusLines = (): BusLineInfo[] => {
  return Object.values(BUS_LINES_DATA);
};
