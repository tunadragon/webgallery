# Webgallery REST API Documentation

## User API

### Create
- **Description**: Create a new user account (sign up)
- **Request**: `POST /signup/`
    - **Content-type**: `application/json`
    - **Body**:
        - username: (text)
        - password: (text)
- **Response**: 200
    - **Body**: "Account successfully created."
- **Response**: 400
    - **Body**: "Request body is missing arguments." or "Username and password cannot be empty."
- **Response**: 409
    - **Body**: "Username already exists."
```
$ curl -X POST 'http://localhost:3000/signup/' \
    -H 'Content-Type: application/json' \
    -d '{"username": "tunadragon", "password": "swordfish"}'
```

- **Description**: Create session for an existing user (sign in)
- **Request**: `POST /signin/`
    - **Content-type**: `application/json`
    - **Body**:
        - username: (text)
        - password: (text)
- **Response**: 200
    - **Body**: "User has been signed in."
- **Response**: 400
    - **Body**: "Request body is missing arguments."
- **Response**: 401
    - **Body**: "Access denied."
```
$ curl -X POST 'http://localhost:3000/signin/' \
    -H 'Content-Type: application/json' \
    -d '{"username": "tunadragon", "password": "swordfish"}'
```

### Read
- **Description**: Get a specific page of usernames (each page has 10 usernames). If no page number is given, then get all usernames.
- **Request**: `GET /api/users/[?page=0]`
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: list of objects
        - \_id: (string)
        - createdAt: (string)
```
$ curl http://localhost:3000/api/users?page=0/
```

### Delete
- **Description**: Delete session for a user (sign out)
- **Request**: `DELETE /signout/`
- **Response**: 200
    - **Body**: "User has been signed out."
```
$ curl -X DELETE 'http://localhost:3000/signout/'
```

## Image API

### Create
- **Description**: Add a new image to the current authenticated user's gallery
- **Request**: `POST /api/images/`
    - **Content-type**: `multipart/form-data`
    - **Body**:
        - title: (text)
        - picture: (file)
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - title: (string)
        - author: (string)
        - path: (string)
        - mimetype: (string)
        - \_id: (string)
        - createdAt: (string)
        - updatedAt: (string)
- **Response**: 400
    - **Body**: "Request body is missing arguments."
- **Response**: 401
    - **Body**: "Access denied."
```
$ curl -X POST 'http://localhost:3000/api/images/' \
    -H 'Content-Type: multipart/form-data' \
    -F 'title=Mood' \
    -F 'author=Me' \
    -F 'picture=@/Users/Me/Desktop/mood.jpg'
```

### Read
- **Description**: Get a specific image given its image id (must be authenticated)
- **Request**: `GET api/images/:imageId/`
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - title: (string)
        - author: (string)
        - path: (string)
        - mimetype: (string)
        - \_id: (string)
        - createdAt: (string)
        - updatedAt: (string)
- **Response**: 401
    - **Body**: "Access denied."
- **Response**: 404
    - **Body**: "Image does not exist."
```
$ curl http://localhost:3000/api/images/fzMAglAGAvY6yopH/
```
- **Description**: Get the picture file of a specific image given its image id (must be authenticated)
- **Request**: `GET api/images/:imageId/picture`
- **Response**: 200
    - **Content-type**: `image/*`
    - **Body**: file
- **Response**: 401
    - **Body**: "Access denied."
- **Response**: 404
    - **Body**: "Image does not exist."
```
$ curl http://localhost:3000/api/images/fzMAglAGAvY6yopH/picture/
```
- **Description**: Get all images from a given user's gallery (must be authenticated)
- **Request**: `GET api/users/:username/images/`
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: list of objects
        - title: (string)
        - author: (string)
        - path: (string)
        - mimetype: (string)
        - \_id: (string)
        - createdAt: (string)
        - updatedAt: (string)
- **Response**: 401
    - **Body**: "Access denied."
```
$ curl http://localhost:3000/api/users/tunadragon/images/
```

### Delete
- **Description**: Delete a specific image given its image id (authenticated user must be the author of that image)
- **Request**: `DELETE /api/images/:imageId/`
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - title: (string)
        - author: (string)
        - path: (string)
        - mimetype: (string)
        - \_id: (string)
        - createdAt: (string)
        - updatedAt: (string)
- **Response**: 401
    - **Body**: "Access denied."
- **Response**: 404
    - **Body**: "Image does not exist."
```
$ curl -X DELETE http://localhost:3000/api/images/fzMAglAGAvY6yopH/
```

## Comment API

### Create
- **Description**: Add a comment to a given image (authenticated user will be the author)
- **Request**: `POST api/images/:imageId/comments/`
    - **Content-type**: `application/json`
    - **Body**: object
        - content: (string)
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - imageId: (string)
        - author: (string)
        - content: (string)
        - \_id: (string)
        - createdAt: (string)
        - updatedAt: (string)
- **Response**: 400
    - **Body**: "Request body is missing arguments."
- **Response**: 401
    - **Body**: "Access denied."
- **Response**: 404
    - **Body**: "Image does not exist."
```
$ curl -X POST 'http://localhost:3000/api/images/fzMAglAGAvY6yopH/comments/' \
    -H 'Content-Type: application/json' \
    -d '{"content": "Hello world"}'
```

### Read
- **Description**: Get a specific page of comments for a given image (each page has 10 comments). If no page number is given, then get all the comments for the image.
- **Request**: `GET /api/images/:imageId/comments/[?page=0]`
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: list of objects
        - author: (string)
        - content: (string)
        - imageId: (string)
        - \_id: (string)
        - createdAt: (string)
        - updatedAt: (string)
- **Response**: 401
    - **Body**: "Access denied."
- **Response**: 404
    - **Body**: "Image does not exist."
```
$ curl http://localhost:3000/api/images/fzMAglAGAvY6yopH/comments?page=1/
```

### Delete
- **Description**: Delete a specific comment given its comment id (must be authenticated as the comment author or the author of the image the comment is under)
- **Request**: `DELETE /api/comments/:commentId/`
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - imageId: (string)
        - author: (string)
        - content: (string)
        - \_id: (string)
        - createdAt: (string)
        - updatedAt: (string)
- **Response**: 401
    - **Body**: "Access denied."
- **Response**: 404
    - **Body**: "Comment does not exist."
```
$ curl -X DELETE http://localhost:3000/api/comments/hukaBoFs1P9H9nTr/
```
