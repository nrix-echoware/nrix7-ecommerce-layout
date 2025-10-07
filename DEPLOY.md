docker compose -f docker-compose.prod.yml build

docker save ecommerce-backend-prod -o ecommerce-backend-prod.tar

docker load -i ecommerce-backend-prod.tar
