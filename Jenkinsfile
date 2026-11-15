pipeline {
    agent any

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo '📥 [Stage 1] Lấy mã nguồn từ Git Repository...'
                checkout scm
            }
        }

        stage('2. Build Frontend (React / Vite)') {
            steps {
                echo '⚛️ [Stage 2] Đang kiểm tra TypeScript và đóng gói Frontend...'
                sh 'docker build -t lms-frontend:ci ./frontend'
            }
        }

        stage('3. Build Backend (.NET 10)') {
            steps {
                echo '🚀 [Stage 3] Đang biên dịch mã nguồn và đóng gói Backend API...'
                sh 'docker build -t lms-backend:ci ./backend'
            }
        }

        stage('4. Verify Compose Configuration') {
            steps {
                echo '🐳 [Stage 4] Kiểm tra cấu trúc file cấu hình Docker Compose...'
                sh 'docker compose -f docker-compose.yml config'
            }
        }
    }

    post {
        always {
            echo '🧹 [Cleanup] Dọn dẹp các image kiểm thử tạm thời...'
            sh 'docker rmi -f lms-frontend:ci lms-backend:ci || true'
        }
        success {
            echo '=================================================='
            echo '🎉 [SUCCESS] CI PIPELINE BUILD THÀNH CÔNG!'
            echo 'Frontend, Backend API và Dockerfile đều hợp lệ.'
            echo '=================================================='
        }
        failure {
            echo '=================================================='
            echo '❌ [FAILURE] CI PIPELINE BUILD THẤT BẠI!'
            echo 'Vui lòng kiểm tra Console Output để xem chi tiết lỗi.'
            echo '=================================================='
        }
    }
}
