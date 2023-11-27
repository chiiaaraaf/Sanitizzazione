import neo4j from 'neo4j-driver';
import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

interface SensitiveNodeProperty {
    property: string;
    containsString: string | null;
    condition: string | null;
    label: string | null;
}

interface SensitiveRelProperty {
    property: string;
    containsString: string | null;
    condition: string | null;
    relationshipName: string | null;
}

interface SensitiveLabel {
    label: string;
    property: string | null;
    condition: string | null;
}

interface SensitiveNode {
    label: string | null;
    containsString: string | null;
    property: string | null;
    condition: string | null;
}

interface SensitiveRelationship {
    relationshipName: string | null;
    property: string | null;
    condition: string | null;
    containsString: string | null;
}

interface SanitizationConfig {
    uri: string;
    username: string;
    password: string;
    sensitiveNodeProperties: SensitiveNodeProperty[];
    sensitiveRelProperties: SensitiveRelProperty[];
    sensitiveLabels: SensitiveLabel[];
    sensitiveNodes: SensitiveNode[];
    sensitiveRelationships: SensitiveRelationship[];
}

const sanitizeDatabase = async (config: SanitizationConfig) => {
    const { 
        uri, 
        username, 
        password, 
        sensitiveNodeProperties,
        sensitiveRelProperties, 
        sensitiveLabels, 
        sensitiveNodes, 
        sensitiveRelationships
    } = config;
    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    const session = driver.session();

    try {
        if(config.sensitiveNodeProperties){
            const startTime = new Date().getTime();
            let counter = 0;
            for (const { label, property, condition, containsString } of sensitiveNodeProperties) {
                counter++;
                if(label){
                    let query = `
                    MATCH (n:${label})
                    WHERE (n.${property}) IS NOT NULL`;
                    if (condition) {
                        query += ` AND ${condition}`;
                    } else if(containsString){
                        query += ` AND toLower(n.${property}) CONTAINS toLower("${containsString}")`
                    }
                    query += `
                        REMOVE n.${property}
                    `;
                    await session.run(query);
                } else {
                    let query = `
                    MATCH (n)
                    WHERE (n.${property}) IS NOT NULL`;
                    if (condition) {
                        query += ` AND ${condition}`;
                    }
                    query += `
                        REMOVE n.${property}
                    `;
                    await session.run(query);
                }
            }
            const endTime = new Date().getTime();
            const elapsedTime = endTime - startTime;
            const time = msToTime(elapsedTime);
            console.log("Numero di proprietà di nodi sanitizzate: " + counter);
            console.log("Tempo di sanitizzazione delle proprietà dei nodi: " + time);
        }
        
        if(config.sensitiveLabels){
            const startTime = new Date().getTime();
            for (const { label, property, condition } of sensitiveLabels) {
                let query = `
                    MATCH (n:${label})
                `;
                if (property) {
                    query += `WHERE n.${property} IS NOT NULL`;
                    if (condition){
                        query += ` AND ${condition}`
                    }
                } else if (condition) {
                    query += `WHERE ${condition}`
                }            
                query += `
                    REMOVE n:${label}
                `;
                await session.run(query);
            }
            const endTime = new Date().getTime();
            const elapsedTime = endTime - startTime;
            const time = msToTime(elapsedTime);
            console.log("Tempo di sanitizzazione delle label: " + time)
        }
        
        if(config.sensitiveNodes){
            let counter= 0;
            const startTime = new Date().getTime();
            for (const { label, property, condition, containsString } of sensitiveNodes) {
                counter++;
                if(label){
                    let query = `
                    MATCH (n:${label})
                    `;
                    if (property) {
                        query += `WHERE n.${property} IS NOT NULL`;
                        if (condition){
                            query += ` AND ${condition}`
                        } else if (containsString){
                            query += ` AND toLower(n.${property}) CONTAINS toLower("${containsString}")`
                        }
                    } else if (condition) {
                        query += `WHERE ${condition}`
                    }          
                    query += `
                        DETACH DELETE n
                    `;
                    await session.run(query);
                } else {
                    let query = `
                    MATCH (n)
                    `;
                    if (property) {
                        query += `WHERE n.${property} IS NOT NULL`;
                        if (condition){
                            query += ` AND ${condition}`
                        } else if (containsString){
                            query += ` AND toLower(n.${property}) CONTAINS toLower("${containsString}")`
                        }
                    } else if (condition) {
                        query += `WHERE ${condition}`
                    }          
                    query += `
                        DETACH DELETE n
                    `;
                    await session.run(query);
                }   
            }
            const endTime = new Date().getTime();
            const elapsedTime = endTime - startTime;
            const time = msToTime(elapsedTime)
            console.log("Numero di nodi sanitizzati: " + counter);
            console.log("Tempo di sanitizzazione dei nodi: " + time);            
        }
        
        if(sensitiveRelProperties){
            const startTime = new Date().getTime();
            let counter = 0;

            for (const { property, condition, relationshipName, containsString} of sensitiveRelProperties) {
                counter++;
                if(relationshipName){
                    let query = `
                    MATCH ()-[n:${relationshipName}]-()
                `;
                if (property) {
                    query += `WHERE n.${property} IS NOT NULL`;
                    if (condition){
                        query += ` AND ${condition}`
                    } else if (containsString){
                        query += ` AND toLower(n.${property}) CONTAINS toLower("${containsString}")`
                    }
                } 
                query += `
                    REMOVE n.${property}
                `;
                await session.run(query);
                } else {
                    let query = `
                    MATCH ()-[n]-()
                `;
                if (property) {
                    query += `WHERE n.${property} IS NOT NULL`;
                    if (condition){
                        query += ` AND ${condition}`
                    } else if (containsString){
                        query += ` AND toLower(n.${property}) CONTAINS toLower("${containsString}")`
                    }
                } 
                query += `
                    REMOVE n.${property}
                `;
                await session.run(query);
                }                      
            }
            const endTime = new Date().getTime();
            const elapsedTime = endTime - startTime;
            const time = msToTime(elapsedTime);
            console.log("Numero di proprietà di relazioni sanitizzate: " + counter)
            console.log("Tempo di sanitizzazione delle proprietà delle relazioni: " + time);
        }   
        if(config.sensitiveRelationships){
            const startTime = new Date().getTime();
            let counter = 0;
            for (const { property, condition, relationshipName, containsString } of sensitiveRelationships) {
                counter++;
                if(relationshipName){
                    let query = `
                    MATCH ()-[n:${relationshipName}]-()
                    `;
                    if (property) {
                        query += `WHERE n.${property} IS NOT NULL`;
                        if (condition){
                            query += ` AND ${condition}`
                        } else if (containsString){
                            query += ` AND toLower(n.${property}) CONTAINS toLower("${containsString}")`
                        }
                    } else if (condition) {
                        query += `WHERE ${condition}`
                    }    
                    query += `
                        DELETE n
                    `;
                    await session.run(query);
                } else {
                    let query = `
                    MATCH ()-[n]-()
                    `;
                    if (property) {
                        query += `WHERE n.${property} IS NOT NULL`;
                        if (condition){
                            query += ` AND ${condition}`
                        } else if (containsString){
                            query += ` AND toLower(n.${property}) CONTAINS toLower("${containsString}")`
                        }
                    } else if (condition) {
                        query += `WHERE ${condition}`
                    }    
                    query += `
                        DELETE n
                    `;
                    await session.run(query);
                }                
            }
            const endTime = new Date().getTime();
            const elapsedTime = endTime - startTime;
            const time = msToTime(elapsedTime);
            console.log("Numero di relazioni sanitizzate: " + counter);
            console.log("Tempo di sanitizzazione delle relazioni: " + time );
        }
    } catch (error) {
        console.error("Errore durante la sanitizzazione del database:", error);
    } finally {
        await session.close();
        driver.close();
    }
}

const msToTime = (duration: number) => {
    let milliseconds = Math.floor(duration % 1000),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    hours = (hours < 10) ? 0 + hours : hours;
    minutes = (minutes < 10) ? 0 + minutes : minutes;
    seconds = (seconds < 10) ? 0 + seconds : seconds;
    return hours + "h" + minutes + "m" + seconds + "s" + milliseconds + "ms";
}

const readConfigFile = (filePath: string): SanitizationConfig | null => {
    try {
        const configFileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(configFileContent);
    } catch (error) {
        console.error("Errore durante la lettura del file di configurazione: ", error);
        return null;
    }
};

const askForFilePath = () => { 
   rl.question("Inserisci il percorso del file di configurazione JSON: ", async (filePath) => {
        const config = readConfigFile(filePath);
        if (config) {
            try{
                await sanitizeDatabase(config);
                console.log("Database sanificato con successo");
            }catch(error){
                console.log("Errore durante la sanitizzazione: ", error);
            }
        } else {
            console.log("Impossibile leggere il file di configurazione.");
        }
        rl.close();
    });
};

askForFilePath();
