# Run this file from the root of the project to start the Django and Celery containers. It will build the image and run the Django container on port 80 and the Celery worker in the background.

if [ "$(docker ps -aq -f name=shop-ease-django-container)" ]; then
    docker stop shop-ease-django-container && docker rm shop-ease-django-container
fi

if [ "$(docker ps -aq -f name=shop-ease-celery-worker)" ]; then
    docker stop shop-ease-celery-worker && docker rm shop-ease-celery-worker
fi

docker build -t shop-ease-django . && \
docker run -d --name shop-ease-django-container -p 80:8000 shop-ease-django

echo "shop-ease-django-container ran successfully"

docker run -d \
--name shop-ease-celery-worker \
shop-ease-django \
celery -A core worker --loglevel=info