export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
}

export interface Category {
  id: string
  name: string
}

export interface Table {
  id: string
  name: string
  qrCode: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  tableId: string
  tableName: string
  items: OrderItem[]
  total: number
  status: "pending" | "processed" | "paid"
  createdAt: string
}

export interface Establishment {
  id: string
  name: string
  coverImage: string
  email: string
  phone: string
  address: string
}

export const mockCategories: Category[] = [
  { id: "1", name: "Entrées" },
  { id: "2", name: "Plats principaux" },
  { id: "3", name: "Desserts" },
  { id: "4", name: "Boissons" },
]

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Salade César",
    description: "Salade fraîche avec poulet grillé, croûtons et parmesan",
    price: 12.50,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
    categoryId: "1"
  },
  {
    id: "2",
    name: "Soupe à l'oignon",
    description: "Soupe gratinée traditionnelle française",
    price: 8.00,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    categoryId: "1"
  },
  {
    id: "3",
    name: "Steak frites",
    description: "Entrecôte de boeuf avec frites maison",
    price: 24.00,
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop",
    categoryId: "2"
  },
  {
    id: "4",
    name: "Saumon grillé",
    description: "Filet de saumon avec légumes de saison",
    price: 22.00,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
    categoryId: "2"
  },
  {
    id: "5",
    name: "Risotto aux champignons",
    description: "Risotto crémeux aux cèpes et parmesan",
    price: 18.00,
    image: "https://images.unsplash.com/photo-1476124369491-c64aaf1f4d15?w=400&h=300&fit=crop",
    categoryId: "2"
  },
  {
    id: "6",
    name: "Tiramisu",
    description: "Dessert italien classique au café et mascarpone",
    price: 7.50,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop",
    categoryId: "3"
  },
  {
    id: "7",
    name: "Tarte tatin",
    description: "Tarte aux pommes caramélisées",
    price: 8.00,
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop",
    categoryId: "3"
  },
  {
    id: "8",
    name: "Café espresso",
    description: "Café italien corsé",
    price: 3.00,
    image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop",
    categoryId: "4"
  },
  {
    id: "9",
    name: "Jus d'orange frais",
    description: "Jus d'orange pressé maison",
    price: 5.00,
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop",
    categoryId: "4"
  },
]

export const mockTables: Table[] = [
  { id: "1", name: "Table 1", qrCode: "TABLE-001" },
  { id: "2", name: "Table 2", qrCode: "TABLE-002" },
  { id: "3", name: "Table 3", qrCode: "TABLE-003" },
  { id: "4", name: "Table 4", qrCode: "TABLE-004" },
  { id: "5", name: "Table 5", qrCode: "TABLE-005" },
  { id: "6", name: "Table 6", qrCode: "TABLE-006" },
  { id: "7", name: "Terrasse A", qrCode: "TABLE-007" },
  { id: "8", name: "Terrasse B", qrCode: "TABLE-008" },
]

export const mockOrders: Order[] = [
  {
    id: "1",
    tableId: "1",
    tableName: "Table 1",
    items: [
      { productId: "1", productName: "Salade César", quantity: 2, price: 12.50 },
      { productId: "3", productName: "Steak frites", quantity: 1, price: 24.00 },
      { productId: "8", productName: "Café espresso", quantity: 2, price: 3.00 },
    ],
    total: 55.00,
    status: "processed",
    createdAt: "2025-12-05T12:30:00"
  },
  {
    id: "2",
    tableId: "3",
    tableName: "Table 3",
    items: [
      { productId: "4", productName: "Saumon grillé", quantity: 2, price: 22.00 },
      { productId: "9", productName: "Jus d'orange frais", quantity: 2, price: 5.00 },
      { productId: "6", productName: "Tiramisu", quantity: 2, price: 7.50 },
    ],
    total: 69.00,
    status: "pending",
    createdAt: "2025-12-05T13:15:00"
  },
  {
    id: "3",
    tableId: "5",
    tableName: "Table 5",
    items: [
      { productId: "5", productName: "Risotto aux champignons", quantity: 1, price: 18.00 },
      { productId: "2", productName: "Soupe à l'oignon", quantity: 1, price: 8.00 },
    ],
    total: 26.00,
    status: "processed",
    createdAt: "2025-12-05T11:45:00"
  },
  {
    id: "4",
    tableId: "7",
    tableName: "Terrasse A",
    items: [
      { productId: "3", productName: "Steak frites", quantity: 3, price: 24.00 },
      { productId: "1", productName: "Salade César", quantity: 1, price: 12.50 },
      { productId: "7", productName: "Tarte tatin", quantity: 2, price: 8.00 },
    ],
    total: 100.50,
    status: "paid",
    createdAt: "2025-12-05T12:00:00"
  },
]

export const mockEstablishment: Establishment = {
  id: "1",
  name: "RestoSmart Bistro",
  coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop",
  email: "contact@restosmart.fr",
  phone: "+33 1 23 45 67 89",
  address: "123 Rue de la Gastronomie, 75001 Paris, France"
}
