// Backend  -> docker build -> k3s (NodePort 30800, CloudFront /api/* origin)
// Frontend -> static export -> S3 -> CloudFront invalidation
// Single-node k3s: the image is built on this box and imported straight into k3s' containerd,
// so no registry is needed. Credentials (secret text): openai-api-key, supabase-url, supabase-publishable-key
pipeline {
  agent any

  environment {
    IMAGE              = 'ss-to-code-backend'
    IMAGE_TAG          = "${env.BUILD_NUMBER}"
    KUBECONFIG         = '/var/lib/jenkins/.kube/config'
    BACKEND_URL        = 'http://localhost:30800'
    AWS_DEFAULT_REGION = 'ap-southeast-1'
    CF_COMMENT         = 'ss-to-code'
  }

  options {
    timestamps()
    timeout(time: 40, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Lint & Test') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              sh '''
                python3 -m venv .venv && . .venv/bin/activate
                pip install -q -r requirements.txt
                ruff check app
                python -m pytest -q
              '''
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') { sh 'npm ci --no-audit --no-fund && npx tsc --noEmit' }
          }
        }
      }
    }

    stage('Trivy FS scan') {
      steps {
        sh 'trivy fs --scanners vuln,secret --severity HIGH,CRITICAL --exit-code 0 --skip-dirs frontend/node_modules --skip-dirs backend/.venv -o trivy-fs.txt .'
      }
    }

    stage('Backend: build & scan') {
      steps {
        sh '''
          docker build -t $IMAGE:$IMAGE_TAG backend
          trivy image --severity CRITICAL --exit-code 1 --ignore-unfixed \
            -o trivy-backend.txt $IMAGE:$IMAGE_TAG
        '''
      }
    }

    stage('Backend: load into k3s') {
      steps {
        sh 'docker save $IMAGE:$IMAGE_TAG | sudo /usr/local/bin/k3s ctr images import -'
      }
    }

    stage('Backend: deploy to k3s') {
      steps {
        withCredentials([string(credentialsId: 'openai-api-key', variable: 'OPENAI_API_KEY')]) {
          sh '''
            kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata: { name: ss-to-code }
EOF
            kubectl -n ss-to-code create secret generic openai \
              --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY" --dry-run=client -o yaml | kubectl apply -f -
            envsubst '$IMAGE $IMAGE_TAG' < k8s/app.yaml | kubectl apply -f -
            kubectl -n ss-to-code rollout status deploy/backend --timeout=180s
          '''
        }
      }
    }

    stage('Backend: smoke test') {
      steps {
        sh '''
          for i in $(seq 1 10); do
            curl -fsS $BACKEND_URL/api/health && exit 0; sleep 3
          done
          exit 1
        '''
      }
    }

    stage('Frontend: build') {
      steps {
        dir('frontend') {
          withCredentials([
            string(credentialsId: 'supabase-url', variable: 'NEXT_PUBLIC_SUPABASE_URL'),
            string(credentialsId: 'supabase-publishable-key', variable: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
          ]) {
            sh 'NEXT_TELEMETRY_DISABLED=1 npm run build && test -f out/index.html'
          }
        }
      }
    }

    stage('Frontend: deploy to S3 + CloudFront') {
      steps {
        sh '''
          DIST_ID=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Comment=='$CF_COMMENT'].Id | [0]" --output text)
          BUCKET=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Comment=='$CF_COMMENT'] | [0].Origins.Items[?Id=='s3'] | [0].DomainName" \
            --output text | cut -d. -f1)
          CF_DOMAIN=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Comment=='$CF_COMMENT'].DomainName | [0]" --output text)
          echo "bucket=$BUCKET distribution=$DIST_ID"
          echo "https://$CF_DOMAIN" > cf_url.txt

          # Pass 1: hashed assets, cache forever
          aws s3 sync frontend/out/ s3://$BUCKET --delete --exclude "*.html" \
            --cache-control "public,max-age=31536000,immutable"
          # Pass 2: HTML, always revalidate
          aws s3 sync frontend/out/ s3://$BUCKET --delete --exclude "*" --include "*.html" \
            --cache-control "no-cache" --content-type "text/html; charset=utf-8"

          INV=$(aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" \
            --query Invalidation.Id --output text)
          aws cloudfront wait invalidation-completed --distribution-id $DIST_ID --id $INV
        '''
      }
    }

    stage('E2E smoke test via CloudFront') {
      steps {
        sh '''
          URL=$(cat cf_url.txt)
          for i in $(seq 1 12); do
            if [ "$(curl -s -o /dev/null -w '%{http_code}' $URL/)" = "200" ] \
               && curl -fsS $URL/api/health | grep -q '"ok"'; then
              echo "OK: $URL"; exit 0
            fi
            sleep 10
          done
          exit 1
        '''
      }
    }
  }

  post {
    failure {
      // Frontend rollback: re-run the previous successful build ("Rebuild"), or restore the
      // previous S3 object versions (bucket versioning is on) and invalidate "/*". See README.
      sh '''
        if kubectl -n ss-to-code get deploy backend >/dev/null 2>&1; then
          echo "Rolling back backend..."
          kubectl -n ss-to-code rollout undo deploy/backend || true
        fi
      '''
    }
    always {
      archiveArtifacts artifacts: 'trivy-*.txt', allowEmptyArchive: true
      sh 'docker image prune -af --filter "until=24h" || true'
    }
  }
}
