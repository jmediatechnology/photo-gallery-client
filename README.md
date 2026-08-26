# Photo Gallery Client

Photo Gallery Client consumes Photo Gallery Server. 

## start application

```
docker compose up --build -d 
```
Your application will be available at http://localhost:8080.

# start application in watch mode

```
docker compose watch react-dev
```
Your application will be available at http://localhost:5173.

# run tests

[Running Automated Tests](docs/testing/Running_Automated_Tests.md)

# run build

Run a build
```
npm run build
```

# start application for production

```
docker compose build react-prod
docker compose up -d react-prod
```
