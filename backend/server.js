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
const paymentRoutes = require('./routes/paymentroutes');
const orderRoutes = require('./routes/orderroutes');
const deliveryRoutes = require('./routes/deliveryroutes');
const loginRoutes = require('./routes/loginroutes');
const contactRoutes = require('./routes/contactroutes');
const plannedRoutes = require('./routes/plannedroutes');
const authRoutes = require('./routes/authRoute');
// Use Routes
app.use('/', userRoutes);

app.use('/', productRoutes);
app.use('/', orderRoutes);
app.use('/', contactRoutes);
app.use('/', loginRoutes);
app.use('/', authRoutes);
app.use('/', paymentRoutes);
app.use('/', deliveryRoutes);
app.use('/', plannedRoutes);

// Planned API namespace
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api', contactRoutes);
app.use('/api', loginRoutes);
app.use('/api', paymentRoutes);
app.use('/api', deliveryRoutes);
app.use('/api', plannedRoutes);

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
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Error Handler (Always keep at last)
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  app.listen(5000, () => {
    console.log("Server running at http://localhost:5000");
  });
};

startServer();