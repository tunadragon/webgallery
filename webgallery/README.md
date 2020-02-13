# Webgallery REST API Documentation

## Image API

### Create
- **Description**: Add a new image to the gallery
- **Request**: `POST /api/images/`
    - **Content-type**: `multipart/form-data`
    - **Body**:
        - title: (text)
        - author: (text)
        - file: (file)
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - \_id: (string)
- **Response**: 400
    - **Content-type**: `application/json`
    - **Body**: object
        - message: "Request body is missing arguments."
```
$ curl -X POST 'http://localhost:3000/api/images/' \
    -H 'Content-Type: multipart/form-data' \
    -F 'title=Mood' \
    -F 'author=Me' \
    -F 'picture=@/Users/Me/Desktop/mood.jpg'
```

### Read
- **Description**: Get a specific image from the gallery given its image id
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
- **Response**: 404
    - **Content-type**: `application/json`
    - **Body**: object
        - message: "Image does not exist."
```
$ curl http://localhost:3000/api/images/fzMAglAGAvY6yopH/
```
- **Description**: Get the picture file of a specific image given its image id
- **Request**: `GET api/images/:imageId/picture`
- **Response**: 200
    - **Content-type**: `image/*`
    - **Body**: file
- **Response**: 404
    - **Content-type**: `application/json`
    - **Body**: object
        - message: "Image does not exist."
```
$ curl http://localhost:3000/api/images/fzMAglAGAvY6yopH/picture/
```
- **Description**: Get all images from the gallery
- **Request**: `GET api/images/`
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
```
$ curl http://localhost:3000/api/images/
```

### Delete
- **Description**: Delete a specific image given its image id
- **Request**: `DELETE /api/images/:imageId/`
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - \_id: (string)
- **Response**: 404
    - **Content-type**: `application/json`
    - **Body**: object
        - message: "Image does not exist."
```
$ curl -X DELETE http://localhost:3000/api/images/fzMAglAGAvY6yopH/
```

## Comment API

### Create
- **Description**: Add a comment to a given image
- **Request**: `POST api/images/:imageId/comments/`
    - **Content-type**: `application/json`
    - **Body**: object
        - author: (string)
        - content: (string)
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - \_id: (string)
- **Response**: 400
    - **Content-type**: `application/json`
    - **Body**: object
        - message: "Request body is missing arguments."
- **Response**: 404
    - **Content-type**: `application/json`
    - **Body**: object
        - message: "Image does not exist."
```
$ curl -X POST 'http://localhost:3000/api/images/fzMAglAGAvY6yopH/comments/' \
    -H 'Content-Type: application/json' \
    -d '{"author": "Me", "content": "Hello world"}'
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
- **Response**: 404
    - **Content-type**: `application/json`
    - **Body**: object
        - message: "Image does not exist."
```
$ curl http://localhost:3000/api/images/fzMAglAGAvY6yopH/comments?page=1/
```

### Delete
- **Description**: Delete a specific comment given its comment id
- **Request**: `DELETE /api/comments/:commentId/`
- **Response**: 200
    - **Content-type**: `application/json`
    - **Body**: object
        - \_id: (string)
- **Response**: 404
    - **Content-type**: `application/json`
    - **Body**: object
        - message: "Comment does not exist."
```
$ curl -X DELETE http://localhost:3000/api/comments/hukaBoFs1P9H9nTr/
```
