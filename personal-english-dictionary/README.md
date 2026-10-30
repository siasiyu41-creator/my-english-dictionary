# My English Dictionary

A minimal, English-first personal vocabulary website.

## Included

- Search by headword, core meaning, or collocation
- Detailed word pages: pronunciation, part of speech, definitions, synonyms, collocations, examples
- IELTS-ready example sentences
- Word-family and root notes
- Visual associations
- Active-recall review
- Add words in the browser
- Import/export JSON backups
- GitHub Actions validation for the dictionary data

## Deploy with GitHub Pages

1. Create a new GitHub repository, for example `my-english-dictionary`.
2. Upload all files and folders from this project to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/ (root)`, then save.
6. Wait for GitHub Pages to publish. Your site URL will look like:
   `https://YOUR-USERNAME.github.io/my-english-dictionary/`

## Add words

- Open the website and choose **Add word**. Browser-added words are stored in that browser's local storage.
- To keep a portable backup, choose **Export JSON backup**.
- To add words permanently to the shared website for all devices, edit `data/words.json` in the GitHub repository and commit the change. The GitHub Action checks the JSON structure.

## Important: automatic ChatGPT sync

GitHub Pages is static. It cannot safely accept writes directly from a normal web page, and a GitHub token must never be placed in `app.js`, `index.html`, or any public repository file.

The project is structured so an authenticated bridge can be added later. A secure automatic workflow needs:
1. A private server-side endpoint (for example, a Cloudflare Worker) that stores a GitHub token as a secret.
2. A narrowly scoped GitHub credential with permission to update only the dictionary repository.
3. A ChatGPT Action or other authenticated client that sends a validated word entry to that endpoint.
4. Server-side validation and duplicate checks before committing a change to `data/words.json`.

Do not paste a GitHub token into this repository or into a public website. The current starter works without any credentials and supports local add/import/export plus permanent repository updates through GitHub's editor.

## Data format

Dictionary entries live in `data/words.json`. Each entry can include:
`word`, `pronunciation`, `partOfSpeech`, `coreMeaning`, `definition`, `synonyms`, `collocations`, `examples`, `wordFamily`, `roots`, `visual`, and `ielts`.

## Notes

- Browser-local additions and review progress are specific to that browser/device.
- The initial collection includes the vocabulary already discussed in the conversation.
- Root notes are learning aids; check etymological details before treating them as formal historical derivations.
