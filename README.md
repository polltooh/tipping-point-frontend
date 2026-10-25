# Catalyst Backend (`catalyst-backend`)

Python FastAPI + **LangChain** + **LangGraph** + **Polygon.io** backend managed via **Poetry**.

## Responsibilities
1. Loads OpenAI (`default.openai.api_key`) and Polygon.io (`default.data.polygon_api_key`) credentials from `../.secrets.toml` via `dynaconf`.
2. Runs a 4-stage **LangGraph / LangChain** DAG synthesis pipeline:
   - `extract_intent`: Parses natural-language trading prompts and resolves relevant tickers.
   - `fetch_market_data`: Queries real-time quotes, 14-day RSI, MACD, and news headlines from Polygon.io.
   - `compile_dag`: Uses `ChatOpenAI(model="gpt-4o").with_structured_output(StrategyDAGSpec)` to build the multi-column Strategy Execution DAG (`signals`, `gates`, `trades`, `edges`, and Catalyst DSL v3 code) grounded in live market readings.
   - `evaluate_decision`: Evaluates the DAG to produce an actionable trading decision (`EXECUTE_NOW`, `EXIT_OR_HEDGE`, or `WAIT_AND_WATCH`).

## Commands
```bash
cd backend
poetry env use /opt/homebrew/bin/python3.12
poetry install
poetry run uvicorn catalyst_backend.main:app --host 0.0.0.0 --port 8000 --reload
```
