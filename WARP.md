# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Node.js CLI tool that connects to ETCD, extracts configuration data, filters it based on Exchange values, and generates Mermaid flowchart diagrams. The tool is designed for managing and visualizing complex microservice configurations.

## Common Commands

### Setup and Installation
```bash
npm install
npm install -g @mermaid-js/mermaid-cli
```

### Core Workflow Commands
```bash
# Extract data from ETCD and save as JSON files
node flow-cli.js -g

# Filter configurations and generate flowchart diagrams
node flow-cli.js -e <exchange-name> -o <output-filename> -s <svg-name> -p <png-name>

# Generate diagrams from existing JSON in output/ directory
node flow-cli.js -d <json-filename>
```

### Example Usage
```bash
# Complete workflow example
node flow-cli.js -e moirai.topic.vpn.delete -o resultado -s diagrama -p diagrama

# Generate from existing JSON
node flow-cli.js -d resultado.json
```

## Architecture Overview

### Core Components

**CLI Interface (`flow-cli.js`)**
- Main entry point using Commander.js for argument parsing
- Orchestrates the entire data extraction and diagram generation pipeline
- Manages directory structure validation and creation

**Extractor Module (`extractor/`)**
- `EtcdClient.js`: Connects to ETCD using etcd3 library, filters out keys containing '/env-'
- `JsonSaver.js`: Saves ETCD data as individual JSON files in `./json` directory
- `app.js`: Orchestrates the extraction process

**Reader Module (`reader/`)**
- `JsonFileReader.js`: Reads and parses all JSON files from the extraction phase

**Finder Module (`finder/`)**
- `ExchangeFinder.js`: Filters JSON data based on Exchange values, extracts routing keys
- Uses QuickSort for custom sorting logic that prioritizes non-error routes

**Flowchart Module (`flowchart/`)**
- `MermaidFlowchartGenerator.js`: Generates Mermaid syntax flowcharts and converts to SVG/PNG using mmdc CLI

**Sorting Module (`sorting/`)**
- `QuickSort.js`: Custom comparison logic for routing keys (error routes sorted last, version-based sorting)

### Data Flow

1. **Extraction**: ETCD → JSON files (filtered, excludes '/env-' keys)
2. **Filtering**: JSON files → Filtered results based on Exchange value
3. **Generation**: Filtered results → Mermaid diagram → SVG/PNG files

### Directory Structure
- `./json/`: Raw ETCD data stored as individual JSON files
- `./output/`: Processed results, Mermaid files, and generated diagrams

## Key Technical Details

### ETCD Connection
- Default connection: `127.0.0.1:2379`
- Filters out keys containing '/env-' during extraction
- Automatically closes client connections after operations

### Data Format
The tool expects ETCD values to contain Exchange routing configurations:
```json
{
  "Exchange": "exchange.name",
  "BindingKey": "input.key",
  "OkRoutingKey": "success.route",
  "ErrorRoutingKey": "error.route"
}
```

### Mermaid Generation
- Creates left-to-right flowcharts (`graph LR`)
- Two arrows per item: `next` (success) and `error` paths
- PNG generation uses `--scale 8` for high resolution

## Dependencies

### Core Dependencies
- `etcd3`: ETCD client library
- `commander`: CLI argument parsing
- `@grpc/grpc-js`: gRPC support for ETCD
- `node-etcd`: Alternative ETCD client

### External Tool Requirements
- Mermaid CLI (`@mermaid-js/mermaid-cli`) must be installed globally
- ETCD server must be running and accessible

## Error Handling

### AppArmor Issue Resolution
If encountering Mermaid generation errors with "@zenuml/core Store" messages:
```bash
echo 0 | sudo tee /proc/sys/kernel/apparmor_restrict_unprivileged_userns
```

### Common Validation
- Automatically creates missing directories (`./json`, `./output`)
- Validates JSON folder exists and contains files before processing
- Handles both array and single object ETCD values

## Development Notes

- The codebase uses class-based architecture with clear separation of concerns
- File naming follows the pattern: sanitized ETCD key + `.json`
- Custom sorting prioritizes error routes last and uses version-number comparison
- All async operations are properly awaited in the main execution flow