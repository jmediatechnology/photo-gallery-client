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

Multiple ways to run tests:
```
docker compose run --rm react-test
npm run test
```

Run one test file: 
```
npm run test -- src/components/PhotoGallery/PhotoGallery
npm run test -- src/components/Photograph/Photograph
npm run test -- src/components/LoginModal/LoginModal
npm run test -- src/components/Logo/Logo
npm run test -- src/components/NavBar/NavBar
npm run test -- src/components/PhotographDeleteModal/PhotographDeleteModal
npm run test -- src/components/PhotographEditModal/PhotographEditModal
npm run test -- src/components/PhotographModal/PhotographModal
npm run test -- src/components/PhotographUploadModal/PhotographUploadModal
npm run test -- src/App
```

Run test by test name: 
```
npm run test -- --testNamePattern "Photograph"
```


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
