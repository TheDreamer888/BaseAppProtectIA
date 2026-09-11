#ifndef HTTP_UTIL_H
#define HTTP_UTIL_H

/* Extracts the value of `key` from a query string like "a=1&b=2" into `out`
 * (URL-decoded, NUL-terminated, truncated to out_size - 1).
 * Returns 1 if found, 0 otherwise. */
int http_query_param(const char *query, const char *key, char *out, size_t out_size);

/* Decodes a %XX / '+' encoded string in place style into `out`. */
void http_url_decode(const char *src, char *out, size_t out_size);

/* Writes a minimal HTTP/1.1 response with the given status line, content type
 * and body to the socket fd. */
void http_send_response(int fd, int status_code, const char *status_text,
                         const char *content_type, const char *body);

#endif
