# Screenshot → Code (DevOps edition)

Upload a screenshot and OpenAI (gpt-6-luna) streams back HTML/React/Vue + Tailwind code with a live preview. You can then ask it to change the code.

**Stack:** Next.js 15 + TypeScript + Tailwind v4 frontend · FastAPI backend · OpenAI only
**DevOps:** Docker (multi-stage, non-root) · docker-compose · k3s manifests · Jenkins pipeline (test → Trivy → build → push → deploy → smoke test → auto-rollback) · Terraform on AWS EC2 · CloudWatch

```
Browser ──> Next.js (:3000) ──/api/generate proxy──> FastAPI (:8000) ──> OpenAI
```
The frontend proxies to the backend through `BACKEND_URL`, which is read at runtime. One image works in every environment because no backend URL gets baked in at build time (the original repo's main deployment gotcha).

