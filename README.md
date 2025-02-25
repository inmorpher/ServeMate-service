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

## Example Usage

For making requests, you can use tools like Postman or cURL. For example, to log in:

```bash
curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "userPassword"}'
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
