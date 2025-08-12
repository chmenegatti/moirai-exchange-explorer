const { Command } = require('commander');
const path = require('path');
const Extractor = require('./extractor/app');
const JsonFileReader = require('./reader/JsonFileReader');
const ExchangeFinder = require('./finder/ExchangeFinder');
const MermaidFlowchartGenerator = require('./flowchart/MermaidFlowchartGenerator');

const program = new Command();

program
  .option('-g', 'Get data from etcd and save as JSON')
  .option('-e, --exchange <exchange>', 'Exchange name to find')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('-p, --png <pngname>', 'Generate PNG with given name')
  .option('-s, --svg <svgname>', 'Generate SVG with given name')
  .option('-d, --diagram <jsonfile>', 'Gera imagens do diagrama a partir de um JSON já existente');

program.parse(process.argv);

const options = program.opts();

const jsonDir = './json';
const outputDir = './output';

const runExtractor = async () => {
  const etcdHosts = '127.0.0.1:2379';
  const outputDir = './json';
  const extract = new Extractor(etcdHosts, outputDir);
  await extract.run();
}

const checkOutputFolder = () => {
  const fs = require('fs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
}

const checkJsonFolder = () => {
  const fs = require('fs');
  if (!fs.existsSync(jsonDir)) {
    console.error('A pasta json não existe. Por favor, execute com a flag -g primeiro.');
    process.exit(1);
  }

  const files = fs.readdirSync(jsonDir);
  if (files.length === 0) {
      console.error('A pasta json está vazia. Por favor, execute com a flag -g primeiro.');
      process.exit(1);
  }
}

const runMain = async () => {
  if (options.g) {
    await runExtractor();
  } else {
    checkJsonFolder();
  }

  checkOutputFolder();

  if (options.exchange && options.output) {
    // ...existing code...
    const reader = new JsonFileReader(jsonDir);
    const jsonData = await reader.readFiles();
    const finder = new ExchangeFinder(jsonData, options.output);
    const results = await finder.find(options.exchange);
    const generator = new MermaidFlowchartGenerator(results);
    await generator.generate(options.output);
    if (options.png) {
      const pngFilename = path.join(outputDir, `${options.png}`);
      await generator.generatePNG(options.output, pngFilename);
    }
    if (options.svg) {
      const svgFilename = path.join(outputDir,`${options.svg}`);
      await generator.generateSVG(options.output, svgFilename);
    }
  }

  // Nova flag para gerar imagens a partir de um JSON já existente
  if (options.diagram) {
    const fs = require('fs');
    const jsonPath = path.join(outputDir, options.diagram);
    if (!fs.existsSync(jsonPath)) {
      console.error(`Arquivo JSON não encontrado: ${jsonPath}`);
      process.exit(1);
    }
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const generator = new MermaidFlowchartGenerator(content);
    // Nome base sem extensão
    const baseName = path.parse(options.diagram).name;
    await generator.generate(baseName);
    await generator.generateSVG(baseName, path.join(outputDir, baseName));
    await generator.generatePNG(baseName, path.join(outputDir, baseName));
    console.log(`Imagens geradas para ${baseName} em output/`);
  }
}
runMain().catch(error => {
  console.error(`Erro ao executar a aplicação: ${error.message}`);
});