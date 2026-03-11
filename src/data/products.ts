export interface Product {
  id: string;
  nome: string;
  categoria: "celular" | "smartwatch" | "tablet" | "notebook";
  marca: string;
  descricao: string;
  especificacoes: string[];
  imagem: string;
  preco12: number;
  preco24: number;
  preco36: number;
  estoque: number;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    nome: "iPhone 15 Pro 128GB",
    categoria: "celular",
    marca: "Apple",
    descricao: "O iPhone 15 Pro com chip A17 Pro, câmera de 48MP e design em titânio.",
    especificacoes: ["Tela 6.1\" OLED", "Chip A17 Pro", "128GB", "Câmera 48MP", "5G"],
    imagem: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    preco12: 349,
    preco24: 289,
    preco36: 239,
    estoque: 15,
  },
  {
    id: "2",
    nome: "Samsung Galaxy S24 Ultra",
    categoria: "celular",
    marca: "Samsung",
    descricao: "O Galaxy S24 Ultra com S Pen, câmera de 200MP e IA integrada.",
    especificacoes: ["Tela 6.8\" AMOLED", "Snapdragon 8 Gen 3", "256GB", "Câmera 200MP", "S Pen"],
    imagem: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
    preco12: 379,
    preco24: 309,
    preco36: 259,
    estoque: 10,
  },
  {
    id: "3",
    nome: "Apple Watch Series 9",
    categoria: "smartwatch",
    marca: "Apple",
    descricao: "Apple Watch Series 9 com chip S9 e display ultra brilhante.",
    especificacoes: ["Tela 45mm Always-On", "Chip S9", "GPS + Celular", "WatchOS 10"],
    imagem: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop",
    preco12: 179,
    preco24: 149,
    preco36: 119,
    estoque: 20,
  },
  {
    id: "4",
    nome: "iPad Pro M2 11\"",
    categoria: "tablet",
    marca: "Apple",
    descricao: "iPad Pro com chip M2, tela Liquid Retina XDR e suporte a Apple Pencil.",
    especificacoes: ["Tela 11\" Liquid Retina XDR", "Chip M2", "128GB", "Face ID", "USB-C"],
    imagem: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
    preco12: 299,
    preco24: 249,
    preco36: 199,
    estoque: 8,
  },
  {
    id: "5",
    nome: "MacBook Air M3 13\"",
    categoria: "notebook",
    marca: "Apple",
    descricao: "MacBook Air com chip M3, bateria de até 18 horas e design ultrafino.",
    especificacoes: ["Tela 13.6\" Liquid Retina", "Chip M3", "256GB SSD", "8GB RAM", "MagSafe"],
    imagem: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    preco12: 399,
    preco24: 329,
    preco36: 279,
    estoque: 12,
  },
  {
    id: "6",
    nome: "Samsung Galaxy Tab S9",
    categoria: "tablet",
    marca: "Samsung",
    descricao: "Galaxy Tab S9 com tela AMOLED, S Pen inclusa e resistência à água.",
    especificacoes: ["Tela 11\" AMOLED", "Snapdragon 8 Gen 2", "128GB", "S Pen", "IP68"],
    imagem: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=400&fit=crop",
    preco12: 249,
    preco24: 199,
    preco36: 169,
    estoque: 6,
  },
  {
    id: "7",
    nome: "Dell XPS 15",
    categoria: "notebook",
    marca: "Dell",
    descricao: "Notebook premium com tela OLED 3.5K, Intel Core i7 e design compacto.",
    especificacoes: ["Tela 15.6\" OLED 3.5K", "Intel Core i7-13700H", "512GB SSD", "16GB RAM"],
    imagem: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop",
    preco12: 449,
    preco24: 369,
    preco36: 309,
    estoque: 5,
  },
  {
    id: "8",
    nome: "Galaxy Watch 6 Classic",
    categoria: "smartwatch",
    marca: "Samsung",
    descricao: "Galaxy Watch 6 Classic com bisel giratório e monitoramento avançado de saúde.",
    especificacoes: ["Tela 1.5\" AMOLED", "Exynos W930", "Bisel giratório", "BioActive Sensor"],
    imagem: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    preco12: 149,
    preco24: 119,
    preco36: 99,
    estoque: 18,
  },
];
