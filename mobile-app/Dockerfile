# Web demo of the customer app: a static Expo web export served by nginx.
# On a wide screen the app sits in a phone-sized frame (src/app/_layout.tsx). It is a demo of
# the app's look and flow, not a supported web version.
# Build: docker build -t ilp-mobile mobile-app    Run: docker run --rm -p 8082:80 ilp-mobile
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The backend address is built into the web app (see .env.example).
ARG EXPO_PUBLIC_API_URL=http://localhost:8000
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export --platform web --output-dir dist

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
