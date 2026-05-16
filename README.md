# API Documentation

This guide describes the API of our service. Below are examples of endpoints provided by the API along with details on the accepted parameters and returned responses.

## Overview

The API is built on Node.js (TypeScript) and follows RESTful principles. All endpoints return data in JSON format. When creating or updating resources, please send the data in JSON format.

## Authentication Endpoints

### POST /auth/login

- **Description:** Authenticates a user.
- **Request Body:**
  ```json
  {
  	"email": "user@example.com",
  	"password": "userPassword"
  }
  ```
- **Successful Response:**
  ```json
  {
  	"token": "jwt_token",
  	"user": {
  		"id": "user_id",
  		"email": "user@example.com"
  	}
  }
  ```

### POST /auth/register

- **Description:** Registers a new user.
- **Request Body:**
  ```json
  {
  	"name": "User Name",
  	"email": "user@example.com",
  	"password": "userPassword"
  }
  ```
- **Successful Response:**
  ```json
  {
  	"id": "new_user_id",
  	"name": "User Name",
  	"email": "user@example.com"
  }
  ```

## User Endpoints

### GET /users

- **Description:** Retrieves a list of all users.
- **Query Parameters:** None
- **Successful Response:**
  ```json
  [
  	{
  		"id": "user_id",
  		"name": "User Name",
  		"email": "user@example.com"
  	}
  	// ... other users ...
  ]
  ```

### GET /users/:id

- **Description:** Retrieves information for a specific user by ID.
- **URL Parameters:**
  - id: The user identifier
- **Successful Response:**
  ```json
  {
  	"id": "user_id",
  	"name": "User Name",
  	"email": "user@example.com"
  }
  ```

### POST /users

- **Description:** Creates a new user.
- **Request Body:**
  ```json
  {
  	"name": "User Name",
  	"email": "user@example.com",
  	"password": "userPassword"
  }
  ```
- **Successful Response:**
  ```json
  {
  	"id": "new_user_id",
  	"name": "User Name",
  	"email": "user@example.com"
  }
  ```

### PUT /users/:id

- **Description:** Updates a user's information.
- **URL Parameters:**
  - id: The user identifier
- **Request Body:** May include one or more of the following fields:
  ```json
  {
  	"name": "New Name",
  	"email": "new_email@example.com",
  	"password": "newPassword"
  }
  ```
- **Successful Response:**
  ```json
  {
  	"id": "user_id",
  	"name": "New Name",
  	"email": "new_email@example.com"
  }
  ```

### DELETE /users/:id

- **Description:** Deletes a user.
- **URL Parameters:**
  - id: The user identifier
- **Successful Response:**
  ```json
  {
  	"message": "User successfully deleted."
  }
  ```

## Order Endpoints

### GET /orders

- **Description:** Retrieves a list of orders with support for filtering and sorting, including by price.
- **Query Parameters:**
  - `page` (optional, default: 1): Page number for pagination
  - `pageSize` (optional, default: 10, max: 100): Number of orders per page
  - `tableNumbers` (optional): Comma-separated table numbers or array
  - `serverId` (optional): Server ID to filter by
  - `serverName` (optional): Server name to filter by (case-insensitive)
  - `status` (optional): Order status (RECEIVED, AWAITING, COMPLETED, CANCELLED, etc.)
  - `minAmount` (optional): Minimum order total amount
  - `maxAmount` (optional): Maximum order total amount
  - `dateFrom` (optional): Filter orders from this date (ISO format)
  - `dateTo` (optional): Filter orders until this date (ISO format)
  - `allergies` (optional): Comma-separated allergies or array
  - `sortBy` (optional, default: 'id'): Field to sort by. Available options:
    - `id` - Sort by order ID
    - `tableNumber` - Sort by table number
    - `guestsCount` - Sort by number of guests
    - `orderTime` - Sort by order time
    - `updatedAt` - Sort by last update time
    - `status` - Sort by order status
    - **`totalAmount` - Sort by order total price** ⭐
  - `sortOrder` (optional, default: 'asc'): Sort order - 'asc' for ascending, 'desc' for descending

- **Example Requests:**

  Sort by price ascending (lowest to highest):
  ```
  GET /orders?sortBy=totalAmount&sortOrder=asc&pageSize=20
  ```

  Sort by price descending (highest to lowest):
  ```
  GET /orders?sortBy=totalAmount&sortOrder=desc&pageSize=20
  ```

  Sort by price with filters:
  ```
  GET /orders?sortBy=totalAmount&sortOrder=desc&minAmount=50&maxAmount=500&page=1&pageSize=10
  ```

- **Successful Response:**
  ```json
  {
    "orders": [
      {
        "id": 1,
        "tableNumber": 5,
        "guestsCount": 4,
        "orderTime": "2024-05-15T10:30:00.000Z",
        "updatedAt": "2024-05-15T10:45:00.000Z",
        "status": "COMPLETED",
        "totalAmount": 125.50,
        "discount": 0,
        "tip": 0,
        "comments": null,
        "completionTime": "2024-05-15T10:45:00.000Z",
        "server": {
          "id": 1,
          "name": "John Doe"
        }
      }
    ],
    "priceRange": {
      "min": 50,
      "max": 500
    },
    "dateRange": {
      "min": "2024-05-01T00:00:00.000Z",
      "max": "2024-05-15T23:59:59.000Z"
    },
    "totalCount": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
  ```

### GET /orders/:id

- **Description:** Retrieves detailed information for a specific order by ID.
- **URL Parameters:**
  - id: The order identifier
- **Successful Response:** Returns full order details with all associated items and metadata.

## Example Usage

For making requests, you can use tools like Postman or cURL. For example, to get orders sorted by price (highest to lowest):

```bash
curl -X GET "http://localhost:3000/orders?sortBy=totalAmount&sortOrder=desc&pageSize=10" \
     -H "Authorization: Bearer YOUR_TOKEN"
```

To get orders sorted by price (lowest to highest) with amount filtering:

```bash
curl -X GET "http://localhost:3000/orders?sortBy=totalAmount&sortOrder=asc&minAmount=50&maxAmount=500" \
     -H "Authorization: Bearer YOUR_TOKEN"
```

## Errors

In case of an error, the API returns an object with an `error` field:

```json
{
	"error": "Error description"
}
```

## Conclusion

This documentation covers the basic endpoints of the API. For more details on additional routes or implementation specifics, please refer to the project source code.

## MCP Server

The project also includes an MCP server for read-only access to the database through Claude Desktop or any MCP-compatible client.

### Run in development

```bash
npm run mcp
```

### Run in Docker

For a separate container attached to your MCP client, use `run --rm`:

```bash
docker compose run --rm mcp
```

For the dev compose file:

```bash
docker compose -f docker-compose.dev.yml run --rm mcp
```

### Available tools

- `api_catalog` - returns the full catalog of methods with their inputs and outputs.
