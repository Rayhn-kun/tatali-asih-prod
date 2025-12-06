FROM node:20-alpine

WORKDIR /usr/src/app

COPY apps/api/package*.json ./
RUN npm install

COPY apps/api/ .
COPY backend/ ./backend/

RUN npm run build || true

COPY apps/api/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
