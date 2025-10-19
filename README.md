# Daily Math

Daily math questions.

Upload test PDFs at `/upload`. Then view `/uploads` to extract the questions from the PDFs.

## Setup

Create an Appwrite project (either self-host or cloud), then set the following environment variables:

```sh
APPWRITE_PROJECT_ID=
APPWRITE_ENDPOINT=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_TABLE_ANSWERS_ID=
APPWRITE_TABLE_COMPETITIONS_ID=
APPWRITE_TABLE_UPLOADS_ID=
APPWRITE_TABLE_QUESTIONS_ID=
APPWRITE_TABLE_SOLUTIONS_ID=
APPWRITE_BUCKET_ID=
```

## Building

To build, use:

```sh
npm run build
```

Then, to run:

```sh
node build
```

Set the `PORT` environment variable if needed.
