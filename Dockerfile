FROM node:14.15
WORKDIR /
COPY . /
RUN npm install
CMD node index.js