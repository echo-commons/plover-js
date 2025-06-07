const https = require('https');
const fs = require('fs');
const httpProxy = require('http-proxy');
const Logger = require("./loggers/loggers");
const config = require("./config.json");
require("dotenv").config();
const { Mutex } = require('async-mutex');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const targets = config.targets;
const MAX_CONCURRENT_CONNECTIONS = parseInt(config.maxConcurrentConnections) || 100;
let currentConnections = 0;

const connectionMutex = new Mutex();

const rateLimiter = new RateLimiterMemory({
    points: parseInt(config.rateLimiter.point) || 20, 
    duration: parseInt(config.rateLimiter.duration) || 1,
    blockDuration: parseInt(config.rateLimiter.block) || 10
});

const proxy = httpProxy.createProxyServer({});
const options = {
    key: fs.readFileSync(config.ssl.key),
    cert: fs.readFileSync(config.ssl.cert)
};

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    keepAliveMsecs: 30000,
});

function pickTargetIndex() {
    let minIdx = 0;
    let minConn = targets[0].activeConnections;
    for (let i = 1; i < targets.length; i++) {
        if (targets[i].activeConnections < minConn) {
            minConn = targets[i].activeConnections;
            minIdx = i;
        }
    }
    return minIdx;
}

async function decrementCounters(target) {
    await connectionMutex.runExclusive(() => {
        if (target.activeConnections > 0) target.activeConnections--;
        if (currentConnections > 0) currentConnections--;
    });
}

const server = https.createServer(options, async (req, res) => {
    try {
        const ip = req.socket.remoteAddress;
        await rateLimiter.consume(ip);

        let allowed = await connectionMutex.runExclusive(() => {
            if (currentConnections >= MAX_CONCURRENT_CONNECTIONS) return false;
            currentConnections++;
            return true;
        });

        if (!allowed) {
            Logger.warn(`Too many concurrent connections: ${currentConnections}. Rejecting request ${req.method} ${req.url}`);
            res.writeHead(429, { 'Retry-After': '10' });
            res.end('Too Many Requests');
            return;
        }

        const idx = pickTargetIndex();

        await connectionMutex.runExclusive(() => {
            targets[idx].activeConnections++;
        });

        const target = targets[idx];

        Logger.info(`Proxying ${req.method} ${req.url} → https://${target.host}:${target.port} (activeConnections: ${target.activeConnections})`);

        let ended = false;
        function onCloseOrFinish() {
            if (ended) return;
            ended = true;
            decrementCounters(target).then(() => {
                Logger.info(`Connection closed for https://${target.host}:${target.port} (remaining: ${target.activeConnections})`);
            });
        }

        res.on('finish', onCloseOrFinish);
        res.on('close', onCloseOrFinish);

        proxy.web(req, res, {
            target: `https://${target.host}:${target.port}`,
            secure: false,
            agent: httpsAgent
        }, (err) => {
            if (!ended) {
                ended = true;
                decrementCounters(target).then(() => {
                    Logger.error(`Proxy error → https://${target.host}:${target.port} - ${err.message}`);
                });
            }
            res.writeHead(502);
            res.end('Bad Gateway');
        });

    } catch (rejRes) {
        Logger.warn(`Rate limit exceeded for IP ${req.socket.remoteAddress}`);
        res.writeHead(429, { 'Retry-After': '10' });
        res.end('Too Many Requests');
    }
});

server.listen(process.env.PLOVER_PORT, () => {
    Logger.info(`Balancer is running on port ${process.env.PLOVER_PORT}...`);
    Logger.info(`Available targets: ${targets.map((v) => `${v.host}:${v.port}`).join(", ")}`);
});