# Steps to run the application:
- Build and run docker-compose file to run the application:
    + Go to grader-api then grader-image, run terminal in that and run command: docker build -t grader-image .
    + Run: docker compose up --build
- Because currently there is some problems with rabbitmq deno, after run docker compose up --build and you see all images are created
you need to go to app.js in programming-api and press save button and everything will work properly

# Steps to run the application (production mode):
- Build and run docker-compose file to run the application:
    + Go to grader-api then grader-image, run terminal in that and run command: docker build -t grader-image .
    + docker compose -f docker-compose.prod.yml --profile migrate up
    
# Steps to run the tests:
- First, do exactly steps in the steps to run the application
- Then, run: docker compose run --rm --entrypoint=npx e2e-playwright playwright test 

