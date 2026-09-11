# Criar container
# Defina as variaveis necessarias antes do deploy:
#   export APP_KEY="$(php artisan key:generate --show)"   # gere um APP_KEY unico e obrigatorio
#   export MICROSOFT_CLIENT_ID="..."
#   export MICROSOFT_CLIENT_SECRET="..."
#   export MICROSOFT_TENANT_ID="..."
#   export MICROSOFT_REDIRECT_URI="https://okrcafaz.cafazonline.org.br/api/v1/auth/microsoft/callback"
#   export FRONTEND_URL="https://okrcafaz.cafazonline.org.br/"
docker compose -f docker-compose.prod.yml up -d --build

# atualizar banco
docker compose -f docker-compose.prod.yml up -d --pull always mysql

### front
```
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### back
```
docker compose -f docker-compose.prod.yml up -d --build backend
```







