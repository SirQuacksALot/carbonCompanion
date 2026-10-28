# Carbon Companion — statischer Server ohne Dependencies
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Nur das Nötige ins Image (Server + statische Dateien)
COPY package.json server.js ./
COPY index.html style.css app.js ./

# Nicht als root laufen
USER node

EXPOSE 5173
CMD ["node", "server.js"]
