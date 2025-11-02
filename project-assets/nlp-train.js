/**
 * NLP TRAINING SCRIPT
 * Trains the intent classification model
 */

const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');

const { logger } = require('../../src/utils/logger');

// Configuration
const config = {
  modelPath: './nlp/models/intent_classifier',
  trainingDataPath: './nlp/training/intents.json',
  epochs: 50,
  batchSize: 32,
  validationSplit: 0.2,
  vocabularySize: 10000,
  maxSequenceLength: 50,
  embeddingDim: 100
};

// Ensure model directory exists
if (!fs.existsSync(config.modelPath)) {
  fs.mkdirSync(config.modelPath, { recursive: true });
}

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * Load training data
 */
function loadTrainingData() {
  console.log('📖 Loading training data...');
  
  const dataPath = path.join(config.trainingDataPath);
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Training data not found at ${dataPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  return rawData.intents || [];
}

/**
 * Preprocess text
 */
function preprocessText(text) {
  const lowercased = text.toLowerCase().trim();
  const tokens = tokenizer.tokenize(lowercased);
  const stemmed = tokens.map(token => stemmer.stem(token));
  return stemmed;
}

/**
 * Build vocabulary from training data
 */
function buildVocabulary(intents) {
  console.log('📚 Building vocabulary...');
  
  const wordFreq = {};
  const intentLabels = {};
  let intentIndex = 0;

  intents.forEach((intent, idx) => {
    intentLabels[intent.intent] = intentIndex++;

    intent.examples.forEach(example => {
      const tokens = preprocessText(example);
      tokens.forEach(token => {
        wordFreq[token] = (wordFreq[token] || 0) + 1;
      });
    });
  });

  // Sort by frequency and keep top N words
  const wordIndex = {};
  let idx = 1;

  Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, config.vocabularySize - 1)
    .forEach(([word]) => {
      wordIndex[word] = idx++;
    });

  console.log(`✅ Vocabulary built: ${Object.keys(wordIndex).length} words`);

  return { wordIndex, intentLabels };
}

/**
 * Convert text to sequence
 */
function textToSequence(text, wordIndex) {
  const tokens = preprocessText(text);
  const sequence = tokens
    .map(token => wordIndex[token] || 0)
    .slice(0, config.maxSequenceLength);

  // Pad sequence
  while (sequence.length < config.maxSequenceLength) {
    sequence.push(0);
  }

  return sequence;
}

/**
 * Prepare training data
 */
function prepareTrainingData(intents, wordIndex, intentLabels) {
  console.log('🔧 Preparing training data...');
  
  const sequences = [];
  const labels = [];

  intents.forEach(intent => {
    const intentIdx = intentLabels[intent.intent];

    intent.examples.forEach(example => {
      const sequence = textToSequence(example, wordIndex);
      sequences.push(sequence);
      labels.push(intentIdx);
    });
  });

  console.log(`✅ Prepared ${sequences.length} training samples`);

  return {
    X: tf.tensor2d(sequences),
    y: tf.tensor1d(labels, 'int32')
  };
}

/**
 * Create and compile model
 */
function createModel(numClasses) {
  console.log('🧠 Creating neural network model...');
  
  const model = tf.sequential({
    layers: [
      // Embedding layer
      tf.layers.embedding({
        inputDim: config.vocabularySize,
        outputDim: config.embeddingDim,
        inputLength: config.maxSequenceLength
      }),
      // Bidirectional LSTM
      tf.layers.bidirectional({
        layer: tf.layers.lstm({
          units: 128,
          returnSequences: false
        })
      }),
      // Dense layer with ReLU
      tf.layers.dense({
        units: 64,
        activation: 'relu'
      }),
      // Dropout for regularization
      tf.layers.dropout({ rate: 0.5 }),
      // Output layer
      tf.layers.dense({
        units: numClasses,
        activation: 'softmax'
      })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('✅ Model created and compiled');
  return model;
}

/**
 * Train the model
 */
async function trainModel(model, X, y, numIntents) {
  console.log(`🚀 Training model for ${config.epochs} epochs...\n`);
  
  const history = await model.fit(X, y, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    verbose: 1,
    shuffleBufferSize: 1000
  });

  console.log('\n✅ Training completed');
  return history;
}

/**
 * Evaluate the model
 */
async function evaluateModel(model, X, y) {
  console.log('\n📊 Evaluating model...');
  
  const evaluation = model.evaluate(X, y);
  const [loss, accuracy] = await Promise.all([
    evaluation[0].data(),
    evaluation[1].data()
  ]);

  console.log(`Evaluation Results:`);
  console.log(`  Loss: ${loss[0].toFixed(4)}`);
  console.log(`  Accuracy: ${(accuracy[0] * 100).toFixed(2)}%`);

  evaluation[0].dispose();
  evaluation[1].dispose();

  return { loss: loss[0], accuracy: accuracy[0] };
}

/**
 * Save model and metadata
 */
async function saveModel(model, wordIndex, intentLabels) {
  console.log('\n💾 Saving model...');
  
  const modelPath = `file://${path.resolve(config.modelPath)}`;
  await model.save(modelPath);

  // Save word index and intent labels
  fs.writeFileSync(
    path.join(config.modelPath, 'word_index.json'),
    JSON.stringify(wordIndex, null, 2)
  );

  fs.writeFileSync(
    path.join(config.modelPath, 'intent_labels.json'),
    JSON.stringify(intentLabels, null, 2)
  );

  // Save training metadata
  const metadata = {
    trainingDate: new Date().toISOString(),
    vocabularySize: Object.keys(wordIndex).length,
    maxSequenceLength: config.maxSequenceLength,
    embeddingDim: config.embeddingDim,
    epochs: config.epochs,
    batchSize: config.batchSize,
    intents: Object.keys(intentLabels).length,
    config: config
  };

  fs.writeFileSync(
    path.join(config.modelPath, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`✅ Model saved to ${config.modelPath}`);
  console.log(`   - model.json`);
  console.log(`   - model.weights.bin`);
  console.log(`   - word_index.json`);
  console.log(`   - intent_labels.json`);
  console.log(`   - metadata.json`);
}

/**
 * Main training function
 */
async function main() {
  try {
    console.log('🎓 University Chatbot NLP Training');
    console.log('='.repeat(50));
    console.log();

    // Step 1: Load training data
    const intents = loadTrainingData();
    console.log(`✅ Loaded ${intents.length} intent categories`);
    console.log();

    // Step 2: Build vocabulary
    const { wordIndex, intentLabels } = buildVocabulary(intents);
    console.log();

    // Step 3: Prepare training data
    const { X, y } = prepareTrainingData(intents, wordIndex, intentLabels);
    console.log();

    // Step 4: Create model
    const model = createModel(Object.keys(intentLabels).length);
    console.log();

    // Step 5: Train model
    const history = await trainModel(model, X, y, Object.keys(intentLabels).length);
    console.log();

    // Step 6: Evaluate model
    const evaluation = await evaluateModel(model, X, y);
    console.log();

    // Step 7: Save model
    await saveModel(model, wordIndex, intentLabels);
    console.log();

    // Cleanup
    X.dispose();
    y.dispose();

    console.log('='.repeat(50));
    console.log('🎉 Training completed successfully!');
    console.log();
    console.log(`Final Metrics:`);
    console.log(`  Accuracy: ${(evaluation.accuracy * 100).toFixed(2)}%`);
    console.log(`  Loss: ${evaluation.loss.toFixed(4)}`);
    console.log(`  Intent Classes: ${Object.keys(intentLabels).length}`);
    console.log(`  Vocabulary Size: ${Object.keys(wordIndex).length}`);
    console.log();
    console.log('Start the server with: npm start');

  } catch (error) {
    console.error('❌ Training failed:', error);
    process.exit(1);
  }
}

// Run training
main();
