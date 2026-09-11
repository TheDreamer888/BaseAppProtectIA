#include <arpa/inet.h>
#include <curl/curl.h>
#include <errno.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#include "dns_lookup.h"
#include "http_util.h"
#include "safe_fetch.h"

#define REQUEST_BUFFER_SIZE 4096
#define RESPONSE_BUFFER_SIZE 8192
#define MAX_FETCH_BODY_BYTES (2L * 1024 * 1024)

static volatile sig_atomic_t g_running = 1;

static void handle_signal(int sig) {
    (void)sig;
    g_running = 0;
}

static void handle_health(int client_fd) {
    http_send_response(client_fd, 200, "OK", "application/json", "{\"status\":\"ok\"}");
}

static void handle_dns(int client_fd, const char *query) {
    char host[256];
    char body[RESPONSE_BUFFER_SIZE];

    if (!http_query_param(query, "host", host, sizeof(host)) || host[0] == '\0') {
        http_send_response(client_fd, 400, "Bad Request", "application/json",
            "{\"error\":\"parametro 'host' em falta\"}");
        return;
    }

    if (!dns_is_valid_hostname(host)) {
        http_send_response(client_fd, 400, "Bad Request", "application/json",
            "{\"error\":\"hostname invalido\"}");
        return;
    }

    char addresses[RESPONSE_BUFFER_SIZE - 128];
    int count = dns_resolve_to_json(host, addresses, sizeof(addresses));
    if (count < 0) {
        http_send_response(client_fd, 502, "Bad Gateway", "application/json",
            "{\"error\":\"falha ao resolver o hostname\"}");
        return;
    }

    snprintf(body, sizeof(body), "{\"host\":\"%s\",\"addresses\":%s,\"count\":%d}", host, addresses, count);
    http_send_response(client_fd, 200, "OK", "application/json", body);
}

static void handle_fetch(int client_fd, const char *query) {
    char url[2048];
    char body[RESPONSE_BUFFER_SIZE];

    if (!http_query_param(query, "url", url, sizeof(url)) || url[0] == '\0') {
        http_send_response(client_fd, 400, "Bad Request", "application/json",
            "{\"error\":\"parametro 'url' em falta\"}");
        return;
    }

    fetch_result_t result;
    if (safe_fetch_url(url, MAX_FETCH_BODY_BYTES, &result) != 0) {
        snprintf(body, sizeof(body), "{\"error\":\"%s\"}", result.error);
        http_send_response(client_fd, 400, "Bad Request", "application/json", body);
        return;
    }

    snprintf(body, sizeof(body), "{\"http_status\":%d,\"bytes\":%ld}", result.http_status, result.body_size);
    http_send_response(client_fd, 200, "OK", "application/json", body);
}

static void handle_not_found(int client_fd) {
    http_send_response(client_fd, 404, "Not Found", "application/json", "{\"error\":\"rota desconhecida\"}");
}

static void handle_client(int client_fd) {
    char request[REQUEST_BUFFER_SIZE];
    ssize_t received = read(client_fd, request, sizeof(request) - 1);
    if (received <= 0) {
        close(client_fd);
        return;
    }
    request[received] = '\0';

    char method[8] = { 0 };
    char path[1024] = { 0 };
    if (sscanf(request, "%7s %1023s", method, path) != 2) {
        http_send_response(client_fd, 400, "Bad Request", "application/json", "{\"error\":\"pedido invalido\"}");
        close(client_fd);
        return;
    }

    char *query = strchr(path, '?');
    if (query) {
        *query = '\0';
        query++;
    }

    if (strcmp(method, "GET") != 0) {
        http_send_response(client_fd, 405, "Method Not Allowed", "application/json", "{\"error\":\"metodo nao suportado\"}");
    } else if (strcmp(path, "/health") == 0) {
        handle_health(client_fd);
    } else if (strcmp(path, "/dns") == 0) {
        handle_dns(client_fd, query ? query : "");
    } else if (strcmp(path, "/fetch") == 0) {
        handle_fetch(client_fd, query ? query : "");
    } else {
        handle_not_found(client_fd);
    }

    close(client_fd);
}

int main(void) {
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);
    signal(SIGPIPE, SIG_IGN);
    curl_global_init(CURL_GLOBAL_DEFAULT);

    const char *port_env = getenv("PORT");
    int port = port_env ? atoi(port_env) : 8090;
    if (port <= 0 || port > 65535) port = 8090;

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        return 1;
    }

    int reuse = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons((uint16_t)port);

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(server_fd);
        return 1;
    }

    if (listen(server_fd, 64) < 0) {
        perror("listen");
        close(server_fd);
        return 1;
    }

    fprintf(stdout, "api-c a escutar na porta %d\n", port);
    fflush(stdout);

    while (g_running) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &client_len);
        if (client_fd < 0) {
            if (errno == EINTR) continue;
            perror("accept");
            continue;
        }
        handle_client(client_fd);
    }

    close(server_fd);
    curl_global_cleanup();
    return 0;
}
