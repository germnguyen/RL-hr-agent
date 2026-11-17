/**
 * Test suite kiểm thử Core DQN: Neural Network, Replay Buffer và DQN Agent trong TypeScript.
 */
import { QNetwork } from './neuralNetwork';
import { ReplayBuffer } from './replayBuffer';
import { DQNAgent } from './dqnAgent';
import { CandidateAction } from '../envs/dqn/types';

function runDqnCoreTests() {
  console.log('=== [TEST SUITE] Kiểm thử Core DQN (QNetwork, ReplayBuffer, DQNAgent) ===\n');

  // 1. Kiểm tra QNetwork (24 input -> 128 -> 64 -> 3 output)
  console.log('[Test 1] Kiểm tra QNetwork...');
  const net = new QNetwork(24, [128, 64], 3, 0.001);
  const sampleState = new Array(24).fill(0).map((_, i) => (i + 1) / 24);
  const qValues = net.forward(sampleState);

  if (!Array.isArray(qValues) || qValues.length !== 3) {
    throw new Error(`QNetwork forward phải trả về 3 giá trị Q, thực tế: ${JSON.stringify(qValues)}`);
  }
  if (qValues.some(v => typeof v !== 'number' || Number.isNaN(v))) {
    throw new Error('QNetwork forward trả về giá trị không hợp lệ (NaN).');
  }
  console.log(`✓ QNetwork forward hợp lệ: Q(s) = [${qValues.map(v => v.toFixed(3)).join(', ')}]`);

  // Kiểm tra lưu và nạp trọng số QNetwork
  const exportedWeights = net.getWeights();
  const net2 = new QNetwork(24, [128, 64], 3);
  net2.setWeights(exportedWeights);
  const qValues2 = net2.forward(sampleState);
  for (let i = 0; i < 3; i++) {
    if (Math.abs(qValues[i] - qValues2[i]) > 1e-6) {
      throw new Error(`Trọng số sao chép không khớp: ${qValues[i]} != ${qValues2[i]}`);
    }
  }
  console.log('✓ QNetwork getWeights() & setWeights() bảo toàn 100% độ chính xác.');

  // 2. Kiểm tra ReplayBuffer
  console.log('\n[Test 2] Kiểm tra ReplayBuffer...');
  const buffer = new ReplayBuffer(100);
  for (let i = 0; i < 150; i++) {
    buffer.push({
      state: new Array(24).fill(i),
      action: i % 3,
      reward: (i % 10) - 5,
      nextState: new Array(24).fill(i + 1),
      done: i % 30 === 0,
    });
  }
  if (buffer.size() !== 100) {
    throw new Error(`ReplayBuffer dung lượng tối đa 100 nhưng size thực tế là ${buffer.size()}`);
  }
  const batch = buffer.sample(16);
  if (batch.length !== 16) {
    throw new Error(`Sample 16 transitions nhưng nhận được ${batch.length}`);
  }
  console.log(`✓ ReplayBuffer ring-buffer hoạt động đúng (Capacity=100, Sample Batch=16).`);

  // 3. Kiểm tra DQNAgent
  console.log('\n[Test 3] Kiểm tra DQNAgent...');
  const agent = new DQNAgent({
    stateDim: 24,
    actionDim: 3,
    hiddenDims: [128, 64],
    learningRate: 0.001,
    gamma: 0.95,
    epsilonStart: 1.0,
    epsilonEnd: 0.05,
    epsilonDecay: 0.99,
    bufferCapacity: 500,
    batchSize: 32,
    targetUpdateFreq: 10,
  });

  // Kiểm tra chọn hành động
  const actionGreedy = agent.selectAction(sampleState, 0.0); // hoàn toàn khai thác
  if (![CandidateAction.REJECT, CandidateAction.ACCEPT, CandidateAction.HOLD].includes(actionGreedy)) {
    throw new Error(`DQNAgent chọn hành động không hợp lệ: ${actionGreedy}`);
  }
  console.log(`✓ DQNAgent selectAction (greedy) = ${CandidateAction[actionGreedy]}`);

  // Nạp dữ liệu vào buffer và thử trainStep
  for (let i = 0; i < 50; i++) {
    agent.remember(
      new Array(24).fill(Math.random()),
      i % 3,
      Math.random() * 4 - 2,
      new Array(24).fill(Math.random()),
      i % 15 === 0
    );
  }
  const loss = agent.trainStep();
  if (typeof loss !== 'number' || Number.isNaN(loss)) {
    throw new Error(`trainStep trả về loss không hợp lệ: ${loss}`);
  }
  console.log(`✓ DQNAgent trainStep tính toán MSE Loss thành công: Loss = ${loss.toFixed(4)}`);

  console.log('\n>>> TẤT CẢ TEST CORE DQN ĐÃ ĐẠT 100%! <<<\n');
}

runDqnCoreTests();
