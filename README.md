# Plover - Echo

Plover implements a **Level 7 (Application Layer) HTTPS load balancer** designed to distribute incoming HTTPS requests across multiple backend targets. It features:

- Dynamic target selection based on the number of active connections (least connections algorithm).
- Concurrency control limiting the total number of simultaneous connections.
- IP-based rate limiting using a token bucket algorithm.
- HTTPS termination with custom SSL certificates.
- Keep-alive connections with an HTTPS agent for backend requests.
- Graceful handling of connection lifecycle events to update connection counters.
- Basic error handling with fallback to HTTP 502 Bad Gateway responses.

## Procedure

1. **Install dependencies**  
   Run the following command at the root of the project to install all required packages:  
   ```bash
   pnpm install # or any node package manager
   ````

2. **Configure environment and settings**
   * Create and configure your `.env` file with necessary environment variables (e.g., `PLOVER_PORT`).
   * Adjust `config.json` to define your backend targets, rate limiter settings, SSL paths, and other parameters.

3. **TLS certificates**
   Place your TLS certificate and private key in the project root (or the configured paths) with these exact filenames:

   * `cert.pem` — TLS certificate file
   * `key.pem` — Private key file

   Make sure `config.json` correctly points to these files.

4. **Docker image (coming soon)**
   Once the `Dockerfile` is finalized, you will be able to build a Docker image for easy deployment.

## Current Status

This load balancer is a work in progress and **not yet production-ready**. Some features may be incomplete or unstable. Use with caution.

## Contributions

Contributions are highly welcome. Please follow best practices when submitting pull requests, including clean code, tests, and documentation.

## License

This project is distributed under the **EOSL (Echo Open Source Licence)**.

---

© Echo 2025