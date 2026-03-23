import { createContext, useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

export const ProductContext = createContext();

const normalizeProductCosts = (product) => {
  const sellingPrice = Number(product?.price || 0);
  const wholesaleValue = Number(product?.wholesalePrice ?? sellingPrice);
  const purchaseCost = Number(product?.purchaseCost ?? wholesaleValue);
  const sellCost = Number(product?.sellCost ?? sellingPrice);

  return {
    ...product,
    purchaseCost: Number.isFinite(purchaseCost) ? purchaseCost : 0,
    sellCost: Number.isFinite(sellCost) ? sellCost : 0,
  };
};

const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;

const isMongoId = (value) => MONGO_ID_REGEX.test(String(value || ""));

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const mergeProductLists = (baseProducts = [], remoteProducts = []) => {
  const merged = new Map();

  baseProducts.forEach((product) => {
    const idKey = normalizeKey(product._id || product.id);
    const nameKey = normalizeKey(product.name);
    if (idKey) merged.set(`id:${idKey}`, product);
    if (nameKey) merged.set(`name:${nameKey}`, product);
  });

  remoteProducts.forEach((product) => {
    const idKey = normalizeKey(product._id || product.id);
    const nameKey = normalizeKey(product.name);

    if (idKey && merged.has(`id:${idKey}`)) {
      const existing = merged.get(`id:${idKey}`);
      const next = { ...existing, ...product };
      merged.set(`id:${idKey}`, next);
      if (nameKey) merged.set(`name:${nameKey}`, next);
      return;
    }

    if (nameKey && merged.has(`name:${nameKey}`)) {
      const existing = merged.get(`name:${nameKey}`);
      const next = { ...existing, ...product };
      if (idKey) merged.set(`id:${idKey}`, next);
      merged.set(`name:${nameKey}`, next);
      return;
    }

    if (idKey) merged.set(`id:${idKey}`, product);
    if (nameKey) merged.set(`name:${nameKey}`, product);
  });

  const unique = [];
  const seen = new Set();
  merged.forEach((product) => {
    const key = normalizeKey(product._id || product.id || product.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(product);
  });

  return unique;
};

const normalizeProductShape = (product = {}) => {
  const mappedId = product.id || product._id || Date.now().toString();
  const price = Number(product.price || 0);
  const wholesalePrice = Number(product.wholesalePrice ?? product.purchasePrice ?? product.purchaseCost ?? price);
  const moq = Number(product.moq ?? product.MOQ ?? 1);

  return {
    ...product,
    id: mappedId,
    _id: product._id || (isMongoId(mappedId) ? String(mappedId) : null),
    name: product.name || "",
    category: product.category || "Others",
    price,
    wholesalePrice,
    purchaseCost: Number(product.purchaseCost ?? product.purchasePrice ?? wholesalePrice),
    sellCost: Number(product.sellCost ?? price),
    stock: Number(product.stock || 0),
    moq,
    MOQ: Number(product.MOQ ?? moq),
    unit: product.unit || "unit",
    description: product.description || "",
    image: product.image || "",
    bulkPricing: Array.isArray(product.bulkPricing)
      ? product.bulkPricing
      : [
          { quantity: 1, price },
          { quantity: 5, price: Math.max(price * 0.95, 0) },
          { quantity: 10, price: Math.max(price * 0.9, 0) },
          { quantity: 20, price: wholesalePrice },
        ],
  };
};

const toBackendProductPayload = (product = {}) => ({
  name: product.name,
  price: Number(product.price || 0),
  purchasePrice: Number((product.purchasePrice ?? product.purchaseCost ?? product.wholesalePrice ?? product.price) || 0),
  moq: Number(product.moq ?? product.MOQ ?? 1),
  stock: Number(product.stock || 0),
  category: product.category,
  description: product.description,
  image: product.image,
  unit: product.unit,
  wholesalePrice: Number(product.wholesalePrice ?? product.purchaseCost ?? 0),
  sellCost: Number(product.sellCost ?? product.price ?? 0),
});

export function ProductProvider({ children }) {
  const initialProducts = [
    { 
      id: 1, 
      name: "Dawat Rice", 
      category: "Grains", 
      price: 1300,
      wholesalePrice: 1100,
      stock: 150,
      moq: 2,
      unit: "bag",
      description: "Premium Dawat basmati rice 25kg",
      image: "/images/grocerry/dawat rice.png",
      bulkPricing: [
        { quantity: 1, price: 1300 },
        { quantity: 5, price: 1200 },
        { quantity: 10, price: 1150 },
        { quantity: 20, price: 1100 }
      ]
    },
    { 
      id: 2, 
      name: "Everest Chai Masala 100g", 
      category: "Masala Spices", 
      price: 120,
      wholesalePrice: 95,
      stock: 200,
      moq: 3,
      unit: "pack",
      description: "Everest aromatic chai masala blend",
      image: "/images/MASALA SPICES/Everest Chai Masala.png",
      bulkPricing: [
        { quantity: 1, price: 120 },
        { quantity: 10, price: 110 },
        { quantity: 20, price: 100 },
        { quantity: 50, price: 95 }
      ]
    },
    { 
      id: 3, 
      name: "Ashirvad Aata 10kg", 
      category: "Grains", 
      price: 380,
      wholesalePrice: 320,
      stock: 120,
      moq: 2,
      unit: "bag",
      description: "Ashirvad whole wheat flour",
      image: "/images/grocerry/ashirvad aata.png",
      bulkPricing: [
        { quantity: 1, price: 380 },
        { quantity: 5, price: 360 },
        { quantity: 10, price: 340 },
        { quantity: 20, price: 320 }
      ]
    },
    { 
      id: 4, 
      name: "Laxmipati Besan 2kg", 
      category: "Grains", 
      price: 240,
      wholesalePrice: 200,
      stock: 80,
      moq: 1,
      unit: "bag",
      description: "Laxmipati super fine chickpea flour",
      image: "/images/grocerry/Laxmipati Super Fine Besan.png",
      bulkPricing: [
        { quantity: 1, price: 240 },
        { quantity: 5, price: 220 },
        { quantity: 10, price: 210 },
        { quantity: 20, price: 200 }
      ]
    },
    { 
      id: 5, 
      name: "Everest Chat Masala 100g", 
      category: "Masala Spices", 
      price: 100,
      wholesalePrice: 80,
      stock: 180,
      moq: 5,
      unit: "pack",
      description: "Everest tangy chat masala blend",
      image: "/images/MASALA SPICES/Everest Chat Masala.png",
      bulkPricing: [
        { quantity: 1, price: 100 },
        { quantity: 10, price: 92 },
        { quantity: 20, price: 86 },
        { quantity: 50, price: 80 }
      ]
    },
    { 
      id: 6, 
      name: "Marlboro Advance", 
      category: "Pan Center", 
      price: 350,
      wholesalePrice: 310,
      stock: 95,
      moq: 3,
      unit: "pack",
      description: "Marlboro Advance cigarette pack",
      image: "/images/PAN CENTER/Marlboro Advance.png",
      bulkPricing: [
        { quantity: 1, price: 350 },
        { quantity: 5, price: 330 },
        { quantity: 10, price: 320 },
        { quantity: 20, price: 310 }
      ]
    },
    { 
      id: 7, 
      name: "Brazilian Spirit Tobacco", 
      category: "Pan Center", 
      price: 280,
      wholesalePrice: 240,
      stock: 65,
      moq: 2,
      unit: "pack",
      description: "Brazilian Spirit Tobacco American Spirit",
      image: "/images/PAN%20CENTER/Brazilian Spirit Tobacco American Spirit.png",
      bulkPricing: [
        { quantity: 1, price: 280 },
        { quantity: 5, price: 265 },
        { quantity: 10, price: 252 },
        { quantity: 20, price: 240 }
      ]
    },
    { 
      id: 8, 
      name: "Bajaj Almond Hair Oil 300ml", 
      category: "Daily Used Product", 
      price: 180,
      wholesalePrice: 150,
      stock: 250,
      moq: 4,
      unit: "bottle",
      description: "Bajaj Almond Drops non-sticky hair oil",
      image: "/images/Daily%20used%20product/Bajaj Almond Drops Non-Sticky Hair Oil.png",
      bulkPricing: [
        { quantity: 1, price: 180 },
        { quantity: 10, price: 170 },
        { quantity: 25, price: 160 },
        { quantity: 50, price: 150 }
      ]
    },
    { 
      id: 9, 
      name: "Cinthol Lime Deo Soap 125g", 
      category: "Daily Used Product", 
      price: 90,
      wholesalePrice: 75,
      stock: 140,
      moq: 2,
      unit: "pack",
      description: "Cinthol Lime refreshing deo soap",
      image: "/images/Daily%20used%20product/Cinthol Lime Refreshing Deo Soap.png",
      bulkPricing: [
        { quantity: 1, price: 90 },
        { quantity: 10, price: 85 },
        { quantity: 20, price: 80 },
        { quantity: 50, price: 75 }
      ]
    },
    { 
      id: 10, 
      name: "Colgate Strong Teeth Toothpaste 150g", 
      category: "Daily Used Product", 
      price: 110,
      wholesalePrice: 90,
      stock: 110,
      moq: 3,
      unit: "pack",
      description: "Colgate strong teeth anticavity toothpaste",
      image: "/images/Daily used product/Colgate Strong Teeth Anticavity Toothpaste (150 g).png",
      bulkPricing: [
        { quantity: 1, price: 110 },
        { quantity: 10, price: 102 },
        { quantity: 20, price: 96 },
        { quantity: 50, price: 90 }
      ]
    },
    { 
      id: 11, 
      name: "Fortune Thick Poha 500g", 
      category: "Grains", 
      price: 85,
      wholesalePrice: 70,
      stock: 130,
      moq: 2,
      unit: "bag",
      description: "Fortune thick flattened rice poha",
      image: "/images/grocerry/Fortune Thick Poha.png",
      bulkPricing: [
        { quantity: 1, price: 85 },
        { quantity: 5, price: 78 },
        { quantity: 10, price: 74 },
        { quantity: 20, price: 70 }
      ]
    },
    { 
      id: 12, 
      name: "Whole Farm Sabudana 1kg", 
      category: "Grains", 
      price: 320,
      wholesalePrice: 280,
      stock: 90,
      moq: 2,
      unit: "bag",
      description: "Whole Farm premium sabudana (tapioca pearls)",
      image: "/images/grocerry/Whole Farm Premium Big Sabudana Badadana.png",
      bulkPricing: [
        { quantity: 1, price: 320 },
        { quantity: 5, price: 300 },
        { quantity: 10, price: 290 },
        { quantity: 20, price: 280 }
      ]
    },
    { 
      id: 13, 
      name: "Whole Farm Rice Flour 1kg", 
      category: "Grains", 
      price: 180,
      wholesalePrice: 150,
      stock: 160,
      moq: 3,
      unit: "bag",
      description: "Whole Farm premium rice flour",
      image: "/images/grocerry/Whole Farm Premium Rice Flour.png",
      bulkPricing: [
        { quantity: 1, price: 180 },
        { quantity: 5, price: 165 },
        { quantity: 10, price: 158 },
        { quantity: 20, price: 150 }
      ]
    },
    { 
      id: 14, 
      name: "Mango Kodra Millet 1kg", 
      category: "Grains", 
      price: 280,
      wholesalePrice: 230,
      stock: 100,
      moq: 2,
      unit: "bag",
      description: "Whole Farm mango kodra kodo millet",
      image: "/images/grocerry/Mango Kodra Kodo Millet.png",
      bulkPricing: [
        { quantity: 1, price: 280 },
        { quantity: 5, price: 260 },
        { quantity: 10, price: 245 },
        { quantity: 20, price: 230 }
      ]
    },
    { 
      id: 15, 
      name: "Whole Farm Moong Sabut 1kg", 
      category: "Grains", 
      price: 220,
      wholesalePrice: 185,
      stock: 85,
      moq: 2,
      unit: "bag",
      description: "Whole Farm premium green moong whole beans",
      image: "/images/grocerry/Whole Farm Premium Moong (Sabut) Green.png",
      bulkPricing: [
        { quantity: 1, price: 220 },
        { quantity: 5, price: 205 },
        { quantity: 10, price: 195 },
        { quantity: 20, price: 185 }
      ]
    },
    { 
      id: 16, 
      name: "Whole Farm Moong Dal Chilka 1kg", 
      category: "Grains", 
      price: 240,
      wholesalePrice: 200,
      stock: 120,
      moq: 2,
      unit: "bag",
      description: "Whole Farm premium green moong dal with skin",
      image: "/images/grocerry/Whole Farm Premium Moong Dal (Chilka) Green.png",
      bulkPricing: [
        { quantity: 1, price: 240 },
        { quantity: 5, price: 220 },
        { quantity: 10, price: 210 },
        { quantity: 20, price: 200 }
      ]
    },
    { 
      id: 18, 
      name: "Everest Chicken Masala 100g", 
      category: "Masala Spices", 
      price: 130,
      wholesalePrice: 105,
      stock: 150,
      moq: 2,
      unit: "pack",
      description: "Everest chicken seasoning masala",
      image: "/images/MASALA SPICES/Everest Chicken Masala.png",
      bulkPricing: [
        { quantity: 1, price: 130 },
        { quantity: 10, price: 120 },
        { quantity: 20, price: 110 },
        { quantity: 50, price: 105 }
      ]
    },
    { 
      id: 19, 
      name: "Everest Hing Powder 50g", 
      category: "Masala Spices", 
      price: 150,
      wholesalePrice: 120,
      stock: 120,
      moq: 3,
      unit: "pack",
      description: "Everest compounded asafoetida powder",
      image: "/images/MASALA SPICES/Everest Compounded Hing Powder (Hingraj).png",
      bulkPricing: [
        { quantity: 1, price: 150 },
        { quantity: 10, price: 138 },
        { quantity: 20, price: 129 },
        { quantity: 50, price: 120 }
      ]
    },
    { 
      id: 20, 
      name: "Everest Coriander Powder 100g", 
      category: "Masala Spices", 
      price: 110,
      wholesalePrice: 88,
      stock: 70,
      moq: 2,
      unit: "pack",
      description: "Everest dhania coriander powder",
      image: "/images/MASALA SPICES/Everest Coriander Powder Dhania.png",
      bulkPricing: [
        { quantity: 1, price: 110 },
        { quantity: 10, price: 100 },
        { quantity: 20, price: 94 },
        { quantity: 50, price: 88 }
      ]
    },
    { 
      id: 21, 
      name: "Everest Red Chilli Powder 100g", 
      category: "Masala Spices", 
      price: 140,
      wholesalePrice: 110,
      stock: 60,
      moq: 1,
      unit: "pack",
      description: "Everest tikhalal red chilli powder",
      image: "/images/MASALA SPICES/Everest Tikhalal Red Chilli Powder.png",
      bulkPricing: [
        { quantity: 1, price: 140 },
        { quantity: 10, price: 128 },
        { quantity: 20, price: 119 },
        { quantity: 50, price: 110 }
      ]
    },
    { 
      id: 22, 
      name: "Everest Turmeric Powder 100g", 
      category: "Masala Spices", 
      price: 125,
      wholesalePrice: 100,
      stock: 95,
      moq: 2,
      unit: "pack",
      description: "Everest haldi turmeric powder",
      image: "/images/MASALA SPICES/Everest Turmeric Powder Haldi.png",
      bulkPricing: [
        { quantity: 1, price: 125 },
        { quantity: 10, price: 115 },
        { quantity: 20, price: 107 },
        { quantity: 50, price: 100 }
      ]
    },
    { 
      id: 23, 
      name: "Maggi Masala-ae-Magic Sabzi 5x4g", 
      category: "Masala Spices", 
      price: 80,
      wholesalePrice: 65,
      stock: 85,
      moq: 1,
      unit: "box",
      description: "Maggi Masala-ae-Magic Sabzi masala sachet pack",
      image: "/images/MASALA SPICES/Maggi Masala-ae-Magic Sabzi Masala (20 Sachets).png",
      bulkPricing: [
        { quantity: 1, price: 80 },
        { quantity: 10, price: 73 },
        { quantity: 20, price: 69 },
        { quantity: 50, price: 65 }
      ]
    },
    { 
      id: 24, 
      name: "Tata Salt Vacuum Evaporated 1kg", 
      category: "Masala Spices", 
      price: 70,
      wholesalePrice: 55,
      stock: 70,
      moq: 2,
      unit: "pack",
      description: "Tata vacuum evaporated iodised salt",
      image: "/images/MASALA SPICES/Tata Salt (Vacuum Evaporated Iodised).png",
      bulkPricing: [
        { quantity: 1, price: 70 },
        { quantity: 20, price: 62 },
        { quantity: 50, price: 58 },
        { quantity: 100, price: 55 }
      ]
    },
    { 
      id: 25, 
      name: "Tata Sampann Garam Masala 100g", 
      category: "Masala Spices", 
      price: 160,
      wholesalePrice: 130,
      stock: 110,
      moq: 3,
      unit: "pack",
      description: "Tata Sampann garam masala with natural oils",
      image: "/images/MASALA SPICES/Tata Sampann Garam Masala Powder with Natural Oils.png",
      bulkPricing: [
        { quantity: 1, price: 160 },
        { quantity: 10, price: 148 },
        { quantity: 20, price: 139 },
        { quantity: 50, price: 130 }
      ]
    },
    { 
      id: 26, 
      name: "Rajnigandha Pan Masala", 
      category: "Pan Center", 
      price: 90,
      wholesalePrice: 75,
      stock: 100,
      moq: 3,
      unit: "pack",
      description: "Rajnigandha pan masala mouth freshener",
      image: "/images/PAN CENTER/Rajnigandha Pan Masala.png",
      bulkPricing: [
        { quantity: 1, price: 90 },
        { quantity: 10, price: 84 },
        { quantity: 20, price: 79 },
        { quantity: 50, price: 75 }
      ]
    },
    { 
      id: 27, 
      name: "Rajnigandha Silver Pearl Elaichi", 
      category: "Pan Center", 
      price: 120,
      wholesalePrice: 100,
      stock: 80,
      moq: 2,
      unit: "pack",
      description: "Rajnigandha silver coated elaichi mouth freshener",
      image: "/images/PAN CENTER/Rajnigandha Silver Pearl Silver Coated Elaichi Mouth Freshener.png",
      bulkPricing: [
        { quantity: 1, price: 120 },
        { quantity: 10, price: 112 },
        { quantity: 20, price: 106 },
        { quantity: 50, price: 100 }
      ]
    },
    { 
      id: 28, 
      name: "GO DESi Meetha Paan Mints", 
      category: "Pan Center", 
      price: 50,
      wholesalePrice: 40,
      stock: 70,
      moq: 1,
      unit: "pack",
      description: "GO DESi Meetha Paan desi mints",
      image: "/images/PAN CENTER/GO DESi Meetha Paan Desi Mints.png",
      bulkPricing: [
        { quantity: 1, price: 50 },
        { quantity: 10, price: 46 },
        { quantity: 20, price: 43 },
        { quantity: 50, price: 40 }
      ]
    },
    { 
      id: 29, 
      name: "Cocoyaya Black Lighter", 
      category: "Pan Center", 
      price: 45,
      wholesalePrice: 35,
      stock: 95,
      moq: 3,
      unit: "pack",
      description: "Cocoyaya black lighter",
      image: "/images/PAN CENTER/Cocoyaya Black Lighter.png",
      bulkPricing: [
        { quantity: 1, price: 45 },
        { quantity: 10, price: 41 },
        { quantity: 20, price: 38 },
        { quantity: 50, price: 35 }
      ]
    },
    { 
      id: 30, 
      name: "Calm Blueberry Herbal Blend", 
      category: "Pan Center", 
      price: 180,
      wholesalePrice: 150,
      stock: 40,
      moq: 1,
      unit: "pack",
      description: "Calm - Blueberry non-tobacco herbal smoking blend by Hari Leaf",
      image: "/images/PAN CENTER/Calm - Blueberry Non-Tobacco Herbal Smoking Blend by Hari Leaf.png",
      bulkPricing: [
        { quantity: 1, price: 180 },
        { quantity: 10, price: 168 },
        { quantity: 20, price: 159 },
        { quantity: 50, price: 150 }
      ]
    },
    { 
      id: 31, 
      name: "Luvin Wine Flavour", 
      category: "Pan Center", 
      price: 80,
      wholesalePrice: 65,
      stock: 80,
      moq: 2,
      unit: "pack",
      description: "Luvin wine flavoured mouth freshener",
      image: "/images/PAN CENTER/Luvin Wine Flavour.png",
      bulkPricing: [
        { quantity: 1, price: 80 },
        { quantity: 10, price: 74 },
        { quantity: 20, price: 69 },
        { quantity: 50, price: 65 }
      ]
    },
    { 
      id: 32, 
      name: "Ryze Nicotine Gum 2mg", 
      category: "Pan Center", 
      price: 120,
      wholesalePrice: 100,
      stock: 65,
      moq: 2,
      unit: "pack",
      description: "Ryze nicotine gum 2mg fruit blast",
      image: "/images/PAN CENTER/Ryze Nicotine Gum (2 mg, Fruit Blast).png",
      bulkPricing: [
        { quantity: 1, price: 120 },
        { quantity: 10, price: 112 },
        { quantity: 20, price: 106 },
        { quantity: 50, price: 100 }
      ]
    },
    { 
      id: 33, 
      name: "Tulsi 2x4.25g", 
      category: "Pan Center", 
      price: 60,
      wholesalePrice: 48,
      stock: 50,
      moq: 1,
      unit: "pack",
      description: "Tulsi mouth freshener pack",
      image: "/images/PAN CENTER/Tulsi (2 x 4.25 g).png",
      bulkPricing: [
        { quantity: 1, price: 60 },
        { quantity: 10, price: 56 },
        { quantity: 20, price: 52 },
        { quantity: 50, price: 48 }
      ]
    },
    { 
      id: 34, 
      name: "Comfort Fabric Conditioner 1L", 
      category: "Daily Used Product", 
      price: 280,
      wholesalePrice: 230,
      stock: 150,
      moq: 3,
      unit: "bottle",
      description: "Comfort after wash fabric conditioner morning fresh",
      image: "/images/Daily used product/Comfort After Wash Fabric Conditioner (Morning Fresh).png",
      bulkPricing: [
        { quantity: 1, price: 280 },
        { quantity: 5, price: 265 },
        { quantity: 10, price: 250 },
        { quantity: 20, price: 230 }
      ]
    },
    { 
      id: 35, 
      name: "Dettol Disinfectant Liquid 500ml", 
      category: "Daily Used Product", 
      price: 320,
      wholesalePrice: 270,
      stock: 120,
      moq: 2,
      unit: "bottle",
      description: "Dettol liquid disinfectant lime fresh",
      image: "/images/Daily used product/Dettol Liquid Disinfectant (Lime Fresh).png",
      bulkPricing: [
        { quantity: 1, price: 320 },
        { quantity: 5, price: 300 },
        { quantity: 10, price: 285 },
        { quantity: 20, price: 270 }
      ]
    },
    { 
      id: 36, 
      name: "Ghar Sandalwood Saffron Soap 2pc", 
      category: "Daily Used Product", 
      price: 140,
      wholesalePrice: 115,
      stock: 100,
      moq: 1,
      unit: "pack",
      description: "Ghar Soaps Sandalwood & Saffron magic soap pack of 2",
      image: "/images/Daily used product/Ghar Soaps Sandalwood & Saffron Magic Soap (Pack of 2).png",
      bulkPricing: [
        { quantity: 1, price: 140 },
        { quantity: 10, price: 130 },
        { quantity: 20, price: 122 },
        { quantity: 50, price: 115 }
      ]
    },
    { 
      id: 37, 
      name: "Harpic Toilet Cleaner 500ml", 
      category: "Daily Used Product", 
      price: 190,
      wholesalePrice: 160,
      stock: 90,
      moq: 1,
      unit: "bottle",
      description: "Harpic disinfectant liquid toilet cleaner jasmine",
      image: "/images/Daily used product/Harpic Disinfectant Liquid Toilet Cleaner (Jasmine).png",
      bulkPricing: [
        { quantity: 1, price: 190 },
        { quantity: 10, price: 178 },
        { quantity: 20, price: 169 },
        { quantity: 50, price: 160 }
      ]
    },
    { 
      id: 38, 
      name: "Oral-B Toothbrush Extra Soft", 
      category: "Daily Used Product", 
      price: 85,
      wholesalePrice: 70,
      stock: 140,
      moq: 2,
      unit: "pack",
      description: "Oral-B sensitive care toothbrush extra soft",
      image: "/images/Daily used product/Oral-B Sensitive Care Toothbrush (Extra Soft).png",
      bulkPricing: [
        { quantity: 1, price: 85 },
        { quantity: 10, price: 79 },
        { quantity: 20, price: 74 },
        { quantity: 50, price: 70 }
      ]
    },
    { 
      id: 39, 
      name: "Oral-B Electric Toothbrush", 
      category: "Daily Used Product", 
      price: 2400,
      wholesalePrice: 2100,
      stock: 130,
      moq: 2,
      unit: "pack",
      description: "Oral-B Vitality Pro rechargeable electric toothbrush",
      image: "/images/Daily used product/Oral-B Vitality Pro with Sensitive Plus Rotating Rechargeable Electric Toothbrush.png",
      bulkPricing: [
        { quantity: 1, price: 2400 },
        { quantity: 5, price: 2300 },
        { quantity: 10, price: 2200 },
        { quantity: 20, price: 2100 }
      ]
    },
    { 
      id: 40, 
      name: "Sensodyne Toothpaste 100g", 
      category: "Daily Used Product", 
      price: 200,
      wholesalePrice: 170,
      stock: 110,
      moq: 2,
      unit: "pack",
      description: "Sensodyne deep clean sensitive toothpaste",
      image: "/images/Daily used product/Sensodyne Deep Clean Sensitive Toothpaste.png",
      bulkPricing: [
        { quantity: 1, price: 200 },
        { quantity: 10, price: 188 },
        { quantity: 20, price: 179 },
        { quantity: 50, price: 170 }
      ]
    },
    { 
      id: 41, 
      name: "GUBB Metal Tongue Cleaner", 
      category: "Daily Used Product", 
      price: 75,
      wholesalePrice: 60,
      stock: 200,
      moq: 5,
      unit: "pack",
      description: "GUBB metal tongue cleaner for oral hygiene",
      image: "/images/Daily used product/GUBB Metal Tongue Cleaner.png",
      bulkPricing: [
        { quantity: 1, price: 75 },
        { quantity: 10, price: 68 },
        { quantity: 20, price: 64 },
        { quantity: 50, price: 60 }
      ]
    },
    { 
      id: 44, 
      name: "Balaji Crunchem Cream & Onion", 
      category: "Snacks", 
      price: 25,
      wholesalePrice: 20,
      stock: 500,
      moq: 10,
      unit: "pack",
      description: "Cream & Onion flavored potato wafers from Balaji.",
      image: "/images/snacks/snacks/cream and onion.png",
      bulkPricing: [
        { quantity: 1, price: 25 },
        { quantity: 20, price: 23 },
        { quantity: 50, price: 21 },
        { quantity: 100, price: 20 }
      ]
    },
    { 
      id: 45, 
      name: "Cheese Balls", 
      category: "Snacks", 
      price: 30,
      wholesalePrice: 25,
      stock: 400,
      moq: 10,
      unit: "pack",
      description: "Crunchy cheese flavored snack balls.",
      image: "/images/snacks/snacks/cheese balls.png",
      bulkPricing: [
        { quantity: 1, price: 30 },
        { quantity: 20, price: 28 },
        { quantity: 50, price: 26 },
        { quantity: 100, price: 25 }
      ]
    },
    { 
      id: 46, 
      name: "Doritos", 
      category: "Snacks", 
      price: 40,
      wholesalePrice: 35,
      stock: 350,
      moq: 10,
      unit: "pack",
      description: "Classic Doritos tortilla chips.",
      image: "/images/snacks/snacks/doritos.png",
      bulkPricing: [
        { quantity: 1, price: 40 },
        { quantity: 20, price: 38 },
        { quantity: 50, price: 36 },
        { quantity: 100, price: 35 }
      ]
    },
    { 
      id: 47, 
      name: "Kurkure", 
      category: "Snacks", 
      price: 20,
      wholesalePrice: 16,
      stock: 600,
      moq: 15,
      unit: "pack",
      description: "Crunchy masala munch snacks.",
      image: "/images/snacks/snacks/kurkure.png",
      bulkPricing: [
        { quantity: 1, price: 20 },
        { quantity: 25, price: 18 },
        { quantity: 50, price: 17 },
        { quantity: 100, price: 16 }
      ]
    },
    { 
      id: 48, 
      name: "Ratlami Sev", 
      category: "Snacks", 
      price: 35,
      wholesalePrice: 30,
      stock: 300,
      moq: 10,
      unit: "pack",
      description: "Spicy traditional Ratlami sev namkeen.",
      image: "/images/snacks/snacks/ratlami sev.png",
      bulkPricing: [
        { quantity: 1, price: 35 },
        { quantity: 20, price: 33 },
        { quantity: 50, price: 31 },
        { quantity: 100, price: 30 }
      ]
    },
    { 
      id: 49, 
      name: "Soled Masti Mix", 
      category: "Snacks", 
      price: 28,
      wholesalePrice: 23,
      stock: 450,
      moq: 12,
      unit: "pack",
      description: "Spicy and tangy mixed namkeen snack.",
      image: "/images/snacks/snacks/soledmasti.png",
      bulkPricing: [
        { quantity: 1, price: 28 },
        { quantity: 20, price: 26 },
        { quantity: 50, price: 24 },
        { quantity: 100, price: 23 }
      ]
    },
    { 
      id: 50, 
      name: "Manchurian Chips", 
      category: "Snacks", 
      price: 32,
      wholesalePrice: 27,
      stock: 320,
      moq: 12,
      unit: "pack",
      description: "Crispy manchurian-flavored chips.",
      image: "/images/snacks/snacks/manchurian.png",
      bulkPricing: [
        { quantity: 1, price: 32 },
        { quantity: 20, price: 30 },
        { quantity: 50, price: 28 },
        { quantity: 100, price: 27 }
      ]
    },
    { 
      id: 51, 
      name: "Too Yumm Veggies", 
      category: "Snacks", 
      price: 35,
      wholesalePrice: 30,
      stock: 300,
      moq: 12,
      unit: "pack",
      description: "Veggie-flavored crunchy snacks from Too Yumm.",
      image: "/images/snacks/snacks/too yum veggies.png",
      bulkPricing: [
        { quantity: 1, price: 35 },
        { quantity: 20, price: 33 },
        { quantity: 50, price: 31 },
        { quantity: 100, price: 30 }
      ]
    },
    { 
      id: 52, 
      name: "Sing Bhajiya", 
      category: "Snacks", 
      price: 26,
      wholesalePrice: 22,
      stock: 380,
      moq: 12,
      unit: "pack",
      description: "Crispy sing bhajiya namkeen.",
      image: "/images/snacks/snacks/sing bhajiya.png",
      bulkPricing: [
        { quantity: 1, price: 26 },
        { quantity: 20, price: 24 },
        { quantity: 50, price: 23 },
        { quantity: 100, price: 22 }
      ]
    },
    { 
      id: 53, 
      name: "Banana Wafers", 
      category: "Snacks", 
      price: 30,
      wholesalePrice: 25,
      stock: 360,
      moq: 12,
      unit: "pack",
      description: "Classic salted banana wafers.",
      image: "/images/snacks/snacks/banana wafers.png",
      bulkPricing: [
        { quantity: 1, price: 30 },
        { quantity: 20, price: 28 },
        { quantity: 50, price: 26 },
        { quantity: 100, price: 25 }
      ]
    },
    { 
      id: 54, 
      name: "Whole Farm Grocery Masoor Dal", 
      category: "Grains", 
      price: 280,
      wholesalePrice: 240,
      stock: 150,
      moq: 2,
      unit: "bag",
      description: "Whole Farm premium red masoor dal",
      image: "/images/grocerry/Whole Farm Grocery Masoor Dal.png",
      bulkPricing: [
        { quantity: 1, price: 280 },
        { quantity: 5, price: 265 },
        { quantity: 10, price: 252 },
        { quantity: 20, price: 240 }
      ]
    },
    { 
      id: 61, 
      name: "Parle-G Original Gluco Biscuit", 
      category: "Biscuit", 
      price: 50,
      wholesalePrice: 42,
      stock: 300,
      moq: 10,
      unit: "pack",
      description: "Parle-G Original Gluco Biscuit pack",
      image: "/images/Biscuit/Parle-G Original Gluco Biscuit.png",
      bulkPricing: [
        { quantity: 1, price: 50 },
        { quantity: 10, price: 47 },
        { quantity: 20, price: 45 },
        { quantity: 50, price: 42 }
      ]
    },
    { 
      id: 62, 
      name: "Parle Marie Biscuits", 
      category: "Biscuit", 
      price: 60,
      wholesalePrice: 50,
      stock: 280,
      moq: 10,
      unit: "pack",
      description: "Parle Marie premium biscuits pack",
      image: "/images/Biscuit/Parle Marie Biscuits.png",
      bulkPricing: [
        { quantity: 1, price: 60 },
        { quantity: 10, price: 56 },
        { quantity: 20, price: 53 },
        { quantity: 50, price: 50 }
      ]
    },
    { 
      id: 63, 
      name: "Hide & Seek Chocolate Chip Cookies", 
      category: "Biscuit", 
      price: 75,
      wholesalePrice: 62,
      stock: 250,
      moq: 10,
      unit: "pack",
      description: "Hide & Seek chocolate chip cookies pack",
      image: "/images/Biscuit/Hide & Seek Chocolate Chip Cookies.png",
      bulkPricing: [
        { quantity: 1, price: 75 },
        { quantity: 10, price: 70 },
        { quantity: 20, price: 66 },
        { quantity: 50, price: 62 }
      ]
    },
    { 
      id: 64, 
      name: "Parle Premium Real Elaichi Rusk", 
      category: "Biscuit", 
      price: 85,
      wholesalePrice: 72,
      stock: 220,
      moq: 10,
      unit: "pack",
      description: "Parle Premium Real Elaichi flavored rusk",
      image: "/images/Biscuit/Parle Premium Real Elaichi Rusk.png",
      bulkPricing: [
        { quantity: 1, price: 85 },
        { quantity: 10, price: 80 },
        { quantity: 20, price: 76 },
        { quantity: 50, price: 72 }
      ]
    },
    { 
      id: 65, 
      name: "Britannia Little Hearts Classic Crunch", 
      category: "Biscuit", 
      price: 68,
      wholesalePrice: 55,
      stock: 260,
      moq: 10,
      unit: "pack",
      description: "Britannia Little Hearts Classic Crunch Biscuit",
      image: "/images/Biscuit/Britannia Little Hearts Classic Crunch Biscuit.png",
      bulkPricing: [
        { quantity: 1, price: 68 },
        { quantity: 10, price: 63 },
        { quantity: 20, price: 59 },
        { quantity: 50, price: 55 }
      ]
    },
    { 
      id: 66, 
      name: "Cadbury Oreo Vanilla Sandwich Cream Family Pack", 
      category: "Biscuit", 
      price: 95,
      wholesalePrice: 80,
      stock: 230,
      moq: 8,
      unit: "pack",
      description: "Cadbury Oreo Vanilla Sandwich Cream Biscuits Family Pack",
      image: "/images/Biscuit/Cadbury Oreo Vanilla Sandwich Cream Biscuits Family Pack.png",
      bulkPricing: [
        { quantity: 1, price: 95 },
        { quantity: 8, price: 88 },
        { quantity: 16, price: 84 },
        { quantity: 40, price: 80 }
      ]
    },
    { 
      id: 67, 
      name: "Parle Krackjack Crackers Sweet & Salty", 
      category: "Biscuit", 
      price: 58,
      wholesalePrice: 48,
      stock: 290,
      moq: 10,
      unit: "pack",
      description: "Parle Krackjack Crackers Sweet & Salty Biscuits",
      image: "/images/Biscuit/Parle Krackjack Crackers Sweet & Salty Biscuits.png",
      bulkPricing: [
        { quantity: 1, price: 58 },
        { quantity: 10, price: 54 },
        { quantity: 20, price: 51 },
        { quantity: 50, price: 48 }
      ]
    },
    { 
      id: 68, 
      name: "Parle Monaco Classic Regular Biscuit", 
      category: "Biscuit", 
      price: 52,
      wholesalePrice: 43,
      stock: 310,
      moq: 10,
      unit: "pack",
      description: "Parle Monaco Classic Regular Biscuit",
      image: "/images/Biscuit/Parle Monaco Classic Regular Biscuit.png",
      bulkPricing: [
        { quantity: 1, price: 52 },
        { quantity: 10, price: 48 },
        { quantity: 20, price: 46 },
        { quantity: 50, price: 43 }
      ]
    },
    { 
      id: 69, 
      name: "Sunfeast Dark Fantasy Choco Fills Cookies", 
      category: "Biscuit", 
      price: 88,
      wholesalePrice: 74,
      stock: 240,
      moq: 10,
      unit: "pack",
      description: "Sunfeast Dark Fantasy Choco Fills Cookies",
      image: "/images/Biscuit/Sunfeast Dark Fantasy Choco Fills Cookies.png",
      bulkPricing: [
        { quantity: 1, price: 88 },
        { quantity: 10, price: 82 },
        { quantity: 20, price: 78 },
        { quantity: 50, price: 74 }
      ]
    },
    { 
      id: 70, 
      name: "Sunfeast Glucose Plus Biscuit", 
      category: "Biscuit", 
      price: 48,
      wholesalePrice: 40,
      stock: 320,
      moq: 10,
      unit: "pack",
      description: "Sunfeast Glucose Plus Biscuit",
      image: "/images/Biscuit/Sunfeast Glucose Plus Biscuit.png",
      bulkPricing: [
        { quantity: 1, price: 48 },
        { quantity: 10, price: 45 },
        { quantity: 20, price: 42 },
        { quantity: 50, price: 40 }
      ]
    },
    { 
      id: 71, 
      name: "Alpenliebe Grande Choco Delight Eclair", 
      category: "Chocolates", 
      price: 95,
      wholesalePrice: 80,
      stock: 350,
      moq: 15,
      unit: "pack",
      description: "Alpenliebe Grande with Choco Delight Eclair candy",
      image: "/images/CHOCOLATES/Alpenliebe Grande with Choco Delight Eclair.png",
      bulkPricing: [
        { quantity: 1, price: 95 },
        { quantity: 15, price: 88 },
        { quantity: 30, price: 84 },
        { quantity: 50, price: 80 }
      ]
    },
    { 
      id: 72, 
      name: "Alpenliebe Juzt Jelly Strawberry", 
      category: "Chocolates", 
      price: 65,
      wholesalePrice: 52,
      stock: 330,
      moq: 15,
      unit: "pack",
      description: "Alpenliebe Juzt Jelly Strawberry flavour jelly candy",
      image: "/images/CHOCOLATES/Alpenliebe Juzt Jelly - Strawberry Flavour Jelly Candy.png",
      bulkPricing: [
        { quantity: 1, price: 65 },
        { quantity: 15, price: 60 },
        { quantity: 30, price: 56 },
        { quantity: 50, price: 52 }
      ]
    },
    { 
      id: 73, 
      name: "Chupa Chups Sour Bites Mixed Fruit", 
      category: "Chocolates", 
      price: 48,
      wholesalePrice: 40,
      stock: 380,
      moq: 15,
      unit: "pack",
      description: "Chupa Chups Sour Bites Mixed Fruit Candy",
      image: "/images/CHOCOLATES/Chupa Chups Sour Bites Mixed Fruit Candy.png",
      bulkPricing: [
        { quantity: 1, price: 48 },
        { quantity: 15, price: 44 },
        { quantity: 30, price: 42 },
        { quantity: 50, price: 40 }
      ]
    },
    { 
      id: 74, 
      name: "Kopiko Cappuccino Candy Family Pack", 
      category: "Chocolates", 
      price: 120,
      wholesalePrice: 100,
      stock: 280,
      moq: 15,
      unit: "pack",
      description: "Kopiko Cappuccino flavored candy family pack",
      image: "/images/CHOCOLATES/Kopiko Cappuccino Candy - Family Pack.png",
      bulkPricing: [
        { quantity: 1, price: 120 },
        { quantity: 15, price: 112 },
        { quantity: 30, price: 106 },
        { quantity: 50, price: 100 }
      ]
    },
    { 
      id: 75, 
      name: "M&M's Peanut Candy", 
      category: "Chocolates", 
      price: 180,
      wholesalePrice: 150,
      stock: 200,
      moq: 10,
      unit: "pack",
      description: "M&M's Peanut chocolate candy pack",
      image: "/images/CHOCOLATES/M&M's Peanut Candy.png",
      bulkPricing: [
        { quantity: 1, price: 180 },
        { quantity: 10, price: 170 },
        { quantity: 20, price: 160 },
        { quantity: 50, price: 150 }
      ]
    },
    { 
      id: 76, 
      name: "Parle Kaccha Mango Bite Candies Bigger", 
      category: "Chocolates", 
      price: 62,
      wholesalePrice: 52,
      stock: 360,
      moq: 15,
      unit: "pack",
      description: "Parle Kaccha Mango Bite Candies Bigger pack",
      image: "/images/CHOCOLATES/Parle Kaccha Mango Bite Candies - Bigger.png",
      bulkPricing: [
        { quantity: 1, price: 62 },
        { quantity: 15, price: 58 },
        { quantity: 30, price: 55 },
        { quantity: 50, price: 52 }
      ]
    },
    { 
      id: 77, 
      name: "Parle Kismi Assorted Candy", 
      category: "Chocolates", 
      price: 55,
      wholesalePrice: 45,
      stock: 400,
      moq: 15,
      unit: "pack",
      description: "Parle Kismi Assorted toffee candy pack",
      image: "/images/CHOCOLATES/Parle Kismi Assorted Candy.png",
      bulkPricing: [
        { quantity: 1, price: 55 },
        { quantity: 15, price: 51 },
        { quantity: 30, price: 48 },
        { quantity: 50, price: 45 }
      ]
    },
    { 
      id: 78, 
      name: "Parle Poppins Candy", 
      category: "Chocolates", 
      price: 58,
      wholesalePrice: 48,
      stock: 340,
      moq: 15,
      unit: "pack",
      description: "Parle Poppins Candy pack",
      image: "/images/CHOCOLATES/Parle Poppins Candy.png",
      bulkPricing: [
        { quantity: 1, price: 58 },
        { quantity: 15, price: 54 },
        { quantity: 30, price: 51 },
        { quantity: 50, price: 48 }
      ]
    },
    { 
      id: 79, 
      name: "Pluffs Mini Marshmallow", 
      category: "Chocolates", 
      price: 72,
      wholesalePrice: 60,
      stock: 290,
      moq: 10,
      unit: "pack",
      description: "Pluffs Mini Marshmallow candy pack",
      image: "/images/CHOCOLATES/Pluffs Mini Marshmallow.png",
      bulkPricing: [
        { quantity: 1, price: 72 },
        { quantity: 10, price: 67 },
        { quantity: 20, price: 64 },
        { quantity: 50, price: 60 }
      ]
    },
    { 
      id: 80, 
      name: "Pulse Kachcha Aam Mango Candy", 
      category: "Chocolates", 
      price: 40,
      wholesalePrice: 32,
      stock: 420,
      moq: 20,
      unit: "pack",
      description: "Pulse Kachcha Aam raw mango candy pack",
      image: "/images/CHOCOLATES/Pulse Kachcha Aam  Mango Candy.png",
      bulkPricing: [
        { quantity: 1, price: 40 },
        { quantity: 20, price: 37 },
        { quantity: 40, price: 35 },
        { quantity: 100, price: 32 }
      ]
    },
  ];

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const mapProductsFromResponse = (response) => {
    const list = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];

    return list.map(normalizeProductShape).map(normalizeProductCosts);
  };

  const fetchProducts = async ({ silent = false } = {}) => {
    if (!silent) {
      setProductsLoading(true);
    }
    setProductsError("");

    try {
      const response = await apiClient.get("/products");
      const remoteProducts = mapProductsFromResponse(response);
      setProducts(remoteProducts);
      return { success: true, data: remoteProducts };
    } catch (error) {
      setProductsError(error?.message || "Unable to load products from server.");
      if (!silent) {
        setProducts([]);
      }
      return { success: false, message: error?.message || "Unable to load products from server." };
    } finally {
      if (!silent) {
        setProductsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product) => {
    setProductsLoading(true);
    setProductsError("");

    try {
      const payload = toBackendProductPayload(product);
      console.log("POST /products payload:", payload, "types:", { moq: typeof payload.moq });
      await apiClient.post("/products", payload);
      await fetchProducts({ silent: true });
      return { success: true };
    } catch (error) {
      const message = error?.message || "Unable to create product.";
      setProductsError(message);
      return { success: false, message };
    } finally {
      setProductsLoading(false);
    }
  };

  const updateProduct = async (id, updatedProduct) => {
    const idString = String(id);

    if (!isMongoId(idString)) {
      return { success: false, message: "Invalid MongoDB product ID." };
    }

    setProductsLoading(true);
    setProductsError("");

    try {
      await apiClient.put(`/products/${encodeURIComponent(idString)}`, toBackendProductPayload(updatedProduct));
      await fetchProducts({ silent: true });
      return { success: true };
    } catch (error) {
      const message = error?.message || "Unable to update product.";
      setProductsError(message);
      return { success: false, message };
    } finally {
      setProductsLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    const idString = String(id);

    if (!isMongoId(idString)) {
      return { success: false, message: "Invalid MongoDB product ID." };
    }

    setProductsLoading(true);
    setProductsError("");

    try {
      await apiClient.delete(`/products/${encodeURIComponent(idString)}`);
      await fetchProducts({ silent: true });
      return { success: true };
    } catch (error) {
      const message = error?.message || "Unable to delete product.";
      setProductsError(message);
      return { success: false, message };
    } finally {
      setProductsLoading(false);
    }
  };

  const updateStock = async (id, newStock, extraUpdates = {}) => {
    const idString = String(id);

    if (!isMongoId(idString)) {
      return { success: false, message: "Invalid MongoDB product ID." };
    }

    const targetStock = Number(newStock);
    if (!Number.isFinite(targetStock) || targetStock < 0) {
      return { success: false, message: "Stock must be a valid number greater than or equal to 0." };
    }

    const currentProduct = (products || []).find(
      (product) => String(product.id) === idString || String(product._id || "") === idString
    );
    const currentStock = Number(currentProduct?.stock || 0);
    const delta = targetStock - currentStock;

    setProductsLoading(true);
    setProductsError("");

    try {
      if (delta > 0) {
        await apiClient.patch(`/products/${encodeURIComponent(idString)}/stock/increment`, { quantity: delta });
      } else if (delta < 0) {
        await apiClient.patch(`/products/${encodeURIComponent(idString)}/stock/decrement`, { quantity: Math.abs(delta) });
      }

      if (extraUpdates?.purchaseCost != null) {
        await apiClient.put(`/products/${encodeURIComponent(idString)}`, {
          purchasePrice: Number(extraUpdates.purchaseCost),
        });
      }

      await fetchProducts({ silent: true });
      return { success: true };
    } catch (error) {
      const message = error?.message || "Unable to update stock.";
      setProductsError(message);
      return { success: false, message };
    } finally {
      setProductsLoading(false);
    }
  };

  const validateStockForOrder = (orderItems) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return { ok: true, shortages: [] };
    }

    const shortages = [];
    orderItems.forEach((item) => {
      const itemId = String(item?.id ?? item?._id ?? "");
      const product = (products || []).find(
        (entry) => String(entry.id) === itemId || String(entry._id || "") === itemId
      );

      if (!product) {
        shortages.push({
          id: itemId,
          name: item?.name || "Product",
          requested: Number(item?.quantity || 0),
          available: 0,
          reason: "not_found",
        });
        return;
      }

      const requested = Number(item?.quantity || 0);
      const available = Number(product.stock || 0);
      if (requested > available) {
        shortages.push({
          id: product.id,
          name: product.name,
          requested,
          available,
          reason: "insufficient_stock",
        });
      }
    });

    return {
      ok: shortages.length === 0,
      shortages,
    };
  };

  const deductStockForOrder = (orderItems, options = {}) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return;
    }

    const { syncBackend = true } = options;

    const quantityById = orderItems.reduce((acc, item) => {
      const key = item?.id;
      if (key == null) return acc;
      const qty = Number(item?.quantity || 0);
      if (!Number.isFinite(qty) || qty <= 0) return acc;
      acc[key] = (acc[key] || 0) + qty;
      return acc;
    }, {});

    const stockUpdates = [];

    setProducts((prevProducts) =>
      (prevProducts || []).map((product) => {
        const qty = quantityById[product.id];
        if (!qty) return product;
        const currentStock = Number(product.stock || 0);
        const nextStock = Math.max(currentStock - qty, 0);
        if (nextStock === currentStock) return product;
        stockUpdates.push({ id: product.id, quantity: currentStock - nextStock });
        return { ...product, stock: nextStock };
      })
    );

    if (!syncBackend) {
      return;
    }

    stockUpdates.forEach((entry) => {
      if (isMongoId(entry.id)) {
        apiClient.patch(`/products/${encodeURIComponent(entry.id)}/stock/decrement`, { quantity: entry.quantity }).catch(() => {
          // Ignore stock sync errors here; local checkout should not fail.
        });
      }
    });
  };

  const getPriceForQuantity = (productId, quantity) => {
    const product = (products || []).find((p) => p.id === productId);
    if (!product) return 0;
    const bulkPricing = Array.isArray(product.bulkPricing) && product.bulkPricing.length > 0
      ? product.bulkPricing
      : [{ quantity: 1, price: Number(product.price || 0) }];

    // Find the applicable bulk price
    let applicablePrice = Number(bulkPricing[0].price || 0);
    for (const tier of bulkPricing) {
      if (quantity >= tier.quantity) {
        applicablePrice = tier.price;
      }
    }
    return applicablePrice;
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      productsLoading,
      productsError,
      refreshProducts: fetchProducts,
      addProduct, 
      updateProduct, 
      deleteProduct, 
      updateStock,
      validateStockForOrder,
      deductStockForOrder,
      getPriceForQuantity 
    }}>
      {children}
    </ProductContext.Provider>
  );
}