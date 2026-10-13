# ==============================================================================
# MealMate Infrastructure Makefile — Diagram Automation
# ==============================================================================

SHELL := /bin/bash
ROOT_DIR := $(shell dirname $(shell pwd))
DEMO_DIR := envs/demo
DOCS_DIR := ../docs

.PHONY: all prepare diagram clean

all: diagram

# Step 1: Initialize and validate
prepare:
	@echo "==> [1/4] Initializing and validating Terraform in $(DEMO_DIR)..."
	cd $(DEMO_DIR) && terraform init -backend=false
	cd $(DEMO_DIR) && terraform validate

# Step 2: Technical dependency graph
raw-graph:
	@echo "==> [2/4] Generating raw terraform graph (docs/terraform-graph.svg)..."
	mkdir -p $(DOCS_DIR)
	cd $(DEMO_DIR) && terraform graph | dot -Tsvg -o $(DOCS_DIR)/terraform-graph.svg

# Step 3: Inframap real connections diagram
inframap-graph:
	@echo "==> [3/4] Generating clean connection graph via Inframap (docs/inframap.svg)..."
	mkdir -p $(DOCS_DIR)
	-inframap generate --connections=true $(DEMO_DIR) | dot -Tsvg -o $(DOCS_DIR)/inframap.svg || \
		echo "Warning: inframap failed or not found, continuing..."

# Step 4: Presentation diagram with AWS icons
presentation-diagram:
	@echo "==> [4/4] Generating presentation diagrams (docs/architecture.png & .svg)..."
	mkdir -p $(DOCS_DIR)
	cd $(DEMO_DIR) && terraform plan -out=tfplan -var="db_password=DummyPassword123!"
	cd $(DEMO_DIR) && terraform show -json tfplan > $(DOCS_DIR)/plan.json
	python3 $(DOCS_DIR)/make_diagram.py || python $(DOCS_DIR)/make_diagram.py
	rm -f $(DEMO_DIR)/tfplan

# Master target running steps 2-4 in order
diagram: prepare raw-graph inframap-graph presentation-diagram
	@echo "==> ✅ All architecture diagrams generated successfully in docs/!"
	@echo "    - docs/terraform-graph.svg (debugging)"
	@echo "    - docs/inframap.svg        (review)"
	@echo "    - docs/architecture.png    (presentation)"
	@echo "    - docs/architecture.svg    (presentation vector)"

clean:
	rm -f $(DOCS_DIR)/terraform-graph.svg $(DOCS_DIR)/inframap.svg $(DOCS_DIR)/architecture.png $(DOCS_DIR)/architecture.svg $(DOCS_DIR)/plan.json $(DEMO_DIR)/tfplan
