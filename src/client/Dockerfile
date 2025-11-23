FROM node:20-alpine AS build

WORKDIR /app

# Kopiere package.json aus dem client-Verzeichnis
COPY client/package*.json ./

# Verwende npm install
RUN npm install

# Kopiere den Rest des Projektcodes aus dem client-Verzeichnis
COPY client/ ./

# Build der Anwendung erstellen
ARG VITE_API_BASE_URL=http://localhost:8080/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# WebRTC STUN/TURN Configuration
ARG VITE_WEBRTC_STUN_URLS=stun:stun.l.google.com:19302
ENV VITE_WEBRTC_STUN_URLS=${VITE_WEBRTC_STUN_URLS}

ARG VITE_WEBRTC_TURN_URLS
ENV VITE_WEBRTC_TURN_URLS=${VITE_WEBRTC_TURN_URLS}

ARG VITE_WEBRTC_TURN_USERNAME
ENV VITE_WEBRTC_TURN_USERNAME=${VITE_WEBRTC_TURN_USERNAME}

ARG VITE_WEBRTC_TURN_CREDENTIAL
ENV VITE_WEBRTC_TURN_CREDENTIAL=${VITE_WEBRTC_TURN_CREDENTIAL}

RUN npm run build

# Zweite Phase
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist /app/dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]