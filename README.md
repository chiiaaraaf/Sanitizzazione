# Sanitizzazione
# Sanitizzazione di Basi di Dati a Grafo

## About
Queste soluzioni sono parte del lavoro di tesi intitolato "Sanitizzazione di basi di dati a grafo". 
- `randomSel.ts` seleziona elementi casuali da un database Neo4j.
- `sanitization.ts` si occupa della sanitizzazione dei dati sensibili all'interno del database.

## Requirements
- Node.js
- Neo4j Database
- npm packages: `neo4j-driver`, `readline`, `fs`, `dotenv`

## Configuration
Prima di eseguire gli script, assicurati di avere un file `.env` nella tua directory radice con i seguenti contenuti:
NEO4J_URI=tuo_uri_neo4j
NEO4J_USER=tuo_username
NEO4J_PASSWORD=tua_password


## randomSel.ts
Questo script effettua la selezione casuale di nodi, proprietà dei nodi, relazioni e proprietà delle relazioni nel database Neo4j. Chiede all'utente di inserire il numero di elementi da selezionare e offre varie opzioni per la selezione casuale.

Per eseguirlo:
node randomSel.ts


## sanitization.ts
Questo script esegue la sanitizzazione del database Neo4j seguendo le specifiche di un file di configurazione JSON fornito dall'utente. Rimuove o modifica nodi, relazioni, etichette e proprietà sensibili per proteggere i dati.

Per eseguirlo:
node sanitization.ts

**Nota:** È necessario un file di configurazione JSON che definisca quali dati sanificare.
