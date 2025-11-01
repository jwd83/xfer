FROM coturn/coturn:latest

# Copy config
COPY turnserver.conf /etc/coturn/turnserver.conf

# Expose ports
EXPOSE 3478/tcp
EXPOSE 3478/udp
EXPOSE 49152-65535/udp

CMD ["-c", "/etc/coturn/turnserver.conf"]