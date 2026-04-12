// Lisbon Metro line definitions — station names must match the API (proximometro.pt)
// Each line is ordered from one terminus to the other.

export interface MetroLineDefinition {
  name: string;
  color: string;       // CSS color for the polyline
  stationNames: string[];
}

export const metroLineDefinitions: MetroLineDefinition[] = [
  {
    name: 'Azul',
    color: '#0060aa',
    stationNames: [
      'Reboleira', 'Amadora Este', 'Alfornelos', 'Pontinha', 'Carnide',
      'Colégio Militar / Luz', 'Alto dos Moinhos', 'Laranjeiras',
      'Jardim Zoológico', 'Praça de Espanha', 'São Sebastião',
      'Parque', 'Marquês de Pombal', 'Avenida', 'Restauradores',
      'Baixa-Chiado', 'Terreiro do Paço', 'Santa Apolónia',
    ],
  },
  {
    name: 'Amarela',
    color: '#f4c31e',
    stationNames: [
      'Odivelas', 'Senhor Roubado', 'Ameixoeira', 'Lumiar',
      'Quinta das Conchas', 'Campo Grande', 'Cidade Universitária',
      'Entre Campos', 'Campo Pequeno', 'Saldanha', 'Picoas',
      'Marquês de Pombal', 'Rato',
    ],
  },
  {
    name: 'Verde',
    color: '#00a84f',
    stationNames: [
      'Telheiras', 'Campo Grande', 'Alvalade', 'Roma', 'Areeiro',
      'Alameda', 'Arroios', 'Anjos', 'Intendente', 'Martim Moniz',
      'Rossio', 'Baixa-Chiado', 'Cais do Sodré',
    ],
  },
  {
    name: 'Vermelha',
    color: '#e61e25',
    stationNames: [
      'Aeroporto', 'Encarnação', 'Moscavide', 'Oriente',
      'Cabo Ruivo', 'Olivais', 'Chelas', 'Bela Vista', 'Olaias',
      'Alameda', 'Saldanha', 'São Sebastião',
    ],
  },
];
