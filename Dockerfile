
#install ubuntu
FROM ubuntu:14.04
  RUN apt-get update && apt-get install -y

FROM node:4.3.2
  #create a new user to run the app inside the container
  #if we dont do this than the app will run as root which is against #security best practices

  RUN useradd --user-group --create-home --shell /bin/false jon &&\
    npm install --global npm@3.7.5

  ENV HOME =/home/jon
  COPY package.json $HOME/email_engine/
  COPY . $HOME/email_engine/
  RUN chown -R jon:jon $HOME/*

  USER jon
  WORKDIR $HOME/email_engine
  RUN npm install && npm cache clean




