const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const errorHandler = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/db');

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Allow frontend dev server to call backend APIs across ports.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// Import Routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productroutes');
const registerRoutes = require('./routes/registerroutes');
const paymentRoutes = require('./routes/paymentroutes');
const orderRoutes = require('./routes/orderroutes');

const loginRoutes = require('./routes/loginroutes');
const contactRoutes = require('./routes/contactroutes');
// Use Routes
app.use('/', userRoutes);

app.use('/', productRoutes);
app.use('/', orderRoutes);
app.use('/', contactRoutes);
app.use('/', loginRoutes);
app.use('/', registerRoutes);
app.use('/', paymentRoutes);


// Swagger Setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User, Product, Order, Payment, Delivery API",   
      version: "1.0.0",
      description: "Express API with User, Product, Order, Payment and Delivery details"
    },
    servers: [
      {
        url: `http://localhost:${PORT}`
      }
    ]
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error Handler (Always keep at last)
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();