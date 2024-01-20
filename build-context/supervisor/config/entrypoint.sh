#!/bin/bash
set -e -u

# Parámetros por defecto para supervisord
SUPERVISOR_PARAMS='-c /etc/supervisord.conf'

export PS1='\u@\h:\w\$ '

# Comentar o eliminar la siguiente sección para permitir la ejecución en modo desacoplado
# if [ ! -t 0 ]; then
#   echo "Running image in detached mode is probably not meaningful."
#   echo "Use interactive mode (-it), e.g. 'docker run -v /tmp:/data -it unoserver/unoserver-docker'."
#   exit 1
# fi
export UNIX_HTTP_SERVER_PASSWORD=${UNIX_HTTP_SERVER_PASSWORD:-$(cat /proc/sys/kernel/random/uuid)}

# Ejecutar supervisord en modo desacoplado...
supervisord -n $SUPERVISOR_PARAMS

# Esperar hasta que unoserver se inicie y escuche en el puerto 2002.
echo "Waiting for unoserver to start ..."
while [ -z "$(netstat -tln | grep 2002)" ]; do
  sleep 1
done
echo "unoserver started."
libreoffice --version

# Esperar hasta que la aplicación Node.js se inicie y escuche en el puerto 3000.
echo "Waiting for Node.js app to start ..."
while [ -z "$(netstat -tln | grep 3000)" ]; do
  sleep 1
done
echo "Node.js app started."

