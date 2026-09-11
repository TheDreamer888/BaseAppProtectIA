#ifndef SAFE_FETCH_H
#define SAFE_FETCH_H

#include <stddef.h>

typedef struct {
    int http_status;   /* HTTP status returned by the remote server */
    long body_size;    /* bytes downloaded */
    char error[256];   /* human readable error, empty on success */
} fetch_result_t;

/* Downloads `url` (http/https only) via libcurl, similar to `curl`/`wget`.
 * Mitigates SSRF by rejecting non-http(s) schemes and by resolving the
 * hostname up front and refusing private/loopback/link-local addresses.
 * The body is discarded (only size/status are reported) to keep the
 * response bounded; `max_body_bytes` caps how much is downloaded before
 * aborting the transfer. Returns 0 on success, -1 on validation/network
 * failure (details in result->error). */
int safe_fetch_url(const char *url, long max_body_bytes, fetch_result_t *result);

#endif
