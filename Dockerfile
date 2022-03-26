FROM nginx

# https://github.com/jetbrains-infra/docker-nginx-resolver
ADD entrypoint.sh /entrypoint.sh
CMD ["nginx", "-g", "daemon off;"]
ENTRYPOINT ["/entrypoint.sh"]