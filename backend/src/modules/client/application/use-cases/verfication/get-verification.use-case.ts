import { IVerificationProps } from '../../../domain/verifycation';
import { IVerificationRepository } from '../../../application/ports/repositories/verification.interface';

export class GetVerificationUseCase {
  constructor(private readonly candidateRepo: IVerificationRepository) { }

  async execute(candidateID: string): Promise<IVerificationProps | null> {
    if (!candidateID) throw new Error("Thiếu candidateID!");

    const verifyCandidate = await this.candidateRepo.getByCandidateId(candidateID);

    if (!verifyCandidate) {
      return null;
    }

    return verifyCandidate.getDetail();
  }
}
