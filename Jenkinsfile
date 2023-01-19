pipeline {
    agent any
    environment {
        TEST_A = 'A'
    }

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                script {
                    env.TEST_B = 'B'
                    echo "$TEST_B"
                    TEST_D = "D"
                }
            }
        }
        stage('Test') {
            steps {
                script {
                    echo 'Testing..'
                    echo TEST_A
                    echo "${TEST_B}"
                    env.TEST_B = "C"
                    echo TEST_D
                }
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
                script {
                    echo TEST_B
                }
            }
        }
    }
}
