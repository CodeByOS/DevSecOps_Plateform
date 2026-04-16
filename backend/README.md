# SecOps Platform Backend

This is the backend for the SecOps Platform, a CI/CD pipeline with integrated security features. The application is built using Express.js and MongoDB with Mongoose, following the MVC architecture.

## Project Structure

```
secops-platform-backend
├── src
│   ├── server.js               # Entry point of the application
│   ├── app.js                  # Express application setup
│   ├── config
│   │   └── database.js         # MongoDB connection configuration
│   ├── controllers
│   │   ├── auth.controller.js   # User authentication logic
│   │   ├── project.controller.js # Project management logic
│   │   └── pipeline.controller.js # Pipeline management logic
│   ├── models
│   │   ├── User.model.js        # User schema
│   │   ├── Project.model.js     # Project schema
│   │   ├── Pipeline.model.js     # Pipeline schema
│   │   └── AuditLog.model.js    # Audit log schema
│   ├── routes
│   │   ├── index.js            # Route setup
│   │   ├── auth.routes.js       # Authentication routes
│   │   ├── project.routes.js     # Project routes
│   │   └── pipeline.routes.js    # Pipeline routes
│   ├── middleware
│   │   ├── errorHandler.js      # Error handling middleware
│   │   └── notFound.js          # 404 handling middleware
│   └── utils
│       └── ApiError.js          # Custom error class
├── .env                         # Environment variables
├── .env.example                 # Example environment variables
├── package.json                 # NPM dependencies and scripts
└── README.md                    # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd secops-platform-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and update the MongoDB connection string.

### Running the Application

To start the application in development mode, run:
```
npm run dev
```

### API Endpoints

- **Authentication**
  - `POST /api/auth/register` - Register a new user
  - `POST /api/auth/login` - Log in an existing user

- **Projects**
  - `POST /api/projects` - Create a new project
  - `GET /api/projects` - Retrieve all projects
  - `GET /api/projects/:id` - Retrieve a specific project
  - `PUT /api/projects/:id` - Update a specific project
  - `DELETE /api/projects/:id` - Delete a specific project

- **Pipelines**
  - `POST /api/pipelines` - Create a new pipeline
  - `GET /api/pipelines` - Retrieve all pipelines

### Error Handling

The application includes basic error handling for invalid requests and 404 errors. Custom error messages are returned in the response.

### License

This project is licensed under the MIT License.