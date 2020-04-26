# Programming.in.th Cloud Functions

Firebase Cloud Functions backend for programming.in.th (beta)

Contains all back-end code

We will need to give you cred.json because it is not found in the repo

To test with production database (running the functions server locally), run following command in terminal:
`export GOOGLE_APPLICATION_CREDENTIALS="[PATH_TO_THIS_REPO]/cred.json"`

To start the server, make sure you are in the "functions" directory found within the repo and run following command in terminal:
`npm run-script serve`

To make requests to the local server, 
add `.useFunctionsEmulator()` to `src/lib/firebase.ts` and change baseURL in `src/config.ts`

To deploy, run in the "functions" directory:
`npm run-script deploy`
