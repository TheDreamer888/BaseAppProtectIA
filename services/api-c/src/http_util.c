#include "http_util.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void http_url_decode(const char *src, char *out, size_t out_size) {
    size_t o = 0;
    for (size_t i = 0; src[i] != '\0' && o + 1 < out_size; i++) {
        if (src[i] == '%' && isxdigit((unsigned char)src[i + 1]) && isxdigit((unsigned char)src[i + 2])) {
            char hex[3] = { src[i + 1], src[i + 2], '\0' };
            out[o++] = (char)strtol(hex, NULL, 16);
            i += 2;
        } else if (src[i] == '+') {
            out[o++] = ' ';
        } else {
            out[o++] = src[i];
        }
    }
    out[o] = '\0';
}

int http_query_param(const char *query, const char *key, char *out, size_t out_size) {
    if (!query || !key || !out || out_size == 0) return 0;
    out[0] = '\0';

    size_t key_len = strlen(key);
    const char *cursor = query;
    while (cursor && *cursor) {
        const char *amp = strchr(cursor, '&');
        size_t pair_len = amp ? (size_t)(amp - cursor) : strlen(cursor);

        if (pair_len > key_len && cursor[key_len] == '=' && strncmp(cursor, key, key_len) == 0) {
            const char *value = cursor + key_len + 1;
            size_t value_len = pair_len - key_len - 1;
            char raw[1024];
            if (value_len >= sizeof(raw)) value_len = sizeof(raw) - 1;
            memcpy(raw, value, value_len);
            raw[value_len] = '\0';
            http_url_decode(raw, out, out_size);
            return 1;
        }

        cursor = amp ? amp + 1 : NULL;
    }
    return 0;
}

void http_send_response(int fd, int status_code, const char *status_text,
                         const char *content_type, const char *body) {
    char header[256];
    size_t body_len = body ? strlen(body) : 0;
    int header_len = snprintf(header, sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %zu\r\n"
        "Connection: close\r\n"
        "X-Content-Type-Options: nosniff\r\n"
        "\r\n",
        status_code, status_text, content_type, body_len);

    if (header_len > 0) {
        ssize_t written = write(fd, header, (size_t)header_len);
        (void)written;
    }
    if (body_len > 0) {
        ssize_t written = write(fd, body, body_len);
        (void)written;
    }
}
