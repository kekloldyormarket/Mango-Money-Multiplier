#!/bin/sh
set -e

# https://github.com/jetbrains-infra/docker-nginx-resolver
export DOLLAR='$'
mkdir -p /etc/nginx/includes/
echo resolver $(awk 'BEGIN{ORS=" "} $1=="nameserver" {print $2}' /etc/resolv.conf) ";" > /etc/nginx/includes/resolver.conf
exec "$@"