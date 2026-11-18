
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
                anyOf {
                    changeset 'backend/**'
                    changeset 'docker-compose.yml'
                    changeset 'docker-compose.deploy.yml'
                }
            }

            steps {
                sh '''
                    set -eu

                    # Chi deploy revision main
                    test "$(git rev-parse HEAD)" = \
                         "$(git rev-parse refs/remotes/origin/main)"

                    # Luu image cua container dang chay
                    PREVIOUS_IMAGE=$(docker inspect \
                      --format '{{.Image}}' thuvien_api)

                    docker tag "$PREVIOUS_IMAGE" lms-api:rollback

                    # Gan image CI thanh Production
                    docker tag lms-backend:ci lms-api:latest

                    deploy_api() {
                        docker compose \
                          -p lms \
                          -f /opt/libri/LMS/docker-compose.yml \
                          -f /opt/libri/LMS/docker-compose.deploy.yml \
                          --project-directory /opt/libri/LMS \
                          up -d --no-deps --no-build --force-recreate api
                    }

                    # Khoi phuc khi Compose deploy that bai
                    if ! deploy_api; then
                        echo "Deploy failed. Rolling back..."
                        docker tag lms-api:rollback lms-api:latest
                        deploy_api || true
                        exit 1
                    fi

                    # Kiem tra API sau deploy
                    HEALTHY=0

                    for attempt in $(seq 1 12); do
                        if curl -fsS -o /dev/null \
                          --connect-timeout 5 \
                          --max-time 15 \
                          "https://api.libri.id.vn/swagger/index.html"; then
                            HEALTHY=1
                            break
                        fi

                        echo "API not ready. Retrying..."
                        sleep 5
                    done

                    # Rollback neu API khong phan hoi
                    if [ "$HEALTHY" -ne 1 ]; then
                        echo "Health check failed. Rolling back..."
                        docker tag lms-api:rollback lms-api:latest
                        deploy_api || true
                        exit 1
                    fi

                    echo "Backend deployed successfully."
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD PIPELINE SUCCESS'
        }

        failure {
            echo 'CI/CD PIPELINE FAILED'
        }
    }
}
