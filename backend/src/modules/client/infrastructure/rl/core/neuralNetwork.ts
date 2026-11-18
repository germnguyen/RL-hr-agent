/**
 * ============================================================================
 * FILE: neuralNetwork.ts
 * MỤC ĐÍCH: Kiến trúc Mạng Nơ-ron (Multi-Layer Perceptron) thuần TypeScript
 *           phục vụ tính toán hàm giá trị hành động Q(s, a) trong DQN.
 * THIẾT KẾ: 24 input -> Dense(128, ReLU) -> Dense(64, ReLU) -> Dense(3, Linear)
 * OPTIMIZER: Adam (Adaptive Moment Estimation) cho tốc độ hội tụ nhanh và ổn định.
 * ============================================================================
 */

export interface LayerWeights {
  weights: number[][]; // [inDim][outDim]
  biases: number[];    // [outDim]
}

export class DenseLayer {
  public inDim: number;
  public outDim: number;
  public weights: number[][]; // [inDim][outDim]
  public biases: number[];    // [outDim]
  public isOutput: boolean;

  // Trạng thái lưu trữ của Adam Optimizer
  private m_w: number[][];
  private v_w: number[][];
  private m_b: number[];
  private v_b: number[];
  private t: number = 0;

  // Bộ đệm lưu giá trị kích hoạt của forward pass phục vụ backpropagation
  public lastInput: number[] = [];
  public lastZ: number[] = [];
  public lastOutput: number[] = [];

  constructor(inDim: number, outDim: number, isOutput = false) {
    this.inDim = inDim;
    this.outDim = outDim;
    this.isOutput = isOutput;

    // Khởi tạo He Normal (cho ReLU) hoặc Xavier (cho Linear output)
    const std = isOutput ? Math.sqrt(2.0 / (inDim + outDim)) : Math.sqrt(2.0 / inDim);

    this.weights = Array.from({ length: inDim }, () =>
      Array.from({ length: outDim }, () => (Math.random() * 2 - 1) * std)
    );
    this.biases = new Array(outDim).fill(0.01);

    this.m_w = Array.from({ length: inDim }, () => new Array(outDim).fill(0));
    this.v_w = Array.from({ length: inDim }, () => new Array(outDim).fill(0));
    this.m_b = new Array(outDim).fill(0);
    this.v_b = new Array(outDim).fill(0);
  }

  public forward(input: number[]): number[] {
    this.lastInput = [...input];
    const z = new Array(this.outDim).fill(0);

    for (let j = 0; j < this.outDim; j++) {
      let sum = this.biases[j];
      for (let i = 0; i < this.inDim; i++) {
        sum += input[i] * this.weights[i][j];
      }
      z[j] = sum;
    }
    this.lastZ = [...z];

    if (this.isOutput) {
      // Linear Activation cho Q-values
      this.lastOutput = [...z];
    } else {
      // ReLU Activation: max(0, z)
      this.lastOutput = z.map(v => (v > 0 ? v : 0.01 * v)); // Leaky ReLU chống dying neuron
    }

    return this.lastOutput;
  }

  public backward(gradOutput: number[], lr: number): number[] {
    // 1. Tính đạo hàm qua hàm kích hoạt
    const dZ = new Array(this.outDim).fill(0);
    for (let j = 0; j < this.outDim; j++) {
      if (this.isOutput) {
        dZ[j] = gradOutput[j];
      } else {
        dZ[j] = this.lastZ[j] > 0 ? gradOutput[j] : 0.01 * gradOutput[j];
      }
    }

    // 2. Tính gradient cho input (truyền ngược lại tầng trước)
    const gradInput = new Array(this.inDim).fill(0);
    for (let i = 0; i < this.inDim; i++) {
      let sum = 0;
      for (let j = 0; j < this.outDim; j++) {
        sum += dZ[j] * this.weights[i][j];
      }
      gradInput[i] = sum;
    }

    // 3. Cập nhật weights và biases bằng Adam Optimizer
    this.t += 1;
    const beta1 = 0.9;
    const beta2 = 0.999;
    const eps = 1e-8;

    for (let j = 0; j < this.outDim; j++) {
      const gradB = dZ[j];
      this.m_b[j] = beta1 * this.m_b[j] + (1 - beta1) * gradB;
      this.v_b[j] = beta2 * this.v_b[j] + (1 - beta2) * gradB * gradB;
      const mHatB = this.m_b[j] / (1 - Math.pow(beta1, this.t));
      const vHatB = this.v_b[j] / (1 - Math.pow(beta2, this.t));
      this.biases[j] -= (lr * mHatB) / (Math.sqrt(vHatB) + eps);

      for (let i = 0; i < this.inDim; i++) {
        const gradW = this.lastInput[i] * dZ[j];
        this.m_w[i][j] = beta1 * this.m_w[i][j] + (1 - beta1) * gradW;
        this.v_w[i][j] = beta2 * this.v_w[i][j] + (1 - beta2) * gradW * gradW;
        const mHatW = this.m_w[i][j] / (1 - Math.pow(beta1, this.t));
        const vHatW = this.v_w[i][j] / (1 - Math.pow(beta2, this.t));
        this.weights[i][j] -= (lr * mHatW) / (Math.sqrt(vHatW) + eps);
      }
    }

    return gradInput;
  }

  public getWeights(): LayerWeights {
    return {
      weights: this.weights.map(row => [...row]),
      biases: [...this.biases],
    };
  }

  public setWeights(w: LayerWeights): void {
    this.weights = w.weights.map(row => [...row]);
    this.biases = [...w.biases];
  }
}

export class QNetwork {
  public layers: DenseLayer[] = [];
  public lr: number;

  constructor(
    public inputDim: number = 24,
    public hiddenDims: number[] = [128, 64],
    public outputDim: number = 3,
    lr: number = 0.0005
  ) {
    this.lr = lr;
    const dims = [inputDim, ...hiddenDims, outputDim];
    for (let i = 0; i < dims.length - 1; i++) {
      const isOut = i === dims.length - 2;
      this.layers.push(new DenseLayer(dims[i], dims[i + 1], isOut));
    }
  }

  public forward(state: number[]): number[] {
    let cur = state;
    for (const layer of this.layers) {
      cur = layer.forward(cur);
    }
    return cur;
  }

  public trainOnGradient(gradOutput: number[]): void {
    let grad = gradOutput;
    for (let i = this.layers.length - 1; i >= 0; i--) {
      grad = this.layers[i].backward(grad, this.lr);
    }
  }

  public getWeights(): LayerWeights[] {
    return this.layers.map(l => l.getWeights());
  }

  public setWeights(weights: LayerWeights[]): void {
    if (weights.length !== this.layers.length) {
      throw new Error(`Số tầng trọng số (${weights.length}) không khớp với mạng (${this.layers.length})`);
    }
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].setWeights(weights[i]);
    }
  }

  public copyWeightsFrom(source: QNetwork, tau: number = 1.0): void {
    const srcWeights = source.getWeights();
    if (tau >= 1.0) {
      this.setWeights(srcWeights);
    } else {
      // Polyak soft update: target = tau * source + (1 - tau) * target
      for (let l = 0; l < this.layers.length; l++) {
        const dest = this.layers[l];
        const src = srcWeights[l];
        for (let i = 0; i < dest.inDim; i++) {
          for (let j = 0; j < dest.outDim; j++) {
            dest.weights[i][j] = tau * src.weights[i][j] + (1 - tau) * dest.weights[i][j];
          }
        }
        for (let j = 0; j < dest.outDim; j++) {
          dest.biases[j] = tau * src.biases[j] + (1 - tau) * dest.biases[j];
        }
      }
    }
  }
}
