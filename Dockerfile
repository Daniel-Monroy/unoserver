FROM ubuntu:22.04

ARG BUILD_CONTEXT="build-context"
ARG UID=worker
ARG GID=worker

LABEL org.opencontainers.image.title="unoserver-docker"
LABEL org.opencontainers.image.description="Custom Docker Image that contains unoserver, LibreOffice and major set of fonts for file format conversions"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.documentation="https://github.com/unoconv/unoserver-docker/blob/master/README.md"
LABEL org.opencontainers.image.source="https://github.com/unoconv/unoserver-docker"
LABEL org.opencontainers.image.url="https://github.com/unoconv/unoserver-docker"

WORKDIR /

# Create group and user
RUN groupadd -r ${GID} && useradd -r -g ${GID} -d /home/${UID} -m -s /bin/bash ${UID}

# Install required packages
RUN apt-get update && apt-get install -y \
    bash curl net-tools nodejs npm \
    python3-pip \
    libreoffice \
    supervisor \
    fonts-noto fonts-noto-cjk fonts-noto-color-emoji \
    fonts-terminus \
    fonts-font-awesome \
    fonts-dejavu \
    fonts-freefont-ttf \
    fonts-hack-ttf \
    fonts-inconsolata \
    fonts-liberation \
    fonts-mononoki \
    fonts-open-sans \
    fontconfig && \
    fc-cache -f && \
    rm -rf /var/lib/apt/lists/*

ARG VERSION_ADOPTIUM_TEMURIN="17.0.7"
RUN apt-get update && apt-get install -y default-jdk

# Verificar la instalación de Node.js y npm
RUN node --version && npm --version

# Install unoserver
RUN pip3 install -U unoserver

# Setup supervisor
COPY --chown=${UID}:${GID} ${BUILD_CONTEXT}/supervisor /
RUN chmod +x /config/entrypoint.sh && \
    chown -R ${UID}:0 /run && \
    chmod -R g=u /run

USER ${UID}
WORKDIR /home/worker
ENV HOME="/home/worker"

# App.js
COPY app.js /home/worker/app.js
COPY package.json /home/worker/package.json
RUN cd /home/worker && npm install


# Copy config files
VOLUME ["/data"]

EXPOSE 3000

ENTRYPOINT ["/config/entrypoint.sh"]

