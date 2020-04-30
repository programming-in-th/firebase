# API ![Deploy to CF](https://github.com/programming-in-th/api/workflows/Deploy%20to%20CF/badge.svg)

Firebase Cloud Functions for programming.in.th (beta)

Contains all back-end code

## Test with production database [DANGEROUS]

`export GOOGLE_APPLICATION_CREDENTIALS="[PATH_TO_CREDENTIALS]"`

## Start function emulators

Change directory to `functions` and run `npm run-script dev`

To make requests to the local server,
add `.useFunctionsEmulator()` to `src/lib/firebase.ts` and change baseURL in `src/config.ts`

## Deploy

push to `default` branch
