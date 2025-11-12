pipeline {
  agent any

  environment {
    DOCKERHUB_USER = credentials('dockerhub-user')      // Secret text: your Docker Hub username
    IMAGE_TAG      = "${env.BUILD_NUMBER}"
    KUBECONFIG     = '/var/lib/jenkins/.kube/config'
    APP_URL        = 'http://localhost:30080'
  }

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
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
                pytest -q
              '''
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'npm install --no-audit --no-fund && npm run lint'
            }
          }
        }
      }
    }

    stage('Trivy FS scan') {
      steps {
        sh 'trivy fs --scanners vuln,secret --severity HIGH,CRITICAL --exit-code 0 --format table -o trivy-fs.txt .'
      }
    }

    stage('Docker build') {
      parallel {
        stage('Backend image')  { steps { sh 'docker build -t $DOCKERHUB_USER/ss-to-code-backend:$IMAGE_TAG backend' } }
        stage('Frontend image') { steps { sh 'docker build -t $DOCKERHUB_USER/ss-to-code-frontend:$IMAGE_TAG frontend' } }
      }
    }

    stage('Trivy image scan') {
      steps {
        sh '''
          for svc in backend frontend; do
            trivy image --severity CRITICAL --exit-code 1 --ignore-unfixed \
              -o trivy-$svc.txt $DOCKERHUB_USER/ss-to-code-$svc:$IMAGE_TAG
          done
        '''
      }
    }

    stage('Push') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'U', passwordVariable: 'P')]) {
          sh '''
            echo "$P" | docker login -u "$U" --password-stdin
            for svc in backend frontend; do docker push $DOCKERHUB_USER/ss-to-code-$svc:$IMAGE_TAG; done
          '''
        }
      }
    }

  }
}
