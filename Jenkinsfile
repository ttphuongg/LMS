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

        // CHI CHAY khi co thay doi o Backend
        stage('2. Run Backend Unit Tests') {
            when {
                anyOf {
                    changeset 'backend/**'
                    changeset 'Jenkinsfile'
                }
            }
            steps {
                sh '''
                    if command -v dotnet >/dev/null 2>&1; then
                        dotnet test backend/LibrarySystem.slnx --configuration Release --logger "junit;LogFilePath=test-results.xml"
                    else
                        # Chay bang container .NET 10 SDK neu may chu Jenkins chua cai .NET CLI
                        HOST_DIR=$(pwd | sed 's|/var/jenkins_home/workspace|/opt/libri/jenkins-workspace|')
                        docker run --rm \
                          -v "${HOST_DIR}:/workspace" \
                          -w /workspace \
                          mcr.microsoft.com/dotnet/sdk:10.0 \
                          dotnet test backend/LibrarySystem.slnx --configuration Release --logger "junit;LogFilePath=test-results.xml"
                    fi
                '''
            }
        }

        // CHI CHAY khi co thay doi o Frontend
        stage('3. Verify Frontend Build') {
            when {
                anyOf {
                    changeset 'frontend/**'
                    changeset 'Jenkinsfile'
                }
            }
            steps {
                sh 'docker build -t lms-frontend:ci ./frontend'
            }
        }

        // CHI BUILD Backend khi co thay doi lien quan
        stage('4. Build Backend') {
            when {
                anyOf {
                    changeset 'backend/**'
                    changeset 'docker-compose.yml'
                    changeset 'docker-compose.deploy.yml'
                    changeset 'Jenkinsfile'
                }
            }
            steps {
                sh 'docker build -t lms-backend:ci ./backend'
            }
        }

        // Kiem tra cau hinh Docker Compose tren VPS
        stage('5. Verify Compose') {
            when {
                anyOf {
                    changeset 'backend/**'
                    changeset 'docker-compose.yml'
                    changeset 'docker-compose.deploy.yml'
                    changeset 'Jenkinsfile'
                }
            }
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

        // Trien khai Backend len VPS voi co che Rollback & Health Check
        stage('6. Deploy Backend') {
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

                    # Chi deploy tren nhanh main
                    test "$(git rev-parse HEAD)" = \
                         "$(git rev-parse refs/remotes/origin/main)"

                    # Luu image cu phong ngua (khong crash neu day la lan dau deploy)
                    PREVIOUS_IMAGE=$(docker inspect --format '{{.Image}}' thuvien_api 2>/dev/null || true)
                    if [ -n "$PREVIOUS_IMAGE" ]; then
                        docker tag "$PREVIOUS_IMAGE" lms-api:rollback
                    fi

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

                    # Rollback neu deploy that bai
                    if ! deploy_api; then
                        echo "Deploy failed. Rolling back..."
                        if [ -n "$PREVIOUS_IMAGE" ]; then
                            docker tag lms-api:rollback lms-api:latest
                            deploy_api || true
                        fi
                        exit 1
                    fi

                    # Kiem tra Health Check API
                    HEALTHY=0
                    for attempt in $(seq 1 12); do
                        if curl -fsS -o /dev/null \
                          --connect-timeout 5 \
                          --max-time 15 \
                          "https://api.libri.id.vn/health"; then
                            HEALTHY=1
                            break
                        fi

                        echo "API not ready. Retrying in 5s..."
                        sleep 5
                    done

                    # Rollback neu API khong phan hoi sau 60s
                    if [ "$HEALTHY" -ne 1 ]; then
                        echo "Health check failed. Rolling back..."
                        if [ -n "$PREVIOUS_IMAGE" ]; then
                            docker tag lms-api:rollback lms-api:latest
                            deploy_api || true
                        fi
                        exit 1
                    fi

                    echo "Backend deployed successfully."
                '''
            }
        }
    }

    post {
        always {
            // allowEmptyResults: true giup build khong bi loi khi stage Unit Test bi skip
            junit allowEmptyResults: true, testResults: '**/test-results.xml'
            // Tu dong don dep layer Docker thua
            sh 'docker image prune -f || true'
        }

        success {
            echo 'CI/CD PIPELINE SUCCESS'
        }

        failure {
            echo 'CI/CD PIPELINE FAILED'
        }
    }
}