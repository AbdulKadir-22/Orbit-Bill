# FLUX Backend API

A clean, modular RESTful backend built with **Node.js, Express.js, MongoDB, and Mongoose** adhering to the MVC (Model-View-Controller) design pattern.

---

## Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection configuration
│   ├── modules/
│   │   └── users/
│   │       ├── user.model.js     # Mongoose schema and model
│   │       ├── user.controller.js# Request handling & business logic
│   │       ├── user.routes.js    # API route definitions & Swagger annotations
│   │       └── user.validation.js# Input validation middlewares
│   ├── middlewares/
│   │   └── error.middleware.js   # Centralized error handler
│   ├── app.js                    # Express application setup & middleware assembly
│   └── server.js                 # Server entrypoint and DB initialization
├── .env                          # Local environment variables
├── .env.example                  # Example template for environment variables
├── .gitignore                    # Git ignore file
├── package.json                  # Dependencies and npm scripts
└── README.md                     # Project documentation
```

---

## Features

- **Modular MVC Architecture**: Separate folders for models, controllers, routes, validations, configs, and middlewares.
- **Complete CRUD Operations**: Full CRUD suite for the Users resource.
- **Request Validation**: Validation middleware ensuring data integrity and clean user feedback before reaching the database.
- **Centralized Error Handling**: Unified JSON error responses for validation, cast errors, duplicate keys, and unexpected server failures.
- **Interactive API Documentation**: Swagger UI documentation generated using `swagger-jsdoc` and `swagger-ui-express`.
- **Environment Driven**: Configurations managed via `.env` with `dotenv`.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection string

### 1. Installation

Install all required dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` if necessary:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/flux_db
NODE_ENV=development
```

### 3. Running the Server

#### Development Mode (with auto-restart via Nodemon)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

---

## API Documentation

When the server is running, access the interactive Swagger UI API documentation at:

- **Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

### API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API health check |
| `POST` | `/api/users` | Create a new user |
| `GET` | `/api/users` | Retrieve all users |
| `GET` | `/api/users/:id` | Retrieve a user by ID |
| `PUT` | `/api/users/:id` | Update an existing user by ID |
| `DELETE` | `/api/users/:id` | Delete a user by ID |

---

## Example Request Payloads

### Create User (`POST /api/users`)
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "age": 28
}
```

### Update User (`PUT /api/users/:id`)
```json
{
  "name": "Jane Smith",
  "age": 29
}
```
