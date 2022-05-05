tag := latest
git_hash ?= $(shell git log -1 --pretty=format:%h)

base_dir ?= $(shell git rev-parse --show-toplevel)
src_dir ?= $(base_dir)/src
examples ?=  $(base_dir)/examples
app_dir ?= $(shell git rev-parse --show-prefix)

CONDA_ENV ?= ./env
env := $(CONDA_ENV)
conda_run := conda run -p $(env)

.PHONY: clean
clean:
	find . -name \*.py[cod] -delete
	rm -rf .pytest_cache .coverage coverage.xml

clean-all: clean
	rm -rf $(env) *.egg-info

.PHONY: setup
setup:
	@if [ -z "$${CONDA_SHLVL:+x}" ]; then echo "Conda is not installed." && exit 1; fi
	$(CONDA_EXE) env $(shell [ -d $(env) ] && echo update || echo create) -p $(env) --file environmentwh.yml

.PHONY: shell
shell:
	@export CONDA_ENV_PROMPT='<{name}>'
	@echo 'conda activate $(env)'

.PHONY: dev
dev:
	npm run dev

.PHONY: build
build:
	npm run build

.PHONY: test
test:
	@echo "Tests are coming :( this is a placeholder and it's meant to fail!"
	$(conda_run) pytest -vv $(ARGS) tests/ --log-cli-level=warning

.PHONY: test-py
test-py:
	@echo "Tests are coming :( this is a placeholder and it's meant to fail!"
	$(env)/bin/pytest -vv $(ARGS) tests/ --log-cli-level=warning

.PHONY: test-ts
test-ts:
	@echo "Tests are coming :( this is a placeholder and it's meant to fail!"
	npm run tests

.PHONY: fmt
fmt:
	$(env)/bin/black -l 88 .

.PHONY: fmt-check
fmt-check:
	$(env)/bin/black -l 88 --check .

.PHONY: fmt-ts
fmt-ts:
	npm run format

.PHONY: fmt-ts-check
fmt-ts-check:
	npm run format:check

.PHONY: fmt-py
fmt-py:
	$(env)/bin/black -l 88 .

.PHONY: fmt-py-check
fmt-py-check:
	$(env)/bin/black -l 88 --check .

.PHONY: lint
lint:
	npm run lint

.PHONY: lint-js
lint-js:
	npm run lint