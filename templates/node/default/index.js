const { createCollectionCode } = require('./helpers.js');
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
    const fastifyMongooseAPI = require('fastify-mongoose-api');
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
        // console.log(fastify);
        await fastify.listen(3005)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()