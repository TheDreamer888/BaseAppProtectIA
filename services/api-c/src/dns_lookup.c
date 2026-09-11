#include "dns_lookup.h"

#include <arpa/inet.h>
#include <ctype.h>
#include <netdb.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>

int dns_is_valid_hostname(const char *host) {
    if (!host || host[0] == '\0') return 0;
    size_t len = strlen(host);
    if (len > 253) return 0;

    for (size_t i = 0; i < len; i++) {
        unsigned char c = (unsigned char)host[i];
        if (!isalnum(c) && c != '.' && c != '-') return 0;
    }
    return 1;
}

int dns_resolve_to_json(const char *host, char *out, size_t out_size) {
    if (!dns_is_valid_hostname(host)) return -1;

    struct addrinfo hints;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    struct addrinfo *result = NULL;
    int rc = getaddrinfo(host, NULL, &hints, &result);
    if (rc != 0 || result == NULL) return -1;

    size_t pos = 0;
    int count = 0;
    pos += (size_t)snprintf(out + pos, out_size - pos, "[");

    for (struct addrinfo *rp = result; rp != NULL && pos < out_size - 1; rp = rp->ai_next) {
        char ip[INET6_ADDRSTRLEN];
        void *addr;

        if (rp->ai_family == AF_INET) {
            addr = &((struct sockaddr_in *)rp->ai_addr)->sin_addr;
        } else if (rp->ai_family == AF_INET6) {
            addr = &((struct sockaddr_in6 *)rp->ai_addr)->sin6_addr;
        } else {
            continue;
        }

        if (!inet_ntop(rp->ai_family, addr, ip, sizeof(ip))) continue;

        pos += (size_t)snprintf(out + pos, out_size - pos, "%s\"%s\"", count > 0 ? "," : "", ip);
        count++;
    }

    snprintf(out + pos, out_size - pos, "]");
    freeaddrinfo(result);
    return count;
}
