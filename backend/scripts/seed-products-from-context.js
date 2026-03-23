const fs = require('fs');
const path = require('path');
const { connectDB, getDB, client } = require('../config/db');

function extractInitialProductsArray(source) {
  const marker = 'const initialProducts = [';
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Could not find initialProducts array in ProductContext.jsx');
  }

  const arrayStart = source.indexOf('[', markerIndex);
  if (arrayStart === -1) {
    throw new Error('Could not find array start for initialProducts');
  }

  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '[') depth += 1;
    if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    throw new Error('Could not find array end for initialProducts');
  }

  return source.slice(arrayStart, arrayEnd + 1);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toProductDoc(product = {}) {
  const price = toNumber(product.price, 0);
  const wholesalePrice = toNumber(
    product.wholesalePrice ?? product.purchasePrice ?? product.purchaseCost ?? price,
    price
  );
  const purchasePrice = toNumber(
    product.purchasePrice ?? product.purchaseCost ?? wholesalePrice,
    wholesalePrice
  );

  return {
    name: String(product.name || '').trim(),
    category: product.category || 'Others',
    price,
    purchasePrice,
    wholesalePrice,
    sellCost: toNumber(product.sellCost ?? price, price),
    moq: toNumber(product.moq ?? product.MOQ ?? 1, 1),
    stock: Math.max(0, toNumber(product.stock, 0)),
    unit: product.unit || 'unit',
    description: product.description || '',
    image: product.image || '',
    updatedAt: new Date(),
  };
}

async function run() {
  const frontendContextPath = path.resolve(__dirname, '../../Frontend/src/context/ProductContext.jsx');
  const source = fs.readFileSync(frontendContextPath, 'utf8');
  const arrayLiteral = extractInitialProductsArray(source);

  let products;
  try {
    products = new Function(`return (${arrayLiteral});`)();
  } catch (error) {
    throw new Error(`Failed to parse initialProducts array: ${error.message}`);
  }

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('No products found in initialProducts array');
  }

  await connectDB();
  const db = getDB();
  const collection = db.collection('products');

  const docs = products
    .map(toProductDoc)
    .filter((entry) => entry.name.length > 0);

  const operations = docs.map((doc) => ({
    updateOne: {
      filter: { name: doc.name },
      update: {
        $set: doc,
        $setOnInsert: { createdAt: new Date() },
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });

  console.log(`Seed complete. Source products: ${products.length}`);
  console.log(
    `Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`
  );
}

run()
  .catch((error) => {
    console.error('Seed failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
  });
