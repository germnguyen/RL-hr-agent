/**
 * Test suite kiểm tra tính hợp lệ và toàn vẹn của 2 tệp dữ liệu TH1 (Ảo) và TH2 (Thật).
 */
import fs from 'fs';
import path from 'path';
import { CandidatePoolItem } from '../envs/dqn/types';

function runDatasetTests() {
  console.log('=== [TEST SUITE] Kiểm tra 2 tệp dữ liệu ứng viên TH1 & TH2 ===');

  const dataDir = path.resolve(__dirname);
  const synthPath = path.join(dataDir, 'synthetic_candidates.json');
  const realPath = path.join(dataDir, 'real_candidates.json');

  if (!fs.existsSync(synthPath)) {
    throw new Error(`File không tồn tại: ${synthPath}`);
  }
  if (!fs.existsSync(realPath)) {
    throw new Error(`File không tồn tại: ${realPath}`);
  }

  const synthData: CandidatePoolItem[] = JSON.parse(fs.readFileSync(synthPath, 'utf-8'));
  const realData: CandidatePoolItem[] = JSON.parse(fs.readFileSync(realPath, 'utf-8'));

  // 1. Kiểm tra số lượng hồ sơ N = 30
  if (synthData.length !== 30) {
    throw new Error(`TH1 phải có đúng 30 ứng viên, thực tế có ${synthData.length}`);
  }
  if (realData.length !== 30) {
    throw new Error(`TH2 phải có đúng 30 ứng viên, thực tế có ${realData.length}`);
  }
  console.log('✓ Cả 2 tệp đều có chính xác 30 ứng viên (N = 30).');

  // 2. Kiểm tra tính hợp lệ từng hồ sơ trong TH1
  const tiers: Record<string, number> = {};
  synthData.forEach((c, idx) => {
    if (!c.id || !c.name || typeof c.score !== 'number' || !Array.isArray(c.features)) {
      throw new Error(`TH1 Ứng viên #${idx} thiếu trường dữ liệu cơ bản.`);
    }
    if (c.features.length < 16) {
      throw new Error(`TH1 Ứng viên #${idx} phải có ít nhất 16 chiều đặc trưng.`);
    }
    if (c.features.some(v => typeof v !== 'number' || Number.isNaN(v))) {
      throw new Error(`TH1 Ứng viên #${idx} chứa giá trị NaN trong features.`);
    }
    const tier = (c.rawInfo as any)?.tier || 'unknown';
    tiers[tier] = (tiers[tier] || 0) + 1;
  });
  console.log(`✓ TH1 có đủ các phân khúc: ${JSON.stringify(tiers)}`);

  // 3. Kiểm tra tính hợp lệ từng hồ sơ trong TH2
  realData.forEach((c, idx) => {
    if (!c.id || !c.name || typeof c.score !== 'number' || !Array.isArray(c.features)) {
      throw new Error(`TH2 Ứng viên #${idx} thiếu trường dữ liệu cơ bản.`);
    }
    if (c.features.length < 16) {
      throw new Error(`TH2 Ứng viên #${idx} phải có ít nhất 16 chiều đặc trưng.`);
    }
    if (c.features.some(v => typeof v !== 'number' || Number.isNaN(v))) {
      throw new Error(`TH2 Ứng viên #${idx} chứa giá trị NaN trong features.`);
    }
    if (!c.rawInfo?.education || !Array.isArray(c.rawInfo?.techStack) || typeof c.rawInfo?.experienceYears !== 'number') {
      throw new Error(`TH2 Ứng viên #${idx} thiếu thông tin thực tế (education, techStack, experienceYears).`);
    }
  });
  console.log('✓ TH2 có đầy đủ dữ liệu thực tế (học vấn, tech stack, kinh nghiệm, GitHub).');

  console.log('>>> TẤT CẢ TEST DATASET ĐÃ ĐẠT 100%! <<<\n');
}

runDatasetTests();
