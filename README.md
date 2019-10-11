# Programming.in.th Cloud Functions
Firebase Cloud Functions backend for programming.in.th (beta)

Contains all back-end code

We will need to give you grader-ef0b5-c147bbe98312.json because it is not found in the repo

To test with production database (running the functions server locally), run following command in terminal:
```export GOOGLE_APPLICATION_CREDENTIALS="[PATH_TO_THIS_REPO]/grader-ef0b5-c147bbe98312.json"```

To start the server, make sure you are in the "functions" directory found within the repo and run following command in terminal:
```npm run-script build && npm run-script serve```

To make requests to the local server, run:
```curl -H 'Content-Type: application/json' LOCAL_URL_HERE -X POST -d '{"data":YOUR_DATA_OBJECT_HERE}'```

To deploy, run in the "functions" directory:
```npm run-script deploy```
