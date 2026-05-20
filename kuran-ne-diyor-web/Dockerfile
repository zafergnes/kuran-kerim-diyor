FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install lightningcss-linux-x64-musl
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]