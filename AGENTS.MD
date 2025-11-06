# Project overview

This project visualizes the MEV analysis data stored at clickhouse. In addition to the MEV, we also measure the performance of the [timeboost protocol](https://docs.arbitrum.io/how-arbitrum-works/timeboost/gentle-introduction) of its revenue, real time bids, and the overall profit of the express lane controllers.

# Project Structure

This project uses npm workspaces with three packages:

- **shared** (`@mevscan/shared`): Common TypeScript type definitions used by both server and client
- **server** (`@mevscan/server`): Express.js API server located at `./server`
- **client** (`@mevscan/client`): React app located at `./client`

# Build Commands

1. **Server**

   The server is located at `./server` directory. Run the dev server with:
   - `npm run dev:server` (from root) or `npm run dev` (from server directory)
   - `npm run dev:watch` (from root) or `npm run dev:watch` (from server directory)
   
   For now we keep most of the server code inside the index.ts to keep the server simple and dumb.

2. **Client (React app)**

   Run `npm run dev` (from root) to run the React dev HMR. The webpage is at localhost:5173.
   We use Material UI for boilerplating the components.

3. **Install dependencies**

   From the root directory, run `npm install` to install all workspace dependencies.

# Architecture 

- The server is located at `server/` directory, which makes SQL queries to the ClickHouse DB and returns JSON as response
- The `shared/` directory contains type definitions (`types.ts`) used by both frontend client and backend server. For each visualization, define an interface here.
- For each visualization, define an endpoint at server and a corresponding method at `client/src/services/apiClient.ts`
- Workspaces are linked via npm workspaces, so imports use `@mevscan/shared` instead of relative paths 


# Visualization Instruction

User will provide:
- Chart type
- Query to fetch the data from clickhouse
- Title

If any of the above is missing ask the user. Add the visualization to Dashboard page. 

# Guidelines 

- For the time range the given SQL should use should be the last 15 minutes. When you design the api endpoint, support the time range parameter and use that in the query. The option for time ranges are: 5min, 15min, 30min, 1 hour
- The Database schema is located under ./schema directory

# Deployment

Docker Compose setup: `docker-compose up --build` (or `-d` for detached). Stop with `docker-compose down`. View logs: `docker-compose logs -f [api|web]`.

**Services:**
- API: `localhost:3001` (health: `/health`)
- Web: `localhost:80` (nginx proxies API requests)

**Required `.env` variables:**
- `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DATABASE`

**Architecture:** React app (Vite → nginx) + Express API server. React uses relative URLs; nginx proxies to backend.