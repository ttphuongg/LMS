pipeline {
    agent any

    options {
        timeout(time: 40, unit: 'MINUTES')
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    parameters {
        booleanParam(
            name: 'DEPLOY_BACKEND',
            defaultValue: false,
            description: 'Triển khai Backend lên VPS sau khi CI thành công'
        )
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('2. Build Frontend') {
            steps {
                sh 'docker build -t lms-frontend:ci ./frontend'
            }
        }

        stage('3. Build Backend') {
            steps {
                sh 'docker build -t lms-backend:ci ./backend'
            }
        }

        stage('4. Verify Compose') {
            steps {
                sh '''
                    docker compose \
                      -f /opt/libri/LMS/docker-compose.yml \
                      -f /opt/libri/LMS/docker-compose.deploy.yml \
                      --project-directory /opt/libri/LMS \
                      config --quiet
                '''
            }
        }

        stage('5. Deploy Backend') {
            when {
                expression { params.DEPLOY_BACKEND }
            }

            steps {
                sh '''
                    set -eu

                    # Chi cho phep commit tren main duoc deploy
                    test "$(git rev-parse HEAD)" = \
                         "$(git rev-parse refs/remotes/origin/main)"

                    # Giu image hien tai de co the rollback
                    if docker image inspect lms-api:latest >/dev/null 2>&1; then
                        docker tag lms-api:latest lms-api:rollback
                    fi

                    # Chuyen image da build thanh image Production
                    docker tag lms-backend:ci lms-api:latest

                    # Chi cap nhat API, khong tao lai PostgreSQL
                    docker compose \
                      -p lms \
                      -f /opt/libri/LMS/docker-compose.yml \
                      -f /opt/libri/LMS/docker-compose.deploy.yml \
                      --project-directory /opt/libri/LMS \
                      up -d --no-deps --no-build --force-recreate api

                    docker inspect \
                      --format '{{.State.Running}}' \
                      thuvien_api | grep -qx true
                '''
            }
        }
    }

    post {
        success {
            echo 'PIPELINE SUCCESS'
        }

        failure {
            echo 'PIPELINE FAILED'
        }
    }
}
