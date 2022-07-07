tag := latest
git_hash ?= $(shell git log -1 --pretty=format:%h)

base_dir ?= $(shell git rev-parse --show-toplevel)
src_dir ?= $(base_dir)/src
examples ?=  ../$(base_dir)/examples
app_dir ?= $(shell git rev-parse --show-prefix)

CONDA_EXE := conda
CONDA_ENV ?= ./env
env := $(CONDA_ENV)
conda_run := $(CONDA_EXE) run -p $(env)
GOOD_NODE_VER := 14
GOOD_NPM_VER := 6
NODE_VER    := $(shell node -v | cut -d. -f1 | sed 's/^v\(.*\)/\1/')
NPM_VER     := $(shell npm -v | cut -d. -f1)

GOOD_NODE   := $(shell if [ $(NODE_VER) -ge $(GOOD_NODE_VER) ]; then echo true; else echo false; fi)
GOOD_NPM    := $(shell if [ $(NPM_VER) -ge $(GOOD_NPM_VER) ]; then echo true; else echo false; fi)

.PHONY: check-node
check-node:
	@echo Build requires Node $(GOOD_NODE_VER).x or higher: $(NODE_VER) detected && $(GOOD_NODE)

.PHONY: check-npm
check-npm:
	@echo Build requires npm $(GOOD_NPM_VER).x or higher: $(NPM_VER) detected && $(GOOD_NPM)

setup:
	make check-node
	make check-npm
	npm install
	$(CONDA_EXE) env $(shell [ -d $(env) ] && echo update || echo create) -p $(env) --file environment.yml
	$(conda_run) playwright install
	$(CONDA_EXE) install -c anaconda pytest

clean:
	find . -name \*.py[cod] -delete
	rm -rf .pytest_cache .coverage coverage.xml

clean-all: clean
	rm -rf $(env) *.egg-info

shell:
	@export CONDA_ENV_PROMPT='<{name}>'
	@echo 'conda activate $(env)'

dev:
	npm run dev

build:
	npm run build

examples:
	mkdir -p ./examples
	cp -r ../examples/* ./examples
	chmod -R 755 examples
	find ./examples/toga -type f -name '*.html' -exec sed -i '' s+https://pyscript.net/alpha/+../../build/+g {} \;
	find ./examples/webgl -type f -name '*.html' -exec sed -i '' s+https://pyscript.net/alpha/+../../../build/+g {} \;
	find ./examples -type f -name '*.html' -exec sed -i '' s+https://pyscript.net/alpha/+../build/+g {} \;

test:
	make examples
	npm run build
	$(conda_run) pytest -vv $(ARGS) tests/ --log-cli-level=warning

test-py:
	@echo "Tests are coming :( this is a placeholder and it's meant to fail!"
	$(conda_run) pytest -vv $(ARGS) tests/ --log-cli-level=warning

test-ts:
	@echo "Tests are coming :( this is a placeholder and it's meant to fail!"
	npm run tests

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

lint: lint-ts
	@echo "Format check completed"

lint-ts:
	$(conda_run) npm run lint

.PHONY: $(MAKECMDGOALS)
