tag := latest
git_hash ?= $(shell git log -1 --pretty=format:%h)

base_dir ?= $(shell git rev-parse --show-toplevel)
src_dir ?= $(base_dir)/pyscriptjs/src
examples ?=  ../$(base_dir)/examples
app_dir ?= $(shell git rev-parse --show-prefix)

CONDA_EXE := conda
CONDA_ENV ?= $(base_dir)/pyscriptjs/env
env := $(CONDA_ENV)
conda_run := $(CONDA_EXE) run -p $(env)
PYTEST_EXE := $(CONDA_ENV)/bin/pytest

MIN_NODE_VER := 14
MIN_NPM_VER := 6
NODE_VER    := $(shell node -v | cut -d. -f1 | sed 's/^v\(.*\)/\1/')
NPM_VER     := $(shell npm -v | cut -d. -f1)

ifeq ($(shell uname -s), Darwin)
    SED_I_ARG := -i ''
else
    SED_I_ARG := -i
endif

.PHONY: check-node
check-node:
	@if [ $(NODE_VER) -lt $(MIN_NODE_VER) ]; then \
		echo "Build requires Node $(MIN_NODE_VER).x or higher: $(NODE_VER) detected"; \
		false; \
	fi

.PHONY: check-npm
check-npm:
	@if [ $(NPM_VER) -lt $(MIN_NPM_VER) ]; then \
		echo "Build requires Node $(MIN_NPM_VER).x or higher: $(NPM_VER) detected"; \
		false; \
	fi

setup: check-node check-npm
	cd pyscript.core && npm install && cd ..
	$(CONDA_EXE) env $(shell [ -d $(env) ] && echo update || echo create) -p $(env) --file environment.yml
	$(conda_run) playwright install
	$(CONDA_EXE) install -c anaconda pytest -y

clean:
	find . -name \*.py[cod] -delete
	rm -rf .pytest_cache .coverage coverage.xml

clean-all: clean
	rm -rf $(env) *.egg-info

shell:
	@export CONDA_ENV_PROMPT='<{name}>'
	@echo 'conda activate $(env)'

dev:
	cd pyscript.core && npm run dev

build:
	cd pyscript.core && npm run build

# use the following rule to do all the checks done by precommit: in
# particular, use this if you want to run eslint.
precommit-check:
	pre-commit run --all-files

examples:
	mkdir -p ./examples
	cp -r ../examples/* ./examples
	chmod -R 755 examples
	find ./examples/toga -type f -name '*.html' -exec sed $(SED_I_ARG) s+https://pyscript.net/latest/+../../build/+g {} \;
	find ./examples/webgl -type f -name '*.html' -exec sed $(SED_I_ARG) s+https://pyscript.net/latest/+../../../build/+g {} \;
	find ./examples -type f -name '*.html' -exec sed $(SED_I_ARG) s+https://pyscript.net/latest/+../build/+g {} \;
	npm run build
	rm -rf ./examples/build
	mkdir -p ./examples/build
	cp -R ./build/* ./examples/build
	@echo "To serve examples run: $(conda_run) python -m http.server 8080 --directory examples"

# run prerequisites and serve pyscript examples at http://localhost:8000/examples/
run-examples: setup build examples
	make examples
	npm install
	make dev

# run all integration tests *including examples* sequentially
# TODO: (fpliger) The cd pyscript.core before running the tests shouldn't be needed but for
# 		but for some reason it seems to bother pytest tmppaths (or test cache?). Unclear.
test-integration:
	mkdir -p test_results
	$(PYTEST_EXE) -vv $(ARGS) pyscript.core/tests/integration/ --log-cli-level=warning --junitxml=test_results/integration.xml

# run all integration tests *except examples* in parallel (examples use too much memory)
test-integration-parallel:
	mkdir -p test_results
	$(PYTEST_EXE) --numprocesses auto -vv $(ARGS) pyscript.core/tests/integration/ --log-cli-level=warning --junitxml=test_results/integration.xml

# run integration tests on only examples sequentially (to avoid running out of memory)
test-examples:
	mkdir -p test_results
	$(PYTEST_EXE) -vv $(ARGS) pyscript.core/tests/integration/ --log-cli-level=warning --junitxml=test_results/integration.xml -k 'zz_examples'

test-py:
	@echo "Tests from $(src_dir)"
	mkdir -p test_results
	$(PYTEST_EXE) -vv $(ARGS) tests/py-unit/ --log-cli-level=warning --junitxml=test_results/py-unit.xml

test-ts:
	npm run test

fmt: fmt-py fmt-ts
	@echo "Format completed"

fmt-check: fmt-ts-check fmt-py-check
	@echo "Format check completed"

fmt-ts:
	npm run format

fmt-ts-check:
	npm run format:check

fmt-py:
	$(conda_run) black --skip-string-normalization .
	$(conda_run) isort --profile black .

fmt-py-check:
	$(conda_run) black -l 88 --check .

.PHONY: $(MAKECMDGOALS)
