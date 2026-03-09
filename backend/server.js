const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const errorHandler = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/db');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Import Routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productroutes');
const registerRoutes = require('./routes/registerroutes');
const paymentRoutes = require('./routes/paymentroutes');
const orderRoutes = require('./routes/orderroutes');
const deliveryRoutes = require('./routes/deliveryroutes');
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
app.use('/', deliveryRoutes);

// Swagger Setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User, Product, Order, Payment, Delivery API",   
      version: "1.0.0",
      description: "Express API with User, Product "
    },
    servers: [
      {
        url: "http://localhost:5000"
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

  app.listen(5000, () => {
    console.log("Server running at http://localhost:5000");
  });
};

startServer();