# SynthCode AI service

FastAPI service that will host the model-facing features of SynthCode: inline
completions, chat over the codebase, and code indexing.

Right now it only exposes `GET /health`.

## Run

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn synthcode.main:app --reload --port 8000
pytest
```
