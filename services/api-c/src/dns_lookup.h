#ifndef DNS_LOOKUP_H
#define DNS_LOOKUP_H

#include <stddef.h>

/* Validates that `host` only contains letters, digits, '.' and '-' and is
 * within a reasonable hostname length. Returns 1 if valid, 0 otherwise. */
int dns_is_valid_hostname(const char *host);

/* Resolves `host` (IPv4/IPv6) into a JSON array string written to `out`.
 * Returns the number of addresses found, or -1 on resolution failure. */
int dns_resolve_to_json(const char *host, char *out, size_t out_size);

#endif
