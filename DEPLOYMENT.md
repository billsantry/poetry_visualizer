# Deployment Guide: Poetry Visualizer (Google Vertex AI)

This project is configured to run as an Azure Static Web App (with a managed API) or an Azure App Service + Azure Functions setup.

## 1. Security & Architecture
- **Frontend**: Standard HTML/CSS/JS. It calls the backend endpoint `/api/generate-image`.
- **Backend**: Azure Functions (Node.js). It holds the secrets and proxies requests to Google Vertex AI.
- **Secrets**: API Keys are NEVER exposed to the browser. They are stored in Server Environment Variables.

## 2. Environment Variables
You MUST set the following Environment Variables in your deployment target (e.g., Azure Portal -> Configuration -> Application Settings).

| Variable Name | Value Description |
|---|---|
| `GOOGLE_API_KEY` | Your Google Cloud API Key (starts with `AIza...`) |
| `GOOGLE_PROJECT_ID` | Your Google Cloud Project ID (e.g., `tsgbot`) |
| `GOOGLE_LOCATION` | (Optional) Vertex Region (default: `us-central1`) |
| `GOOGLE_MODEL_ID` | (Optional) Model to use (default: `imagen-3.0-generate-001`) |

## 3. Deployment Steps (Azure Static Web Apps)

1. **Push to GitHub**:
   Push this folder (`poetry-visualizer`) to a new GitHub repository.

2. **Create Resource in Azure**:
   - Go to Azure Portal.
   - Create a **Static Web App**.
   - Select "GitHub" as the source and pick your new repo.
   - **Build Presets**:
     - **App location**: `/` (root)
     - **Api location**: `/api` (This will automatically detect the Azure Functions)
     - **Output location**: `.` (or leave blank if it detects index.html)

3. **Configure Secrets**:
   - Once created, go to the resource in Azure Portal.
   - Navigate to **Configuration**.
   - Add the Application Settings listed in Section 2 (`GOOGLE_API_KEY`, etc.).
   - Save.

## 4. Local Development
To run the full stack locally (Frontend + Backend), you need **Azure Functions Core Tools**.

1. Install Core Tools: `npm i -g azure-functions-core-tools@4 --unsafe-perm true`
2. Create a local secrets file:
   - Create `api/local.settings.json`:
     ```json
     {
       "IsEncrypted": false,
       "Values": {
         "AzureWebJobsStorage": "",
         "FUNCTIONS_WORKER_RUNTIME": "node",
         "GOOGLE_API_KEY": "YOUR_REAL_KEY_HERE",
         "GOOGLE_PROJECT_ID": "tsgbot"
       }
     }
     ```
3. Run the app:
   - Open terminal in root.
   - Run: `func start` within the `api` folder to start backend? 
   - Actually, for SWA (Static Web Apps), use the SWA CLI:
     `npx @azure/static-web-apps-cli start . --api-location api`
     This will serve the frontend at `http://localhost:4280` and proxy `/api` calls.

## 5. Troubleshooting
- **401/403 Errors**: Check your `GOOGLE_API_KEY`.
- **429 Errors**: Quota exceeded. The app has built-in retries, but if many users use it at once, you may need to request a quota increase from Google Cloud Console.
