#include "safe_fetch.h"

#include <arpa/inet.h>
#include <curl/curl.h>
#include <netdb.h>
#include <netinet/in.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>

struct write_ctx {
    long total;
    long max_bytes;
};

/* Returning a value different from `size * nmemb` tells libcurl to abort
 * the transfer, which we use to enforce the response size cap. */
static size_t discard_write_cb(char *ptr, size_t size, size_t nmemb, void *userdata) {
    (void)ptr;
    struct write_ctx *ctx = (struct write_ctx *)userdata;
    size_t received = size * nmemb;
    ctx->total += (long)received;
    if (ctx->total > ctx->max_bytes) return 0;
    return received;
}

static int is_private_or_loopback(struct addrinfo *rp) {
    if (rp->ai_family == AF_INET) {
        unsigned char *b = (unsigned char *)&((struct sockaddr_in *)rp->ai_addr)->sin_addr;
        if (b[0] == 127) return 1;                              /* loopback */
        if (b[0] == 10) return 1;                                /* 10.0.0.0/8 */
        if (b[0] == 169 && b[1] == 254) return 1;                /* link-local */
        if (b[0] == 172 && (b[1] >= 16 && b[1] <= 31)) return 1; /* 172.16.0.0/12 */
        if (b[0] == 192 && b[1] == 168) return 1;                /* 192.168.0.0/16 */
        if (b[0] == 0) return 1;                                 /* 0.0.0.0/8 */
        return 0;
    }
    if (rp->ai_family == AF_INET6) {
        struct in6_addr *a = &((struct sockaddr_in6 *)rp->ai_addr)->sin6_addr;
        if (IN6_IS_ADDR_LOOPBACK(a)) return 1;
        if (IN6_IS_ADDR_LINKLOCAL(a)) return 1;
        if ((a->s6_addr[0] & 0xfe) == 0xfc) return 1; /* fc00::/7 unique local */
        return 0;
    }
    return 1; /* unknown family: reject to be safe */
}

static int hostname_resolves_to_public_ip(const char *host, char *err, size_t err_size) {
    struct addrinfo hints;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    struct addrinfo *result = NULL;
    if (getaddrinfo(host, NULL, &hints, &result) != 0 || result == NULL) {
        snprintf(err, err_size, "nao foi possivel resolver o hostname");
        return 0;
    }

    int ok = 1;
    for (struct addrinfo *rp = result; rp != NULL; rp = rp->ai_next) {
        if (is_private_or_loopback(rp)) {
            ok = 0;
            break;
        }
    }
    freeaddrinfo(result);
    if (!ok) snprintf(err, err_size, "endereco privado/loopback recusado (mitigacao SSRF)");
    return ok;
}

int safe_fetch_url(const char *url, long max_body_bytes, fetch_result_t *result) {
    memset(result, 0, sizeof(*result));

    CURLU *parsed = curl_url();
    if (!parsed || curl_url_set(parsed, CURLUPART_URL, url, 0) != CURLUE_OK) {
        snprintf(result->error, sizeof(result->error), "URL invalido");
        if (parsed) curl_url_cleanup(parsed);
        return -1;
    }

    char *scheme = NULL, *host = NULL;
    curl_url_get(parsed, CURLUPART_SCHEME, &scheme, 0);
    curl_url_get(parsed, CURLUPART_HOST, &host, 0);

    int scheme_ok = scheme && (strcmp(scheme, "http") == 0 || strcmp(scheme, "https") == 0);
    if (!scheme_ok || !host) {
        snprintf(result->error, sizeof(result->error), "apenas http/https sao permitidos");
        if (scheme) curl_free(scheme);
        if (host) curl_free(host);
        curl_url_cleanup(parsed);
        return -1;
    }

    if (!hostname_resolves_to_public_ip(host, result->error, sizeof(result->error))) {
        curl_free(scheme);
        curl_free(host);
        curl_url_cleanup(parsed);
        return -1;
    }

    curl_free(scheme);
    curl_free(host);
    curl_url_cleanup(parsed);

    CURL *curl = curl_easy_init();
    if (!curl) {
        snprintf(result->error, sizeof(result->error), "falha ao iniciar cliente HTTP");
        return -1;
    }

    struct write_ctx ctx = { .total = 0, .max_bytes = max_body_bytes };

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, discard_write_cb);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &ctx);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 0L); /* avoid SSRF via redirect */
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 8L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 4L);
    curl_easy_setopt(curl, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "api-c/1.0 (+auryonsafe)");

    CURLcode rc = curl_easy_perform(curl);
    long status = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &status);
    curl_easy_cleanup(curl);

    if (rc != CURLE_OK) {
        snprintf(result->error, sizeof(result->error), "%s", curl_easy_strerror(rc));
        return -1;
    }

    result->http_status = (int)status;
    result->body_size = ctx.total;
    return 0;
}
