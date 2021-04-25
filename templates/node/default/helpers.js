const fs = require("fs");
const { writeFile, readFile } = fs;
const JSONdb = require('simple-json-db');
const db = new JSONdb('./src/data/database.json');

const createCollectionCode = (data) => {
  db.set(data.collection.toLowerCase(), data);

  for (const key in db.JSON()) {
    if (Object.hasOwnProperty.call(db.JSON(), key)) {
      const element = db.JSON()[key];
      // console.log({ element });
      createFile(element);
    }
  }
  createModels();
}

const createCollection = (data) => {
  let properties = "";

  for (let index = 0; index < data.columns.length; index++) {
    const element = data.columns[index];
    // console.log({ columns: data.columns });
    properties += `${element.property}: ${element.valueType}`
    if (index != data.columns.length - 1) properties += ",\n";
  }

  return `
  const ${data.collection.toLowerCase()}Schema = mongoose.Schema({
    ${properties}
  })
  `
}

const createImport = `var mongoose = require('mongoose');`;

const createFile = (collectionData) => {
  const data = collectionData;
  const collectionFileName = `./src/models/${data.collection.toLowerCase()}.js`;
  const collectionFilePath = `./${collectionFileName}`;

  const createExport = `module.exports = { ${data.collection.toLowerCase()}Schema }`;
  const collectionContent = `${createImport}\n${createCollection(collectionData)}\n${createExport}`;

  writeFile(collectionFilePath, collectionContent, function () {
    readFile(collectionFilePath, 'utf-8', function (err, dataa) {
      if (!err) {
        // console.log(dataa);
      }
    });
  });
}

const createModels = () => {
  const data = db.JSON();

  let content = `${createImport}\n`;
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const element = data[key];
      // console.log({ element });
      const collectionFileName = `${element.collection.toLowerCase()}.js`;
      const collectionFilePath = `./models/${collectionFileName}`;
      content += `\nconst { ${element.collection.toLowerCase()}Schema } = require('${collectionFilePath}')`;
    }
  }
  const createConnection = `const mongooseConnection = mongoose.createConnection("mongodb://localhost:27017/middle-thingy?retryWrites=true&w=majority", { useNewUrlParser: true });`;
  content += `\n${createConnection}`;
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const element = data[key];
      const createCollectionClass = `const ${element.collection} = mongooseConnection.model("${element.collection}", ${element.collection.toLowerCase()}Schema, "${element.collection.toLowerCase()}");`
      content += `\n${createCollectionClass}`;
    }
  }
  content += `\nconst models = {`;
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const element = data[key];
      content += ` ${element.collection},`
    }
  }
  content += " }";
  let createConnectionExport = `module.exports = { mongooseConnection, models }`;
  content += `\n${createConnectionExport}`;
  writeFile("./src/index.js", content, function () {
    readFile("./src/index.js", 'utf-8', function (err, dataa) {
      if (!err) {
        console.log(dataa);
      }
    });
  });
}

const getSchemas = () => {
  const schemas = {};
  const tags = [];

  const fs = require("fs");

  if (fs.existsSync("./src/index.js")) {
    const { mongooseConnection } = require("./src");
    const models = mongooseConnection.models;
    for (const key in models) {
      if (Object.hasOwnProperty.call(models, key)) {
        const model = models[key];
        schemas[model.modelName] = { type: 'object' }
        schemas[model.modelName]["properties"] = {};

        tags.push({ name: model.modelName.toLowerCase(), description: `${model.modelName} related endpoints` });

        const paths = model.schema.paths

        for (const key in paths) {
          if (Object.hasOwnProperty.call(paths, key)) {
            const path = paths[key];

            let type = path.instance;
            let elpath = path.path;

            if (type === 'ObjectID' || type === 'Date' || type === 'String') type = 'string'
            if (type === 'Number') type = 'number'

            if (elpath !== "__v") schemas[model.modelName]["properties"][elpath] = { type }
          }
        }
      }
    }
  }
  return { schemas, tags };
}

module.exports = { createCollectionCode, getSchemas }