# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (otimiza o cache do Docker)
COPY package*.json ./
RUN npm install

# Copia o resto do projeto
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# Roda o servidor liberando o acesso para fora do container
CMD ["npm", "run", "dev", "--", "--host"]