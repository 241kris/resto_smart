/**
 * Traductions françaises pour les postes d'employés
 */
export const POSITION_LABELS: Record<string, string> = {
  // Direction
  MANAGER: "Gérant(e)",
  ASSISTANT_MANAGER: "Gérant(e) adjoint(e)",

  // Cuisine
  CHEF: "Chef cuisinier",
  SOUS_CHEF: "Sous-chef",
  COOK: "Cuisinier",
  PREP_COOK: "Commis de cuisine",
  LINE_COOK: "Cuisinier de ligne",
  PASTRY_CHEF: "Pâtissier",

  // Service
  WAITER: "Serveur/Serveuse",
  HEAD_WAITER: "Maître d'hôtel",
  BARTENDER: "Barman/Barmaid",
  HOST: "Hôte/Hôtesse d'accueil",
  SOMMELIER: "Sommelier",

  // Support
  DISHWASHER: "Plongeur",
  CLEANER: "Agent d'entretien",
  DELIVERY: "Livreur",

  // Autres
  OTHER: "Autre"
}

/**
 * Traductions françaises pour les départements
 */
export const DEPARTMENT_LABELS: Record<string, string> = {
  KITCHEN: "Cuisine",
  SERVICE: "Service",
  BAR: "Bar",
  MANAGEMENT: "Direction",
  SUPPORT: "Support",
  OTHER: "Autre"
}

/**
 * Traductions françaises pour les types de contrat
 */
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  CDI: "CDI",
  CDD: "CDD",
  INTERIM: "Intérim",
  APPRENTICE: "Apprenti(e)",
  INTERN: "Stagiaire",
  FREELANCE: "Freelance"
}

/**
 * Obtenir le label français d'un poste
 */
export function getPositionLabel(position: string): string {
  return POSITION_LABELS[position] || position
}

/**
 * Obtenir le label français d'un département
 */
export function getDepartmentLabel(department: string): string {
  return DEPARTMENT_LABELS[department] || department
}

/**
 * Obtenir le label français d'un type de contrat
 */
export function getContractTypeLabel(contractType: string): string {
  return CONTRACT_TYPE_LABELS[contractType] || contractType
}
