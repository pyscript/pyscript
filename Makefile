MIN_NODE_VER := 20
MIN_NPM_VER  := 6
MIN_PY3_VER  := 8
NODE_VER     := $(shell node -v | cut -d. -f1 | sed 's/^v\(.*\)/\1/')
NPM_VER      := $(shell npm -v | cut -d. -f1)
PY3_VER      := $(shell python3 -c "import sys;t='{v[1]}'.format(v=list(sys.version_info[:2]));print(t)")
PY_OK        := $(shell python3 -c "print(int($(PY3_VER) >= $(MIN_PY3_VER)))")

all:
	@echo "\nThere is no default Makefile target right now. Try:\n"
	@echo "make setup - check your environment and install the dependencies."
	@echo "make update - update dependencies."
	@echo "make clean - clean up auto-generated assets."
	@echo "make build - build PyScript."
	@echo "make precommit-check - run the precommit checks (run eslint)."
	@echo "make test - run all automated tests in playwright."
	@echo "make fmt - format the code."
	@echo "make fmt-check - check the code formatting.\n"

.PHONY: check-node
check-node:
	@if [ $(NODE_VER) -lt $(MIN_NODE_VER) ]; then \
		echo "\033[0;31mBuild requires Node $(MIN_NODE_VER).x or higher: $(NODE_VER) detected.\033[0m"; \
		false; \
	fi

.PHONY: check-npm
check-npm:
	@if [ $(NPM_VER) -lt $(MIN_NPM_VER) ]; then \
		echo "\033[0;31mBuild requires Node $(MIN_NPM_VER).x or higher: $(NPM_VER) detected.\033[0m"; \
		false; \
	fi

.PHONY: check-python
check-python:
	@if [ $(PY_OK) -eq 0 ]; then \
		echo "\033[0;31mRequires Python 3.$(MIN_PY3_VER).x or higher: 3.$(PY3_VER) detected.\033[0m"; \
		false; \
	fi

# Check the environment, install the dependencies.
setup: check-node check-npm check-python
	cd core && npm ci && cd ..
ifeq ($(VIRTUAL_ENV),)
	echo "\n\n\033[0;31mCannot install Python dependencies. Your virtualenv is not activated.\033[0m"
	false
else
	python -m pip install -r requirements.txt
endif

# Clean up generated assets.
clean:
	find . -name \*.py[cod] -delete
	rm -rf $(env) *.egg-info
	rm -rf .pytest_cache .coverage coverage.xml

# Build PyScript.
build: precommit-check
	cd core && npx playwright install chromium && npm run build

# Update the dependencies.
update:
	python -m pip install -r requirements.txt --upgrade

# Run the precommit checks (run eslint).
precommit-check:
	pre-commit run --all-files

# Run all automated tests in playwright.
test:
	cd core && npm run test:integration

# Serve the repository with the correct headers.
serve:
	npx mini-coi .

# Format the code.
fmt: fmt-py
	@echo "Format completed"

# Check the code formatting.
fmt-check: fmt-py-check
	@echo "Format check completed"

# Format Python code.
fmt-py:
	black -l 88 --skip-string-normalization .

# Check the format of Python code.
fmt-py-check:
	black -l 88 --check .

.PHONY: $(MAKECMDGOALS)
