# Running Automated Tests

Multiple ways to run tests:

Build (test) container, run tests, and remove the (test) container after testing.    
```
docker compose run --rm react-test
```

Run all tests outside docker: 
```
npm run test
npx vitest run
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

Run code coverage:
```
npm run test -- --coverage
```
The command will display a code coverage report in the cli. 

It also creates a coverage directory containing the code coverage results in `/coverage/index.html`.
The code coverage report can be opened in a Browser. 
