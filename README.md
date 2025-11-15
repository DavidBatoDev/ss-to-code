# Screenshot → Code (DevOps edition)

Upload a screenshot and OpenAI (gpt-6-luna) streams back HTML/React/Vue + Tailwind code with a live preview. You can then ask it to change the code.

**Stack:** Next.js 15 + TypeScript + Tailwind v4 frontend · FastAPI backend · OpenAI only
**DevOps:** Docker (multi-stage, non-root) · docker-compose · k3s manifests · Jenkins pipeline (test → Trivy → build → push → deploy → smoke test → auto-rollback) · Terraform on AWS EC2 · CloudWatch

```
Browser ──> Next.js (:3000) ──/api/generate proxy──> FastAPI (:8000) ──> OpenAI
```
The frontend proxies to the backend through `BACKEND_URL`, which is read at runtime. One image works in every environment because no backend URL gets baked in at build time (the original repo's main deployment gotcha).

## Run locally
```bash
cp .env.example .env   # add OPENAI_API_KEY
docker compose up --build
# http://localhost:3000
```
Dev without Docker: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`, then `cd frontend && npm install && npm run dev`.

## Deploy to AWS (~$8.50/week on t3.medium 24/7; stop it when idle)
```bash
# 0. Budget guardrail (aws budgets create-budget ... $10)
# 1. Optional remote state: S3 bucket + DynamoDB lock table, then uncomment backend in main.tf
aws s3 mb s3://ss-to-code-tfstate-<unique>
aws dynamodb create-table --table-name ss-to-code-tf-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST
# 2. Provision
cd terraform && cp example.tfvars terraform.tfvars   # edit
terraform init && terraform apply
```
Bootstrapping takes about 5 minutes (see `user_data.sh`). Then open `jenkins_url`:
1. Unlock it with `sudo cat /var/lib/jenkins/secrets/initialAdminPassword` and install the suggested plugins.
2. Add these credentials: `dockerhub` (username/password), `dockerhub-user` (secret text), `openai-api-key` (secret text).
3. Create a Pipeline job from SCM that points at this repo (`Jenkinsfile`). Optionally add a GitHub webhook.
4. Build. The app is served at `app_url` (NodePort 30080).

Rollback: `kubectl -n ss-to-code rollout undo deploy/frontend`. Images are tagged `$BUILD_NUMBER`, so any earlier build can be redeployed.

Teardown: `terraform destroy`, then delete the state bucket and the lock table.
