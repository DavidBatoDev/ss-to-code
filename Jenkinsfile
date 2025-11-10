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

  }
}
