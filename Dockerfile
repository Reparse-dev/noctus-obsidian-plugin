# Beziehst Image von Node, führt commits aus um die js Datei zu fertigen. Kopiere die Sachen bei :/app rein/mirrore es. 
# Stichworte: 
# Dockerfile "from node:latest s build" 
# Alternatively dev container, VSCodium incompatible? container with IDE (VSCodium) works
# To start Dockerfile: sudo docker build -t npm-build && docker run --rm npm-build
FROM node:alpine
WORKDIR /app
COPY . .
RUN npm run dev