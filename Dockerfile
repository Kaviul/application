FROM node:18-alpine
WORKDIR /website
COPY website .

EXPOSE 8080

CMD ["npm" ,"start"]