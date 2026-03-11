# Run this file from the root of the project to start the frontend container. It will build the image and run it on port 80.

if [ "$(docker ps -aq -f name=shop-ease-frontend-container)" ]; then
    docker stop shop-ease-frontend-container && docker rm shop-ease-frontend-container
fi

set -a && source .env && set +a && \
docker build -t shop-ease-frontend \
  --build-arg VITE_API_URL \
  --build-arg VITE_CHAT_API_URL \
  --build-arg VITE_MIXPANEL_PROJECT_TOKEN \
  --build-arg VITE_AUTH0_AUDIENCE \
  --build-arg VITE_AUTH0_DOMAIN \
  --build-arg VITE_AUTH0_CLIENT_ID \
  . && \
docker run -p 80:80 --name shop-ease-frontend-container shop-ease-frontend