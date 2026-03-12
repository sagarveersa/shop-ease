# Run this file from the root of the project to start the nginx gateway container. It will run on port 80 and use the nginx.conf file in the same directory.

if [ "$(docker ps -aq -f name=nginx-gateway)" ]; then
    docker stop nginx-gateway && docker rm nginx-gateway
fi

docker run -d -p 80:80 -p 443:443 --name nginx-gateway \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:latest