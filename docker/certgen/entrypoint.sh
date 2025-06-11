#!/bin/sh

set -e

if [ -f /certs/localhost.crt ] && [ -f /certs/localhost.key ]; then
  echo "✅ Certificats déjà présents. Rien à faire."
  exit 0
fi

apk add --no-cache openssl iproute2 coreutils

mkdir -p /certs

# Détection IP locale (la première non loopback trouvée)
IP_LOCAL=$(ip -o -4 addr show eth0 | awk '{split($4, a, "/"); print a[1]; exit}')

echo "IP locale détectée : $IP_LOCAL"

# Fichier de configuration OpenSSL
cat > /certs/openssl.cnf <<EOF
[ req ]
default_bits       = 2048
distinguished_name = req_distinguished_name
req_extensions     = req_ext
x509_extensions    = v3_req
prompt             = no

[ req_distinguished_name ]
CN = localhost

[ req_ext ]
subjectAltName = @alt_names

[ v3_req ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = 0.0.0.0
IP.3 = ${IP_LOCAL}
EOF

# Générer certificat auto-signé
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /certs/localhost.key \
  -out /certs/localhost.crt \
  -config /certs/openssl.cnf