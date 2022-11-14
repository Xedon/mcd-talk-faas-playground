# FaaS with serverless framework and localstack 

## Getting started

### Requierements

- Docker latest
- Node 16
- Npm latest

### Start localstack

`docker compose up -d`

### Deploy the api in localstack

1. `npm install`
2. `npm run deploy-local`

### Stop localstack

`docker compose down`

### Invoking endpoints

I provided u with a `calls.rest` which uses a vscode extesions that is mentioned in the recommended extensions in this repository.

After you deployed localstack u need to change the STACK_ID in `calls.rest` from the output of your `npm run deploy-local` call.

The stack id is a part of the endpoint url.
