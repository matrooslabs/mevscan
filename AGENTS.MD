# Project overview

This project visualizes the MEV analysis data stored at clickhouse. In addition to the MEV, we also measure the performance of the [timeboost protocol](https://docs.arbitrum.io/how-arbitrum-works/timeboost/gentle-introduction) of its revenue, real time bids, and the overall profit of the express lane controllers.

# Build Commands

1. Server

the server is located at ./server directory. Run the dev server with `npm run dev` or `npm run dev:watch`. For now we keep most of the server code inside the index.ts to keep the server simple and dumb. 

2. React app

run `npm run dev` to run the react dev HMR. The webpage is at localhost:5173
We use Material UI for boilerplating the components. 

# Architecture 

- The server is located at server/ directory, which makes a SQL query to the clickhouse db and returns the json as response
- the shared/types directory is the type definitions or interfaces for the frontend client and backend server to communicate. For each visualizations, define a interface
- For each visualization, define an endpoint at server and following method at apiClient.ts 


# Visualization Instruction

User will provide:
- Chart type
- Query to fetch the data from clickhouse
- Title

If any of the above is missing ask the user. Add the visualization to Dashboard page. 

# Guidelines 

- For the time range the given SQL should use should be the last 15 minutes. When you design the api endpoint, support the time range parameter and use that in the query. The option for time ranges are: 5min, 15min, 30min, 1 hour

# Deployment

Docker Compose setup: `docker-compose up --build` (or `-d` for detached). Stop with `docker-compose down`. View logs: `docker-compose logs -f [api|web]`.

**Services:**
- API: `localhost:3001` (health: `/health`)
- Web: `localhost:80` (nginx proxies API requests)

**Required `.env` variables:**
- `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DATABASE`

**Architecture:** React app (Vite → nginx) + Express API server. React uses relative URLs; nginx proxies to backend.