# Criar container
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



