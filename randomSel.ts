import neo4j from 'neo4j-driver';
import fs from 'fs';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
const session = driver.session();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const nodesSelection = async (nodesToSelect: number) =>{
  const result = await session.run(`
      MATCH (n)
      WITH n, rand() AS random
      ORDER BY random
      RETURN ID(n) AS randomNodes
      LIMIT $nodesToSelect
    `, { nodesToSelect: neo4j.int(nodesToSelect) });
    return result
}

const nodePropSelection = async (propertiesToSelect: number) =>{
  const result = await session.run(`
      MATCH (n)
      CALL{
        WITH n
        WITH keys(n) AS properties, n
        UNWIND properties AS prop 
        RETURN prop AS property, ID(n) as id
      }
      WITH property, id, rand() AS random
      RETURN property, id
      ORDER BY random
      LIMIT $propertiesToSelect
    `, { propertiesToSelect: neo4j.int(propertiesToSelect) });

  return result;
}

const relSelection = async (relToSelect: number) => {
  const result = await session.run(`
      MATCH ()-[n]-()
      WITH n, rand() AS random
      ORDER BY random
      RETURN DISTINCT ID(n) AS randomRelationships
      LIMIT $relToSelect
    `, { relToSelect: neo4j.int(relToSelect) });
  return result;
}

const relPropSelection = async (propertiesToSelect: number) =>{
  const result = await session.run(`
    MATCH ()-[n]-()
    WITH DISTINCT n AS rel
    CALL{
      WITH rel
      WITH keys(rel) AS properties, rel
      UNWIND properties AS prop 
      RETURN prop AS property, ID(rel) as id
    }
    WITH property, id, rand() AS random
    RETURN property, id
    ORDER BY random
    LIMIT $propertiesToSelect
  `, { propertiesToSelect: neo4j.int(propertiesToSelect) });
  return result;
}

const sensitiveNodes = async (number: number) => {
  try {
    const nodesToSelect = number;
    const result = await nodesSelection(nodesToSelect)
    const randomNodeIds = result.records.map(record => record.get('randomNodes').toNumber());
    const sensitiveNodes = randomNodeIds.map(id => ({ condition: `ID(n) = ${id}` }));
    const outputFile = 'sensitiveData.json';
    const outputJSON = {
      uri: uri,
      username: username,
      password: password,
      sensitiveNodes: sensitiveNodes
    };
    fs.writeFileSync(outputFile, JSON.stringify(outputJSON, null, 2));
    console.log(`File JSON ${outputFile} creato con successo.`);
  } catch (error) {
    console.error('Errore durante l\'esecuzione della query:', error);
  } finally {
    session.close();
    driver.close();
  }
};

const sensitiveNodeProperties = async(number: number) =>{
  try {
    const sensitiveNodeProperties: { property: string; condition: string; }[] = [];
    const propertiesToSelect = number;
    const result = await nodePropSelection(propertiesToSelect)
    result.records.forEach(record => {
      const property: string = record.get('property');
      const id: number = record.get('id').toNumber();
      const sensitiveProperty = { property: property, condition: `ID(n) = ${id}` };
      sensitiveNodeProperties.push(sensitiveProperty);
    });   
    const outputFile = 'sensitiveData.json';
    const outputJSON = {
      uri: uri,
      username: username,
      password: password,
      sensitiveNodeProperties: sensitiveNodeProperties
    };
    fs.writeFileSync(outputFile, JSON.stringify(outputJSON, null, 2));
    console.log(`File JSON ${outputFile} creato con successo.`);
  } catch (error) {
    console.error('Errore durante l\'esecuzione della query:', error);
  } finally {
    session.close();
    driver.close();
  }
}

const sensitiveRelationships = async (number: number) =>{
  try {
    const relToSelect = number;
    const result = await relSelection(relToSelect);
    const randomRelIds = result.records.map(record => record.get('randomRelationships').toNumber());
    const sensitiveRelationships = randomRelIds.map(id => ({ condition: `ID(n) = ${id}` }));
    const outputFile = 'sensitiveData.json';
    const outputJSON = {
      uri: uri,
      username: username,
      password: password,
      sensitiveRelationships: sensitiveRelationships
    };
    fs.writeFileSync(outputFile, JSON.stringify(outputJSON, null, 2));
    console.log(`File JSON ${outputFile} creato con successo.`);
  } catch (error) {
    console.error('Errore durante l\'esecuzione della query:', error);
  } finally {
    session.close();
    driver.close();
  }
}

const sensitiveRelProperties = async (number: number) =>{
  try {
    const sensitiveRelProperties: { property: string; condition: string; }[] = [];
    const propertiesToSelect = number; 
    const result = await relPropSelection(propertiesToSelect)
    result.records.forEach(record => {
      const property: string = record.get('property');
      const id: number = record.get('id').toNumber();
      const sensitiveProperty = { property: property, condition: `ID(n) = ${id}` };
      sensitiveRelProperties.push(sensitiveProperty);
    });
    
    const outputFile = 'sensitiveData.json';
    const outputJSON = {
      uri: uri,
      username: username,
      password: password,
      sensitiveRelProperties: sensitiveRelProperties
    };
    fs.writeFileSync(outputFile, JSON.stringify(outputJSON, null, 2));
    console.log(`File JSON ${outputFile} creato con successo.`);
  } catch (error) {
    console.error('Errore durante l\'esecuzione della query:', error);
  } finally {
    session.close();
    driver.close();
  }
}

const sensitiveRandomElements = async (number: number) =>{
  try{
    const randomNodes = Math.floor(Math.random() * (number + 1));
    number -= randomNodes; 
    const randomRelationships = Math.floor(Math.random() * (number + 1));
    number -= randomRelationships;
    const randomNodeProperties = Math.floor(Math.random() * (number + 1));
    number -= randomNodeProperties;
    const randomRelProperties = number;

    const nodeResult = await nodesSelection(randomNodes);
    const randomNodeIds = nodeResult.records.map(record => record.get('randomNodes').toNumber());
    const sensitiveNodes = randomNodeIds.map(id => ({ condition: `ID(n) = ${id}` }));

    const sensitiveNodeProperties: { property: string; condition: string; }[] = [];
    const nodePropResult = await nodePropSelection(randomNodeProperties);
    nodePropResult.records.forEach(record => {
      const property: string = record.get('property');
      const id: number = record.get('id').toNumber();
      const sensitiveProperty = { property: property, condition: `ID(n) = ${id}` };
      sensitiveNodeProperties.push(sensitiveProperty);
    });

    const relResult = await relSelection(randomRelationships);
    const randomRelIds = relResult.records.map(record => record.get('randomRelationships').toNumber());
    const sensitiveRelationships = randomRelIds.map(id => ({ condition: `ID(n) = ${id}` }));

    const sensitiveRelProperties: { property: string; condition: string; }[] = [];
    const relPropResult = await relPropSelection(randomRelProperties)
    relPropResult.records.forEach(record => {
      const property: string = record.get('property');
      const id: number = record.get('id').toNumber();
      const sensitiveProperty = { property: property, condition: `ID(n) = ${id}` };
      sensitiveRelProperties.push(sensitiveProperty);
    });

    const outputFile = 'sensitiveData.json';
    const outputJSON = {
      uri: uri,
      username: username,
      password: password,
      sensitiveNodes: sensitiveNodes,
      sensitiveNodeProperties: sensitiveNodeProperties,
      sensitiveRelationships: sensitiveRelationships,
      sensitiveRelProperties: sensitiveRelProperties
    };
    fs.writeFileSync(outputFile, JSON.stringify(outputJSON, null, 2));
    console.log(`File JSON ${outputFile} creato con successo.`);
  } catch (error) {
    console.error('Errore durante l\'esecuzione della query:', error);
  } finally {
    session.close();
    driver.close();
  }
  




}

const main = async() => { 
  rl.question("Inserisci il numero di elementi desiderati: ", async (answer) => {
     const percentage = parseFloat(answer);
    if (isNaN(percentage) || percentage <= 0 || percentage > 1) {
      console.error('La percentuale deve essere un numero tra 0 e 1 incluso.');
      process.exit(1);
    } 
    const number = parseInt(answer);
    if(isNaN(number)){
      console.error('Errore: devi inserire un numero.');
      process.exit(1);
    }
    rl.question(`
    1 - Sanitizzazione dei nodi
    2 - Sanitizzazione delle proprietà dei nodi
    3 - Sanitizzazione delle relazioni
    4 - Sanitizzazione delle proprietà delle relazioni
    5 - Sanitizzazione di elementi casuali
    Inserisci l'opzione desiderata: 
    `, async(option) =>{
      switch(option){
        case '1':
          await sensitiveNodes(number);
          break;
        case '2':
          await sensitiveNodeProperties(number);
          break;
        case '3':
          await sensitiveRelationships(number);
          break;
        case '4':
          await sensitiveRelProperties(number);
          break;
        case '5':
          await sensitiveRandomElements(number);
          break;
        default:
          console.log("Errore nell'inserimento dell'opzione. Possibili risposte: '1', '2', '3', '4' o '5'")
          process.exit(1);
      }
      rl.close();
    })
  });
};

main();
