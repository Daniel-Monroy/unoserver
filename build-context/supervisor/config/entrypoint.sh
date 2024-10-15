#!/bin/bash
set -e -u

# Parámetros por defecto para supervisord
export UNIX_HTTP_SERVER_PASSWORD=${UNIX_HTTP_SERVER_PASSWORD:-$(cat /proc/sys/kernel/random/uuid)}
SUPERVISOR_PARAMS='-c /etc/supervisord.conf'

# Function to wait for unoserver to start
wait_for_unoserver() {
    echo "Waiting for unoserver to start on port 2003..."
    while ! netstat -tln | grep -q 2003; do
        sleep 1
    done
    echo "unoserver started."
}

# Function to wait for the Node.js app to start
wait_for_nodejs() {
    echo "Waiting for Node.js app to start on port 3000..."
    while ! netstat -tln | grep -q 3000; do
        sleep 1
    done
    echo "Node.js app started."
}

export PS1='\u@\h:\w\$ '

echo "using: $(libreoffice --version)"

# if tty then assume that container is interactive
if [ ! -t 0 ]; then
    echo "Running unoserver-docker in non-interactive mode."
    echo "For interactive mode use '-it', e.g. 'docker run -v /tmp:/data -it unoserver/unoserver-docker'."

    # Ejecutar supervisord en modo desacoplado
    supervisord -n $SUPERVISOR_PARAMS

    # Wait for unoserver and Node.js to start
    wait_for_unoserver
    wait_for_nodejs

else
    echo "Running unoserver-docker in interactive mode."
    echo "For non-interactive mode omit '-it', e.g. 'docker run -p 2003:2003 unoserver/unoserver-docker'."

    # default parameters for supervisord
    export SUPERVISOR_INTERACTIVE_CONF='/supervisor/conf/interactive/supervisord.conf'
    export UNIX_HTTP_SERVER_PASSWORD=${UNIX_HTTP_SERVER_PASSWORD:-$(cat /proc/sys/kernel/random/uuid)}

    # run supervisord as detached
    supervisord -c "$SUPERVISOR_INTERACTIVE_CONF"

    # wait until unoserver started and listens on port 2002.
    wait_for_unoserver
    wait_for_nodejs

    # if commands have been passed to container run them and exit, else start bash
    if [[ $# -gt 0 ]]; then
        eval "$@"
    else
        /bin/bash
    fi
fi
