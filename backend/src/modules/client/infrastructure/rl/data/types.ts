import { CandidatePoolItem } from '../envs/dqn/types';

export interface DatasetFile {
  type: 'synthetic' | 'real';
  jobTitle: string;
  totalCandidates: number;
  candidates: CandidatePoolItem[];
}
