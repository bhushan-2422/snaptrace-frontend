# terminal 1 (backend)
cd SnapTrace && venv/bin/uvicorn app.main:app --reload
# terminal 2 (worker)
cd SnapTrace && venv/bin/python -m app.workers.job_worker
# terminal 3 (frontend)
cd snaptrace_frontend && npm run dev