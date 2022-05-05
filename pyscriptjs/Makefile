tag := latest
git_hash ?= $(shell git log -1 --pretty=format:%h)

base_dir ?= $(shell git rev-parse --show-toplevel)
src_dir ?= $(base_dir)/src
examples ?=  $(base_dir)/examples
app_dir ?= $(shell git rev-parse --show-prefix)

CONDA_ENV ?= ./env
env := $(CONDA_ENV)
conda_run := conda run -p $(env)

.PHONY: setup
setup:
	@if [ -z "$${CONDA_SHLVL:+x}" ]; then echo "Conda is not installed." && exit 1; fi
	$(CONDA_EXE) env $(shell [ -d $(env) ] && echo update || echo create) -p $(env) --file environment.yml

.PHONY: clean
clean:
	find . -name \*.py[cod] -delete
	rm -rf .pytest_cache .coverage coverage.xml

clean-all: clean
	rm -rf $(env) *.egg-info

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
	$(conda_run) pytest -vv $(ARGS) tests/ --log-cli-level=warning

.PHONY: test-ts
test-ts:
	@echo "Tests are coming :( this is a placeholder and it's meant to fail!"
	npm run tests

.PHONY: fmt
fmt: fmt-py fmt-ts
	@echo "Format completed"

.PHONY: fmt-check
fmt-check: fmt-ts-check fmt-py-check
	@echo "Format check completed"

.PHONY: fmt-ts
fmt-ts:
	npm run format

.PHONY: fmt-ts-check
fmt-ts-check:
	npm run format:check

.PHONY: fmt-py
fmt-py:
	$(conda_run) black --skip-string-normalization .
	$(conda_run) isort --profile black .

.PHONY: fmt-py-check
fmt-py-check:
	$(conda_run) black -l 88 --check .

.PHONY: lint
lint: lint-ts
	@echo "Format check completed"

.PHONY: lint-ts
lint-ts:
	$(conda_run) npm run lint
