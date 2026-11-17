pipeline {
    agent any

    options {
        timeout(time: 40, unit: 'MINUTES')
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('2. Build Frontend') {
            steps {
                sh '''
                    docker build \
                      -t lms-frontend:ci \
                      "/opt/libri/jenkins-workspace/${JOB_NAME}/frontend"
                '''
            }
        }

        stage('3. Build Backend') {
            steps {
                sh '''
                    docker build \
                      -t lms-backend:ci \
                      "/opt/libri/jenkins-workspace/${JOB_NAME}/backend"
                '''
            }
        }

        stage('4. Verify Compose') {
            steps {
                sh '''
                    docker compose \
                      -f /opt/libri/LMS/docker-compose.yml \
                      --project-directory /opt/libri/LMS \
                      config --quiet
                '''
            }
        }
    }

    post {
        success {
            echo 'CI BUILD SUCCESS'
        }
        failure {
            echo 'CI BUILD FAILED'
        }
    }
}
