# Run this file from the root of the project to start the chat container. It will build the image and run it on port 80.

if [ "$(docker ps -aq -f name=shop-ease-chat-container)" ]; then
    docker stop shop-ease-chat-container && docker rm shop-ease-chat-container
fi

docker build -t shop-ease-chat . && \
docker run -d --name shop-ease-chat-container -p 80:8004 shop-ease-chat