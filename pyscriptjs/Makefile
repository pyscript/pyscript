tag := latest
git_hash ?= $(shell git log -1 --pretty=format:%h)

base_dir ?= $(shell git rev-parse --show-toplevel)
src_dir ?= $(base_dir)/src
examples ?=  $(base_dir)/examples
app_dir ?= $(shell git rev-parse --show-prefix)

CONDA_ENV ?= ./env
env := $(CONDA_ENV)
conda_run := conda run -p $(env)

setup:
	@if [ -z "$${CONDA_SHLVL:+x}" ]; then echo "Conda is not installed." && exit 1; fi
	$(CONDA_EXE) env $(shell [ -d $(env) ] && echo update || echo create) -p $(env) --file environment.yml

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

test:
	@echo "Tests are coming :( this is a placeholder and it's meant to fail!"
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
