.DEFAULT_GOAL := help
SKIP_TESTS := -DskipTests

.PHONY: help build run test test-unit test-integration clean kill lint docs run-script kill-script

help: ## Display all available make commands with descriptions
	@echo ""
	@echo "Banking Statement Converter Platform"
	@echo "====================================="
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

build: ## Compile, package, and install the project (skips tests)
	mvn clean install $(SKIP_TESTS)

run: ## Start the application (Swagger at /swagger-ui.html, H2 at /h2-console)
	mvn spring-boot:run

test: ## Run all test categories with JaCoCo coverage
	mvn verify

test-unit: ## Run unit tests only
	mvn test -Dtest="*Test" -DfailIfNoTests=false

test-integration: ## Run integration tests only
	mvn verify -Dtest="*IntegrationTest,*IT" -DfailIfNoTests=false

kill: ## Kill running Spring Boot process to free port 8081
	@echo "Killing Spring Boot processes..."
	@pkill -f 'java.*BankingConverterApplication' 2>/dev/null && echo "  Spring Boot stopped" || echo "  No Spring Boot process found"
	@pkill -f 'java.*spring-boot:run' 2>/dev/null && echo "  Maven spring-boot:run stopped" || true
	@echo "Done. Port 8081 released."

clean: ## Remove build artifacts and generated output files
	mvn clean
	rm -rf output/*.mt940 output/*.mt942 output/*.xml

lint: ## Run static analysis (compiler warnings)
	mvn compile -Xlint:all 2>&1 | grep -E "(warning|error)" | head -50 || true

docs: ## Generate JaCoCo HTML coverage report → target/site/jacoco/index.html
	mvn verify -DskipTests=false
	@echo "JaCoCo report: target/site/jacoco/index.html"

run-script: ## Build and start via run.sh (macOS/Linux) — foreground with health check
	bash run.sh

kill-script: ## Stop the backend via kill.sh (macOS/Linux)
	bash kill.sh
