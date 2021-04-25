const { createCollectionCode, getSchemas } = require('./helpers.js');
const Fastify = require('fastify');
const fastifyCors = require('fastify-cors');
const fastifyFormbody = require('fastify-formbody');
var path = require('path');
const fs = require("fs");
const JSONdb = require('simple-json-db');
const db = new JSONdb('./src/data/database.json');

const fastify = Fastify({
    logger: true
})

fastify.register(fastifyCors, {
    // put your options here
});


fastify.register(fastifyFormbody);
fastify.register(require('fastify-print-routes'))

fastify.register(require('fastify-swagger'), {
    routePrefix: '/documentation',
    swagger: {
        info: {
            title: 'Test swagger',
            description: 'testing the fastify swagger api',
            version: '0.1.0'
        },
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here'
        },
        host: '127.0.0.1:3005',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: getSchemas().tags,
        definitions: {
            User: {
                type: 'object',
                required: ['id', 'email'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                }
            }, ...getSchemas().schemas
        },
        securityDefinitions: {
            apiKey: {
                type: 'apiKey',
                name: 'apiKey',
                in: 'header'
            }
        }
    },
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    exposeRoute: true
})

fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
});

fastify.get('/collections', async (request, reply) => {
    reply.send(db.JSON());
});

fastify.get('/collections/:name', async (request, reply) => {
    reply.send(db.get(request.params.name));
});

fastify.post("/collections", async (request, reply) => {
    const requestBody = request.body;
    createCollectionCode(requestBody);
    reply.send(request.body);
})

if (fs.existsSync("./src/index.js")) {
    const fastifyMongooseAPI = require('./packages/fastify-mongoose-api');
    const { mongooseConnection } = require("./src");
    fastify.register(fastifyMongooseAPI, {
        models: mongooseConnection.models,
        prefix: '/api/',
        setDefaults: true,
        methods: ['list', 'get', 'post', 'patch', 'put', 'delete', 'options']
    });
}

const start = async () => {
    try {
        await fastify.listen(3005)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()