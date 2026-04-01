const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const errorHandler = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/db');
const cors = require('cors');

const app = express();
const port = Number(process.env.PORT || 5000);
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((value) => value.trim()) : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Import Routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productroutes');
const paymentRoutes = require('./routes/paymentroutes');
const paymentConfirmationRoutes = require('./routes/paymentconformationroute');
const orderRoutes = require('./routes/orderroutes');
const deliveryRoutes = require('./routes/deliveryroutes');
const loginRoutes = require('./routes/loginroutes');
const authRoutes = require('./routes/authRoute');
const expenseRoutes = require('./routes/expensesroutes');
const plannedRoutes = require('./routes/plannedroutes');
const contactRoutes = require('./routes/contactroutes');
const vendorRoutes = require('./routes/vendorroutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Swagger Setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wholesale Store API',
      version: '1.0.0',
      description: 'Express API with User, Product, Order, Payment and Delivery modules',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Direct routes',
      },
      {
        url: `http://localhost:${port}/api`,
        description: 'API namespace routes',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: [path.join(__dirname, 'routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Use Routes
app.use('/', userRoutes);
app.use('/', authRoutes);
app.use('/', expenseRoutes);
app.use('/', productRoutes);
app.use('/', orderRoutes);
app.use('/', contactRoutes);
app.use('/', vendorRoutes);
app.use('/', loginRoutes);
app.use('/', paymentRoutes);
app.use('/', paymentConfirmationRoutes);
app.use('/', deliveryRoutes);
app.use('/', plannedRoutes);
app.use('/', whatsappRoutes);

// Planned API namespace
app.use('/api', loginRoutes);
app.use('/api', authRoutes);
app.use('/api', expenseRoutes);
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api', contactRoutes);
app.use('/api', vendorRoutes);
app.use('/api', paymentRoutes);
app.use('/api', paymentConfirmationRoutes);
app.use('/api', deliveryRoutes);
app.use('/api', plannedRoutes);
app.use('/api', whatsappRoutes);

// Error Handler (Always keep at last)
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message || error);
    process.exit(1);
  }
};

startServer();